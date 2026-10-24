import { COLORS, COLOR_SETS, TRACK_LENGTH, WIN_STEPS, describeCell, trackIndex } from './board.js';

export const MAX_PLAYERS = 4;
export const HORSES_PER_PLAYER = 4;
export const MAX_BONUS_ROLLS = 3;
export const MAX_LOGS = 120;

export class GameError extends Error {}

const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

const fail = (message) => {
  throw new GameError(message);
};

export const isActive = (player) => Boolean(player) && !player.left;
export const activePlayers = (state) => state.players.filter(isActive);
export const currentPlayer = (state) => state.players[state.currentTurn];
export const isDeployRoll = (dice = []) =>
  dice.length === 2 && (dice[0] === dice[1] || (dice[0] === 1 && dice[1] === 6) || (dice[0] === 6 && dice[1] === 1));
export const isDoubles = (dice = []) => dice.length === 2 && dice[0] === dice[1];
export const diceSum = (dice = []) => (dice[0] || 0) + (dice[1] || 0);

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
    dice: null,
    rollSeq: 0,
    pending: null,
    bonusRolls: 0,
    turnNumber: 1,
    winnerId: null,
    winReason: null,
    lastMove: null
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

function absoluteTrack(player, progress) {
  return trackIndex(player.color, progress);
}

function opponentsAt(state, player, target) {
  if (target.status !== 'TRACK') return [];
  const absolute = absoluteTrack(player, target.pos);
  const captured = [];
  for (const other of state.players) {
    if (other.id === player.id || other.left) continue;
    for (const horse of other.horses || []) {
      if (horse.status === 'TRACK' && absoluteTrack(other, horse.pos) === absolute) captured.push(horse.id);
    }
  }
  return captured;
}

function homeOccupied(player, step, ignoredHorseId = null) {
  return player.horses.some((horse) => horse.id !== ignoredHorseId && horse.status === 'HOME' && horse.pos === step);
}

function resolveMove(state, player, horse, value, die) {
  let target;
  let kind;

  if (horse.status === 'TRACK') {
    const next = horse.pos + value;
    if (next <= TRACK_LENGTH - 1) {
      target = { status: 'TRACK', pos: next };
      kind = 'TRACK';
    } else {
      const step = next - (TRACK_LENGTH - 1);
      if (step > 6) return null;
      if (homeOccupied(player, step, horse.id)) return null;
      target = { status: 'HOME', pos: step };
      kind = 'HOME';
    }
  } else if (horse.status === 'HOME') {
    const step = horse.pos + value;
    if (step > 6) return null;
    if (homeOccupied(player, step, horse.id)) return null;
    target = { status: 'HOME', pos: step };
    kind = 'HOME';
  } else {
    return null;
  }

  return {
    horseId: horse.id,
    die,
    value,
    kind,
    target,
    captures: opponentsAt(state, player, target)
  };
}

export function listMoves(state, player, dice) {
  if (!player || !Array.isArray(dice) || dice.length !== 2) return [];
  const moves = [];
  const seen = new Set();
  const push = (move) => {
    if (!move) return;
    const key = `${move.horseId}:${move.target.status}:${move.target.pos}`;
    if (seen.has(key)) return;
    seen.add(key);
    moves.push(move);
  };

  if (isDeployRoll(dice)) {
    for (const horse of player.horses) {
      if (horse.status !== 'YARD') continue;
      const target = { status: 'TRACK', pos: 0 };
      push({
        horseId: horse.id,
        die: 'DEPLOY',
        value: 0,
        kind: 'DEPLOY',
        target,
        captures: opponentsAt(state, player, target)
      });
    }
  }

  const options = [
    ['SUM', dice[0] + dice[1]],
    ['D1', dice[0]],
    ['D2', dice[1]]
  ];
  for (const [die, value] of options) {
    for (const horse of player.horses) {
      if (horse.status === 'YARD') continue;
      push(resolveMove(state, player, horse, value, die));
    }
  }
  return moves;
}

