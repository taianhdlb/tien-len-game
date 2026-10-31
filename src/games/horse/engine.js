import { COLORS, COLOR_SETS, TRACK_LENGTH, describeCell, trackIndex } from './board.js';

export const MAX_PLAYERS = 4;
export const HORSES_PER_PLAYER = 4;
export const MAX_LOGS = 120;

// Cả ván chỉ dùng một viên D6.
export const DEPLOY_FACES = [1, 6];
export const ROLL_AGAIN_FACE = 6;
// Vào chuồng theo thứ tự: quân đầu phải tung đúng 6, rồi 5, 4, 3.
export const HOME_FACES = [6, 5, 4, 3];
const GATE_POS = TRACK_LENGTH - 1;

export class GameError extends Error {}

const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

const fail = (message) => {
  throw new GameError(message);
};

export const isActive = (player) => Boolean(player) && !player.left;
export const activePlayers = (state) => state.players.filter(isActive);
export const currentPlayer = (state) => state.players[state.currentTurn];
export const homeCount = (player) => (player?.horses || []).filter((horse) => horse.status === 'HOME').length;
export const homeFaceFor = (player) => HOME_FACES[homeCount(player)] ?? null;
export const canDeploy = (die) => DEPLOY_FACES.includes(die);

/** "Sát nút": có quân đối thủ đứng ngay ô trước mặt — chỉ dùng để hiển thị, không đổi luật. */
export function isSatNut(state, player, horse) {
  if (!player?.color || horse?.status !== 'TRACK') return false;
  const ahead = trackIndex(player.color, (horse.pos + 1) % TRACK_LENGTH);
  return state.players.some(
    (other) =>
      other.id !== player.id &&
      !other.left &&
      (other.horses || []).some((entry) => entry.status === 'TRACK' && trackIndex(other.color, entry.pos) === ahead)
  );
}

export function createInitialState(id) {
  return {
    id,
    type: 'HORSE',
    status: 'WAITING',
    version: 1,
    players: [],
    logs: [],
    logSeq: 0,
    currentTurn: 0,
    die: null,
    rollSeq: 0,
    pending: null,
    bonusRolls: 0,
    turnNumber: 1,
    winnerId: null,
    winReason: null
  };
}

function log(state, text, tone = 'info') {
  state.logSeq = (state.logSeq || 0) + 1;
  state.logs = [...(state.logs || []), { id: state.logSeq, text, tone }].slice(-MAX_LOGS);
}

const colorLabel = (player) => COLORS[player.color]?.label ?? '?';
const horseLabel = (player, horseId) => {
  const index = player.horses.findIndex((horse) => horse.id === horseId);
  return `Ngựa ${index + 1}`;
};

function rollDie(rng) {
  return 1 + Math.floor(Math.max(0, Math.min(0.999999, rng())) * 6);
}

function opponentsAt(state, player, target) {
  if (target.status !== 'TRACK') return [];
  const absolute = trackIndex(player.color, target.pos);
  const hits = [];
  for (const other of state.players) {
    if (other.id === player.id || other.left) continue;
    for (const horse of other.horses || []) {
      if (horse.status === 'TRACK' && trackIndex(other.color, horse.pos) === absolute) {
        hits.push({ playerId: other.id, name: other.name, horseId: horse.id });
      }
    }
  }
  return hits;
}

function buildMove(state, player, horse, target, kind, value) {
  return { horseId: horse.id, kind, value, target, captures: opponentsAt(state, player, target) };
}

/**
 * Nước đi hợp lệ của một lần tung: ra 1 hoặc 6 thì được xuất chuồng (chỉ một quân, ô đích như nhau),
 * quân đang đua đi đúng số chấm và không được vượt cổng, quân đứng ở cổng chỉ vào chuồng khi đúng số.
 */
