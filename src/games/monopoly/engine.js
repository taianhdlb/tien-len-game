import { BOARD_TILES, EVENTS, BLESSINGS, INSTANT_WIN_RELIC_IDS } from './data.js';

export const STARTING_GOLD = 1500;
export const GO_SALARY = 200;
export const JAIL_POSITION = 10;
export const JAIL_BAIL = 50;
export const JAIL_DC = 12;
export const MAX_JAIL_TURNS = 3;
export const MAX_LEVEL = 3;
export const MAX_LOGS = 100;
export const BOARD_SIZE = BOARD_TILES.length;

export const TIER_NAMES = ['Đất Khảo Sát', 'Trại Tiền Đồn', 'Tháp Canh Đá', 'Đại Pháo Đài'];

export class GameError extends Error {}

export const isActive = (p) => !p.bankrupt && !p.left;
export const getRent = (tile, level = 0) => tile.rents?.[level] ?? 0;
export const getUpgradeCost = (tile) => tile.upgradeCost ?? Math.round(tile.price * 0.6);
export const isSuccess = (outcome) => outcome === 'SUCCESS' || outcome === 'CRIT_SUCCESS';

export function d20Outcome(roll, dc) {
  if (roll === 20) return 'CRIT_SUCCESS';
  if (roll === 1) return 'CRIT_FAIL';
  return roll >= dc ? 'SUCCESS' : 'FAIL';
}

export const currentPlayer = (state) => state.players[state.currentTurn];

export function countRelics(state, playerId) {
  return INSTANT_WIN_RELIC_IDS.filter((id) => state.properties[id]?.ownerId === playerId).length;
}

const rollDie = (rng, sides) => Math.floor(rng() * sides) + 1;
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const fail = (msg) => {
  throw new GameError(msg);
};

function log(s, text, tone = 'info') {
  s.logSeq = (s.logSeq || 0) + 1;
  s.logs = [...(s.logs || []), { id: s.logSeq, text, tone }].slice(-MAX_LOGS);
}

function bankrupt(s, idx) {
  const p = s.players[idx];
  p.bankrupt = true;
  p.gold = 0;
  p.inJail = false;
  for (const [tileId, prop] of Object.entries(s.properties)) {
    if (prop.ownerId === p.id) delete s.properties[tileId];
  }
  log(s, `${p.name} đã phá sản! Mọi lãnh địa được trả về vương quốc.`, 'danger');
}

// Takes `amount` from the player; if they cannot cover it they pay what they have and go bankrupt.
function charge(s, idx, amount, creditorId = null) {
  const p = s.players[idx];
  const paid = Math.min(p.gold, amount);
  p.gold -= paid;
  if (creditorId) {
    const creditor = s.players.find((x) => x.id === creditorId);
    if (creditor) creditor.gold += paid;
  }
  if (paid < amount) bankrupt(s, idx);
  return paid === amount;
}

function sendToJail(s, idx) {
  const p = s.players[idx];
  const from = p.position;
  p.position = JAIL_POSITION;
  p.inJail = true;
  p.jailTurns = 0;
  s.lastMove = { playerId: p.id, from, steps: 0, seq: (s.lastMove?.seq || 0) + 1, jump: true };
  log(s, `${p.name} bị tống giam vào Ngục!`, 'danger');
}

function checkWinner(s) {
  if (s.status !== 'PLAYING') return;
  const alive = s.players.filter(isActive);
  if (alive.length === 1) {
    s.status = 'FINISHED';
    s.winnerId = alive[0].id;
    s.winReason = 'LAST_STANDING';
    s.pending = null;
    log(s, `${alive[0].name} là người trụ lại cuối cùng và giành chiến thắng!`, 'victory');
  } else if (alive.length === 0) {
    s.status = 'FINISHED';
    s.winnerId = null;
    s.pending = null;
  }
}

function startTurn(s) {
  const idx = s.currentTurn;
  const p = s.players[idx];
  s.pending = null;
  if (!p.inJail) return;
  if (p.jailTurns >= MAX_JAIL_TURNS) {
    log(s, `${p.name} mãn hạn tù sau ${MAX_JAIL_TURNS} lượt và nộp ${JAIL_BAIL}g tiền bảo lãnh.`);
    p.inJail = false;
    p.jailTurns = 0;
    charge(s, idx, JAIL_BAIL);
    if (p.bankrupt) endTurn(s);
    return;
  }
  s.pending = { kind: 'JAIL' };
}