function grantBonus(state, player) {
  state.bonusRolls = (state.bonusRolls || 0) + 1;
  log(state, `${player.name} được tung thêm xúc xắc (${state.bonusRolls}/${MAX_BONUS_ROLLS}).`, 'gold');
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

function finish(state, player, reason) {
  state.status = 'FINISHED';
  state.pending = null;
  state.winnerId = player.id;
  state.winReason = reason;
  log(state, `${player.name} đưa đủ 4 ngựa vào các bậc 3–4–5–6 và giành chiến thắng!`, 'victory');
}

function checkWin(state, player) {
  const home = player.horses.filter((horse) => horse.status === 'HOME').map((horse) => horse.pos).sort();
  if (home.length !== HORSES_PER_PLAYER) return false;
  return WIN_STEPS.every((step, index) => home[index] === step);
}

function start(state, playerId, rng) {
  if (state.status !== 'WAITING') fail('Trận đấu đã bắt đầu.');
  const active = activePlayers(state);
  const host = active[0];
  if (!host || host.id !== playerId) fail('Chỉ chủ phòng mới có thể bắt đầu!');
  if (active.length < 2) fail('Cần ít nhất 2 người chơi để bắt đầu.');
  if (active.length > MAX_PLAYERS) fail('Phòng chỉ hỗ trợ tối đa 4 người chơi.');

  const colors = COLOR_SETS[active.length];
  const players = active.map((entry, index) => ({
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

  state.players = players;
  state.status = 'PLAYING';
  state.currentTurn = Math.min(players.length - 1, Math.floor(rng() * players.length));
  state.turnNumber = 1;
  state.bonusRolls = 0;
  state.dice = null;
  state.rollSeq = 0;
  state.pending = null;
  state.winnerId = null;
  state.winReason = null;
  state.lastMove = null;

  log(state, `Trận đua bắt đầu với ${players.length} kỵ sĩ!`, 'victory');
  log(state, players.map((p) => `${COLORS[p.color].label}: ${p.name}`).join(' · '), 'gold');
  const first = currentPlayer(state);
  if (first) log(state, `${first.name} tung xúc xắc trước.`, 'muted');
}

function roll(state, playerId, rng) {
  if (state.status !== 'PLAYING') fail('Trận đấu chưa diễn ra.');
  const player = currentPlayer(state);
  if (!player || player.id !== playerId) fail('Chưa tới lượt của bạn!');
  if (state.pending) fail('Hãy hoàn thành nước đi trước khi tung xúc xắc.');

  const dice = [rollDie(rng), rollDie(rng)];
  state.dice = dice;
  state.rollSeq = (state.rollSeq || 0) + 1;
  state.lastMove = null;

  const special = isDeployRoll(dice);
  log(
    state,
    `${player.name} tung được ${dice[0]} + ${dice[1]} = ${dice[0] + dice[1]}${special ? ' · xúc xắc đặc biệt!' : ''}.`,
    special ? 'gold' : 'info'
  );

  const moves = listMoves(state, player, dice);
  if (moves.length === 0) {
    log(state, `${player.name} không có nước đi hợp lệ.`, 'muted');
    if (isDoubles(dice) && state.bonusRolls < MAX_BONUS_ROLLS) {
      grantBonus(state, player);
    } else {
      endTurn(state);
    }
    return;
  }

  state.pending = { kind: 'MOVE', moves };
  log(state, `${moves.length} nước đi khả dụng.`, 'info');
}

function move(state, playerId, action) {
  if (state.status !== 'PLAYING') fail('Trận đấu chưa diễn ra.');
  const player = currentPlayer(state);
  if (!player || player.id !== playerId) fail('Chưa tới lượt của bạn!');
  if (!state.pending) fail('Hãy tung xúc xắc trước.');

  const { moves } = state.pending;
  let selected = null;
  if (Number.isInteger(action.index)) selected = moves[action.index];
  else if (action.horseId) {
    selected = moves.find(
      (candidate) => candidate.horseId === action.horseId && (!action.die || candidate.die === action.die)
    );
  }
  if (!selected) fail('Nước đi không hợp lệ.');

  const horse = player.horses.find((entry) => entry.id === selected.horseId);
  if (!horse) fail('Không tìm thấy quân cờ.');
  if (selected.target.status === 'HOME' && homeOccupied(player, selected.target.pos, horse.id)) {
    fail('Bậc này đã có ngựa của bạn.');
  }

  const from = { status: horse.status, pos: horse.pos };
  horse.status = selected.target.status;
  horse.pos = selected.target.pos;

  state.pending = null;
  state.lastMove = {
    seq: (state.lastMove?.seq || 0) + 1,
    horseId: horse.id,
    playerId: player.id,
    from,
    to: { ...selected.target },
    captures: [...selected.captures]
  };

  if (selected.kind === 'DEPLOY') {
    log(state, `${player.name} xuất quân ${horseLabel(player, horse.id)} tại ô ${absoluteTrack(player, 0) + 1}.`, 'success');
  } else if (selected.kind === 'HOME') {
    log(state, `${player.name} đưa ${horseLabel(player, horse.id)} lên bậc ${horse.pos}.`, 'success');
  } else {
    log(state, `${player.name} di chuyển ${horseLabel(player, horse.id)} tới ${describeCell(player.color, selected.target)}.`, 'info');
  }

  if (selected.captures.length > 0) {
    let fallen = 0;
    for (const other of state.players) {
      for (const target of other.horses || []) {
        if (!selected.captures.includes(target.id)) continue;
        target.status = 'YARD';
        target.pos = -1;
        fallen += 1;
      }
    }
    log(state, `${player.name} đá ${fallen} quân đối thủ về chuồng!`, 'danger');
  }

  if (checkWin(state, player)) {
    finish(state, player, 'ALL_HOME');
    return;
  }

  const special = isDoubles(state.dice) || selected.kind === 'DEPLOY' || selected.captures.length > 0;
  if (special && state.bonusRolls < MAX_BONUS_ROLLS) {
    grantBonus(state, player);
  } else {
    endTurn(state);
  }
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
      start(next, playerId, rng);
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