export function listMoves(state, player, die) {
  if (!player || !Number.isInteger(die)) return [];
  const moves = [];
  const seen = new Set();
  const push = (move) => {
    const key = `${move.horseId}:${move.target.status}:${move.target.pos}`;
    if (seen.has(key)) return;
    seen.add(key);
    moves.push(move);
  };

  if (canDeploy(die)) {
    const yard = (player.horses || []).find((horse) => horse.status === 'YARD');
    if (yard) push(buildMove(state, player, yard, { status: 'TRACK', pos: 0 }, 'DEPLOY', 0));
  }

  const home = homeCount(player);
  const face = HOME_FACES[home] ?? null;
  for (const horse of player.horses || []) {
    if (horse.status !== 'TRACK') continue;
    if (horse.pos === GATE_POS) {
      if (die === face) push(buildMove(state, player, horse, { status: 'HOME', pos: home + 1 }, 'HOME', die));
      continue;
    }
    const next = horse.pos + die;
    if (next <= GATE_POS) push(buildMove(state, player, horse, { status: 'TRACK', pos: next }, 'TRACK', die));
  }
  return moves;
}

function grantBonus(state, player, reason) {
  state.bonusRolls = (state.bonusRolls || 0) + 1;
  log(state, `${player.name} ${reason} nên được tung tiếp.`, 'gold');
}

function nextActiveIndex(state) {
  const total = state.players.length;
  for (let offset = 1; offset <= total; offset++) {
    const index = (state.currentTurn + offset) % total;
    if (!state.players[index].left) return index;
  }
  return state.currentTurn;
}

function endTurn(state) {
  state.pending = null;
  state.bonusRolls = 0;
  state.currentTurn = nextActiveIndex(state);
  state.turnNumber = (state.turnNumber || 1) + 1;
  const next = currentPlayer(state);
  if (next) log(state, `Lượt của ${next.name} · ${colorLabel(next)}.`, 'muted');
}

function finish(state, player) {
  state.status = 'FINISHED';
  state.pending = null;
  state.winnerId = player.id;
  state.winReason = 'ALL_HOME';
  log(state, `${player.name} đưa đủ 4 ngựa vào chuồng và thắng ván này!`, 'victory');
}

function applyMove(state, player, move) {
  const horse = player.horses.find((entry) => entry.id === move.horseId);
  if (!horse) fail('Không tìm thấy quân cờ.');

  horse.status = move.target.status;
  horse.pos = move.target.pos;
  state.pending = null;

  const label = horseLabel(player, horse.id);
  if (move.kind === 'DEPLOY') log(state, `${player.name} xuất chuồng ${label} ra ô xuất phát.`, 'success');
  else if (move.kind === 'HOME') log(state, `${player.name} đưa ${label} vào chuồng bậc ${horse.pos}.`, 'success');
  else log(state, `${player.name} đưa ${label} tới ${describeCell(player.color, move.target)}.`, 'info');

  if (move.captures.length > 0) {
    for (const other of state.players) {
      for (const entry of other.horses || []) {
        if (!move.captures.some((hit) => hit.horseId === entry.id)) continue;
        entry.status = 'YARD';
        entry.pos = -1;
      }
    }
    const victims = [...new Set(move.captures.map((hit) => hit.name))].join(', ');
    log(state, `${player.name} đá ${move.captures.length} quân của ${victims} về chuồng!`, 'danger');
  }

  if (homeCount(player) === HORSES_PER_PLAYER) {
    finish(state, player);
    return;
  }

  if (move.kind === 'DEPLOY') grantBonus(state, player, 'xuất chuồng');
  else if (state.die === ROLL_AGAIN_FACE) grantBonus(state, player, `tung được ${ROLL_AGAIN_FACE}`);
  else endTurn(state);
}

function start(state, playerId) {
  if (state.status !== 'WAITING') fail('Trận đấu đã bắt đầu.');
  const active = activePlayers(state);
  const host = active[0];
  if (!host || host.id !== playerId) fail('Chỉ chủ phòng mới có thể bắt đầu!');
  if (active.length < 2) fail('Cần ít nhất 2 người chơi để bắt đầu.');
  if (active.length > MAX_PLAYERS) fail('Phòng chỉ hỗ trợ tối đa 4 người chơi.');

  const colors = COLOR_SETS[active.length];
  state.players = active.map((entry, index) => ({
    id: entry.id,
    name: entry.name,
    classId: 'horse',
    connected: entry.connected !== false,
    left: false,
    color: colors[index],
    horses: Array.from({ length: HORSES_PER_PLAYER }, (_, slot) => ({
      id: `${entry.id}-h${slot + 1}`,
      status: 'YARD',
      pos: -1,
      slot
    }))
  }));
  state.status = 'PLAYING';
  state.currentTurn = 0;
  state.turnNumber = 1;
  state.bonusRolls = 0;
  state.die = null;
  state.rollSeq = 0;
  state.pending = null;
  state.winnerId = null;
  state.winReason = null;

  log(state, `Trận đua bắt đầu với ${state.players.length} kỵ sĩ!`, 'victory');
  log(state, state.players.map((p) => `${COLORS[p.color].label}: ${p.name}`).join(' · '), 'gold');
  log(state, `${host.name} là chủ phòng nên tung xúc xắc trước.`, 'muted');
}