function endTurn(s) {
  checkWinner(s);
  if (s.status !== 'PLAYING') return;
  const n = s.players.length;
  let next = s.currentTurn;
  for (let i = 0; i < n; i++) {
    next = (next + 1) % n;
    if (isActive(s.players[next])) break;
  }
  s.currentTurn = next;
  s.turnNumber = (s.turnNumber || 0) + 1;
  startTurn(s);
}

function land(s, rng) {
  const idx = s.currentTurn;
  const p = s.players[idx];
  const tile = BOARD_TILES[p.position];

  switch (tile.type) {
    case 'PROPERTY':
    case 'RELIC': {
      const prop = s.properties[tile.id];
      const owner = prop && s.players.find((x) => x.id === prop.ownerId);
      if (!owner || !isActive(owner)) {
        if (prop) delete s.properties[tile.id];
        s.pending = { kind: 'BUY', tileId: tile.id };
      } else if (owner.id !== p.id) {
        s.pending = { kind: 'RENT', tileId: tile.id, ownerId: owner.id, amount: getRent(tile, prop.level) };
      } else if (prop.level < MAX_LEVEL) {
        s.pending = { kind: 'UPGRADE', tileId: tile.id };
      } else {
        log(s, `${p.name} thị sát Đại Pháo Đài ${tile.name} của mình.`);
        endTurn(s);
      }
      return;
    }
    case 'EVENT':
      s.pending = { kind: 'EVENT', eventId: pick(rng, EVENTS).id };
      return;
    case 'BLESSING':
      s.pending = { kind: 'BLESSING', blessingId: pick(rng, BLESSINGS).id };
      return;
    case 'TAX':
      s.pending = { kind: 'TAX', tileId: tile.id, amount: tile.price };
      return;
    case 'TELEPORT':
      s.pending = { kind: 'TELEPORT', tileId: tile.id, target: tile.target };
      return;
    case 'GO_TO_JAIL':
      s.pending = { kind: 'GO_TO_JAIL' };
      return;
    default:
      endTurn(s);
  }
}

function requirePending(s, ...kinds) {
  if (!s.pending || !kinds.includes(s.pending.kind)) fail('Hành động không hợp lệ ở thời điểm này.');
  return s.pending;
}

function resolveD20(s, idx, pending, rng) {
  const p = s.players[idx];
  const roll = rollDie(rng, 20);
  s.d20Seq = (s.d20Seq || 0) + 1;

  if (pending.kind === 'JAIL') {
    const outcome = d20Outcome(roll, JAIL_DC);
    pending.d20 = { roll, outcome, dc: JAIL_DC, seq: s.d20Seq };
    if (isSuccess(outcome)) {
      p.inJail = false;
      p.jailTurns = 0;
      log(s, `${p.name} vượt ngục thành công (D20: ${roll} ≥ ${JAIL_DC})!`, 'success');
    } else {
      p.jailTurns = (p.jailTurns || 0) + 1;
      log(s, `${p.name} vượt ngục thất bại (D20: ${roll} < ${JAIL_DC}).`, 'danger');
    }
    return;
  }

  if (pending.kind === 'EVENT') {
    const ev = EVENTS.find((e) => e.id === pending.eventId);
    const outcome = d20Outcome(roll, ev.dc);
    pending.d20 = { roll, outcome, dc: ev.dc, seq: s.d20Seq };
    if (isSuccess(outcome)) {
      p.gold += ev.passGold || 0;
      log(s, `${p.name} kiểm định D20 thành công (${roll}): ${ev.passText}`, 'success');
    } else {
      log(s, `${p.name} kiểm định D20 thất bại (${roll}): ${ev.failText}`, 'danger');
      if (ev.failCost) charge(s, idx, ev.failCost);
      if (ev.failJail && !p.bankrupt) sendToJail(s, idx);
    }
    return;
  }

  const bl = BLESSINGS.find((b) => b.id === pending.blessingId);
  const outcome = d20Outcome(roll, bl.dc);
  pending.d20 = { roll, outcome, dc: bl.dc, seq: s.d20Seq };
  if (isSuccess(outcome)) {
    p.gold += bl.passGold;
    log(s, `${p.name} được Thần ${bl.god} ban phước (D20: ${roll}), nhận +${bl.passGold}g!`, 'success');
  } else if (bl.failCost > 0) {
    log(s, `${p.name} làm phật lòng Thần ${bl.god} (D20: ${roll}), bị phạt ${bl.failCost}g.`, 'danger');
    charge(s, idx, bl.failCost);
  } else {
    log(s, `${p.name} cầu nguyện Thần ${bl.god} nhưng không có phép màu (D20: ${roll}).`);
  }
}

function startGame(s, playerId) {
  if (s.status === 'PLAYING') fail('Trận đấu đang diễn ra.');
  const connected = s.players.filter((p) => !p.left);
  if (connected[0]?.id !== playerId) fail('Chỉ chủ phòng mới có thể bắt đầu!');
  if (connected.length < 2) fail('Cần ít nhất 2 chiến binh để bắt đầu.');

  s.players = connected.map((p) => ({
    ...p,
    gold: STARTING_GOLD,
    position: 0,
    inJail: false,
    jailTurns: 0,
    bankrupt: false
  }));
  s.status = 'PLAYING';
  s.properties = {};
  s.currentTurn = 0;
  s.turnNumber = 1;
  s.pending = null;
  s.dice = [3, 4];
  s.rollSeq = 0;
  s.lastMove = null;
  s.winnerId = null;
  s.winReason = null;
  log(s, `Cuộc chinh phạt bắt đầu! Mỗi chiến binh nhận ${STARTING_GOLD}g lộ phí.`, 'gold');
}

// Pure reducer: returns the next room state or throws GameError. `rng` is injectable for deterministic tests.
export function reduce(state, playerId, action, rng = Math.random) {
  const s = structuredClone(state);

  if (action.type === 'START') {
    startGame(s, playerId);
    s.version = (state.version || 0) + 1;
    return s;
  }

  if (s.status !== 'PLAYING') fail('Trận đấu chưa bắt đầu.');
  const idx = s.currentTurn;
  const p = s.players[idx];

  if (action.type === 'SKIP_TURN') {
    if (p.connected !== false && !p.left) fail('Người chơi hiện tại vẫn đang kết nối.');
    if (p.id === playerId) fail('Không thể bỏ qua lượt của chính mình.');
    log(s, `Bỏ qua lượt của ${p.name} (mất kết nối).`, 'muted');
    endTurn(s);
    s.version = (state.version || 0) + 1;
    return s;
  }

  if (p.id !== playerId) fail('Chưa tới lượt của bạn!');

  switch (action.type) {
    case 'ROLL': {
      if (s.pending) fail('Hãy hoàn tất sự kiện hiện tại trước.');
      const dice = [rollDie(rng, 6), rollDie(rng, 6)];
      const steps = dice[0] + dice[1];
      const from = p.position;
      const to = (from + steps) % BOARD_SIZE;
      s.dice = dice;
      s.rollSeq = (s.rollSeq || 0) + 1;
      s.lastMove = { playerId: p.id, from, steps, seq: (s.lastMove?.seq || 0) + 1 };
      p.position = to;
      log(s, `${p.name} gieo [${dice[0]} + ${dice[1]} = ${steps}], tiến vào ${BOARD_TILES[to].name}.`);
      if (from + steps >= BOARD_SIZE) {
        p.gold += GO_SALARY;
        log(s, `${p.name} đi qua Cổng Khởi Hành, nhận +${GO_SALARY}g.`, 'gold');
      }
      land(s, rng);
      break;
    }

    case 'BUY': {
      const { tileId } = requirePending(s, 'BUY');
      const tile = BOARD_TILES[tileId];
      if (p.gold < tile.price) fail('Không đủ vàng để mua lãnh địa này.');
      p.gold -= tile.price;
      s.properties[tileId] = { ownerId: p.id, level: 0 };
      log(s, `${p.name} mua ${tile.name} với giá ${tile.price}g.`, 'gold');
      if (tile.type === 'RELIC' && countRelics(s, p.id) === INSTANT_WIN_RELIC_IDS.length) {
        s.status = 'FINISHED';
        s.winnerId = p.id;
        s.winReason = 'RELICS';
        s.pending = null;
        log(s, `CHIẾN THẮNG TUYỆT ĐỐI! ${p.name} đã thu thập đủ 3 Thánh Vật!`, 'victory');
      } else {
        endTurn(s);
      }
      break;
    }

    case 'UPGRADE': {
      const { tileId } = requirePending(s, 'UPGRADE');
      const tile = BOARD_TILES[tileId];
      const prop = s.properties[tileId];
      const cost = getUpgradeCost(tile);
      if (prop.level >= MAX_LEVEL) fail('Lãnh địa đã đạt cấp tối đa.');
      if (p.gold < cost) fail('Không đủ vàng để nâng cấp.');
      p.gold -= cost;
      prop.level += 1;
      log(s, `${p.name} nâng cấp ${tile.name} lên ${TIER_NAMES[prop.level]} (${cost}g).`, 'gold');
      endTurn(s);
      break;
    }

    case 'DECLINE': {
      const pending = requirePending(s, 'BUY', 'UPGRADE', 'BLESSING');
      if (pending.d20) fail('Đã gieo xúc xắc, hãy tiếp tục.');
      if (pending.kind === 'BUY') log(s, `${p.name} bỏ qua ${BOARD_TILES[pending.tileId].name}.`, 'muted');
      endTurn(s);
      break;
    }

    case 'PAY': {
      const pending = requirePending(s, 'RENT', 'TAX');
      const tile = BOARD_TILES[pending.tileId];
      if (pending.kind === 'RENT') {
        const owner = s.players.find((x) => x.id === pending.ownerId);
        log(s, `${p.name} trả ${pending.amount}g tiền thuê ${tile.name} cho ${owner.name}.`, 'danger');
        charge(s, idx, pending.amount, owner.id);
      } else {
        log(s, `${p.name} nộp ${pending.amount}g ${tile.name}.`, 'danger');
        charge(s, idx, pending.amount);
      }
      endTurn(s);
      break;
    }

    case 'EVENT_SAFE': {
      const pending = requirePending(s, 'EVENT');
      if (pending.d20) fail('Đã gieo xúc xắc, hãy tiếp tục.');
      const ev = EVENTS.find((e) => e.id === pending.eventId);
      if (ev.safeCost > 0) {
        log(s, `${p.name} chọn an toàn: ${ev.safeLabel}.`);
        charge(s, idx, ev.safeCost);
      } else {
        log(s, `${p.name} chọn an toàn và rời đi.`, 'muted');
      }
      endTurn(s);
      break;
    }

    case 'ROLL_D20': {
      const pending = requirePending(s, 'EVENT', 'BLESSING', 'JAIL');
      if (pending.d20) fail('Đã gieo xúc xắc D20.');
      resolveD20(s, idx, pending, rng);
      break;
    }

    case 'PAY_BAIL': {
      const pending = requirePending(s, 'JAIL');
      if (pending.d20) fail('Đã gieo xúc xắc D20.');
      if (p.gold < JAIL_BAIL) fail('Không đủ vàng để nộp tiền bảo lãnh.');
      p.gold -= JAIL_BAIL;
      p.inJail = false;
      p.jailTurns = 0;
      s.pending = null;
      log(s, `${p.name} nộp ${JAIL_BAIL}g bảo lãnh và rời Ngục Giam.`);
      break;
    }

    case 'CONTINUE': {
      const pending = requirePending(s, 'EVENT', 'BLESSING', 'JAIL', 'TELEPORT', 'GO_TO_JAIL');
      if (pending.kind === 'TELEPORT') {
        p.position = pending.target;
        s.lastMove = { playerId: p.id, from: BOARD_TILES[pending.tileId].id, steps: 0, seq: (s.lastMove?.seq || 0) + 1, jump: true };
        log(s, `${p.name} bước qua cổng không gian đến ${BOARD_TILES[pending.target].name}!`);
        endTurn(s);
      } else if (pending.kind === 'GO_TO_JAIL') {
        sendToJail(s, idx);
        endTurn(s);
      } else {
        if (!pending.d20) fail('Hãy đưa ra lựa chọn trước.');
        if (pending.kind === 'JAIL' && isSuccess(pending.d20.outcome)) s.pending = null;
        else endTurn(s);
      }
      break;
    }

    default:
      fail(`Hành động không xác định: ${action.type}`);
  }

  s.version = (state.version || 0) + 1;
  return s;
}