function roll(state, playerId, rng) {
  if (state.status !== 'PLAYING') fail('Trận đấu chưa diễn ra.');
  const player = currentPlayer(state);
  if (!player || player.id !== playerId) fail('Chưa tới lượt của bạn!');
  if (state.pending) fail('Hãy chọn nước đi trước khi tung tiếp.');

  const die = rollDie(rng);
  state.die = die;
  state.rollSeq = (state.rollSeq || 0) + 1;
  log(state, `${player.name} tung được ${die}.`, canDeploy(die) ? 'gold' : 'info');

  const moves = listMoves(state, player, die);
  // Một nước duy nhất thì đi luôn để người chơi chỉ cần bấm một lần.
  if (moves.length === 1) {
    applyMove(state, player, moves[0]);
    return;
  }
  if (moves.length > 1) {
    state.pending = { kind: 'MOVE', moves };
    log(state, `Có ${moves.length} nước đi, hãy chọn một quân.`, 'info');
    return;
  }

  log(state, `${player.name} không đi được nước nào.`, 'muted');
  if (die === ROLL_AGAIN_FACE) grantBonus(state, player, `tung được ${ROLL_AGAIN_FACE}`);
  else endTurn(state);
}

function move(state, playerId, action) {
  if (state.status !== 'PLAYING') fail('Trận đấu chưa diễn ra.');
  const player = currentPlayer(state);
  if (!player || player.id !== playerId) fail('Chưa tới lượt của bạn!');
  if (!state.pending) fail('Hãy tung xúc xắc trước.');

  const { moves } = state.pending;
  let selected = null;
  if (Number.isInteger(action.index)) selected = moves[action.index];
  else if (action.horseId) selected = moves.find((candidate) => candidate.horseId === action.horseId);
  if (!selected) fail('Nước đi không hợp lệ.');

  applyMove(state, player, selected);
}

function skipTurn(state, playerId) {
  if (state.status !== 'PLAYING') fail('Trận đấu chưa diễn ra.');
  const host = activePlayers(state)[0];
  if (!host || host.id !== playerId) fail('Chỉ chủ phòng mới có thể bỏ qua lượt.');
  const player = currentPlayer(state);
  if (!player) fail('Không tìm thấy người chơi hiện tại.');
  if (player.id === playerId) fail('Bạn không thể tự bỏ qua lượt của mình.');
  if (!player.left && player.connected !== false) fail('Người chơi hiện tại vẫn đang kết nối.');
  log(state, `Bỏ qua lượt của ${player.name} do mất kết nối.`, 'muted');
  endTurn(state);
}

export function reduce(state, playerId, action, rng = Math.random) {
  if (!state || !Array.isArray(state.players)) fail('Dữ liệu trận đấu không hợp lệ.');
  if (!action || typeof action.type !== 'string') fail('Thao tác không hợp lệ.');

  const next = clone(state);
  const me = next.players.find((player) => player.id === playerId);
  if (!me) fail('Bạn không ở trong phòng này.');

  switch (action.type) {
    case 'START':
      start(next, playerId);
      break;
    case 'ROLL':
      roll(next, playerId, rng);
      break;
    case 'MOVE':
      move(next, playerId, action);
      break;
    case 'SKIP_TURN':
      skipTurn(next, playerId);
      break;
    default:
      fail('Thao tác không được hỗ trợ.');
  }

  next.version = (next.version || 0) + 1;
  return next;
}
