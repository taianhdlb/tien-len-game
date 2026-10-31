import { BOARD_TILES, EVENTS, BLESSINGS, INSTANT_WIN_RELIC_IDS } from './data.js';

export const STARTING_GOLD = 600;
export const GO_SALARY = 300;
export const JAIL_POSITION = 10;
export const JAIL_BAIL = 100;
export const JAIL_DC = 12;
export const MAX_JAIL_TURNS = 3;
export const MAX_LEVEL = 3;
export const MAX_ROUNDS = 40;
export const MAX_LOGS = 100;
export const BOARD_SIZE = BOARD_TILES.length;

export const TIER_NAMES = ['Đất Nền', 'Nhà Cấp 4', 'Nhà Phố', 'Chung Cư'];

export class GameError extends Error {}

export const isActive = (p) => !p.bankrupt && !p.left;
export const getRent = (tile, level = 0) => tile.rents?.[level] ?? 0;
export const getUpgradeCost = (tile) => tile.upgradeCost ?? Math.round(tile.price * 0.5);
// Chuộc lại Kỳ Quan đã có chủ: trả 150% giá trị hiện tại cho chủ cũ để mục tiêu 3 Kỳ Quan không bị khóa chết.
export const RELIC_BUYOUT_RATE = 1.5;
export const getRelicBuyout = (tile, level = 0) =>
  Math.round(((tile.price + getUpgradeCost(tile) * level) * RELIC_BUYOUT_RATE) / 5) * 5;
// Thuế theo tỷ lệ ví giúp người mới không bị xóa sổ sớm và người giàu vẫn phải đóng góp về cuối ván.
export const getTaxAmount = (tile, gold) => {
  const scaled = Math.round((gold * tile.taxRate) / 5) * 5;
  return Math.min(tile.taxMax, Math.max(tile.taxMin, scaled));
};
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

export function getNetWorth(state, playerId) {
  let worth = state.players.find((p) => p.id === playerId)?.gold ?? 0;
  for (const [tileId, prop] of Object.entries(state.properties || {})) {
    if (prop.ownerId !== playerId) continue;
    const tile = BOARD_TILES[Number(tileId)];
    worth += tile.price + getUpgradeCost(tile) * (prop.level || 0);
  }
  return worth;
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
  log(s, `${p.name} phá sản! Toàn bộ nhà đất được trả lại ngân hàng.`, 'danger');
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
  log(s, `${p.name} bị áp giải vào phòng Tạm Giam!`, 'danger');
}

function checkWinner(s) {
  if (s.status !== 'PLAYING') return;
  const alive = s.players.filter(isActive);
  if (alive.length === 1) {
    s.status = 'FINISHED';
    s.winnerId = alive[0].id;
    s.winReason = 'LAST_STANDING';
    s.pending = null;
    log(s, `${alive[0].name} là người chơi cuối cùng chưa phá sản nên thắng ván này!`, 'victory');
  } else if (alive.length === 0) {
    s.status = 'FINISHED';
    s.winnerId = null;
    s.pending = null;
  }
}

function finishByTimeLimit(s) {
  s.pending = null;
  const alive = s.players.filter(isActive);
  if (!alive.length) {
    s.status = 'FINISHED';
    s.winnerId = null;
    return;
  }
  const ranked = [...alive].sort((a, b) => {
    const relicDiff = countRelics(s, b.id) - countRelics(s, a.id);
    if (relicDiff) return relicDiff;
    return getNetWorth(s, b.id) - getNetWorth(s, a.id) || b.gold - a.gold;
  });
  const winner = ranked[0];
  s.status = 'FINISHED';
  s.winnerId = winner.id;
  s.winReason = 'TIME';
  log(
    s,
    `Hết ${MAX_ROUNDS} vòng! ${winner.name} lên ngôi tỷ phú với ${countRelics(s, winner.id)} Kỳ Quan và tổng tài sản ${getNetWorth(s, winner.id)}g.`,
    'victory'
  );
}

function startTurn(s) {
  const idx = s.currentTurn;
  const p = s.players[idx];
  s.pending = null;
  if (!p.inJail) return;
  if (p.jailTurns >= MAX_JAIL_TURNS) {
    log(s, `${p.name} mãn hạn tạm giam sau ${MAX_JAIL_TURNS} lượt, nộp ${JAIL_BAIL}g tiền bảo lãnh.`);
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
  if (s.turnNumber > (s.turnLimit ?? MAX_ROUNDS * s.players.length)) {
    finishByTimeLimit(s);
    return;
  }
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
        s.pending = {
          kind: 'RENT',
          tileId: tile.id,
          ownerId: owner.id,
          amount: getRent(tile, prop.level),
          ...(tile.type === 'RELIC' ? { buyoutPrice: getRelicBuyout(tile, prop.level) } : {})
        };
      } else if (prop.level < MAX_LEVEL) {
        s.pending = { kind: 'UPGRADE', tileId: tile.id };
      } else {
        log(s, `${p.name} về thăm khu ${TIER_NAMES[MAX_LEVEL]} ${tile.name} của mình.`);
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
      s.pending = { kind: 'TAX', tileId: tile.id, amount: getTaxAmount(tile, p.gold) };
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

function finishRelicWin(s, p) {
  s.status = 'FINISHED';
  s.winnerId = p.id;
  s.winReason = 'RELICS';
  s.pending = null;
  log(s, `THẮNG TUYỆT ĐỐI! ${p.name} đã sưu tập đủ 3 Kỳ Quan Việt Nam!`, 'victory');
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
      log(s, `${p.name} được tại ngoại (D20: ${roll} ≥ ${JAIL_DC})!`, 'success');
    } else {
      p.jailTurns = (p.jailTurns || 0) + 1;
      log(s, `${p.name} xin tại ngoại thất bại (D20: ${roll} < ${JAIL_DC}).`, 'danger');
    }
    return;
  }

  if (pending.kind === 'EVENT') {
    const ev = EVENTS.find((e) => e.id === pending.eventId);
    const outcome = d20Outcome(roll, ev.dc);
    pending.d20 = { roll, outcome, dc: ev.dc, seq: s.d20Seq };
    if (isSuccess(outcome)) {
      p.gold += ev.passGold || 0;
      log(s, `${p.name} thử vận (D20: ${roll}): ${ev.passText}`, 'success');
    } else {
      log(s, `${p.name} thử vận xui (D20: ${roll}): ${ev.failText}`, 'danger');
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
    log(s, `${p.name} khấn ${bl.god} linh ứng (D20: ${roll}), nhận +${bl.passGold}g!`, 'success');
  } else if (bl.failCost > 0) {
    log(s, `${p.name} sắm lễ ${bl.god} nhưng sai lễ (D20: ${roll}), tốn ${bl.failCost}g.`, 'danger');
    charge(s, idx, bl.failCost);
  } else {
    log(s, `${p.name} khấn ${bl.god} mà khí vận chưa tới (D20: ${roll}).`);
  }
}

function startGame(s, playerId, rng) {
  if (s.status === 'PLAYING') fail('Ván cờ đang diễn ra.');
  const connected = s.players.filter((p) => !p.left);
  if (connected[0]?.id !== playerId) fail('Chỉ chủ phòng mới có thể bắt đầu!');
  if (connected.length < 2) fail('Cần ít nhất 2 người chơi để bắt đầu.');

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
  s.currentTurn = Math.floor(rng() * s.players.length);
  s.turnNumber = 1;
  s.turnLimit = MAX_ROUNDS * s.players.length;
  s.pending = null;
  s.dice = [3, 4];
  s.rollSeq = 0;
  s.lastMove = null;
  s.winnerId = null;
  s.winReason = null;
  log(s, `Ván cờ bắt đầu! Mỗi người chơi được phát ${STARTING_GOLD}g vốn làm ăn.`, 'gold');
  log(s, `Giới hạn ${MAX_ROUNDS} vòng: hết vòng, người sưu được nhiều Kỳ Quan rồi đến tổng tài sản cao nhất sẽ thắng.`, 'muted');
}

// Pure reducer: returns the next room state or throws GameError. `rng` is injectable for deterministic tests.
export function reduce(state, playerId, action, rng = Math.random) {
  const s = structuredClone(state);

  if (action.type === 'START') {
    startGame(s, playerId, rng);
    s.version = (state.version || 0) + 1;
    return s;
  }

  if (s.status !== 'PLAYING') fail('Ván cờ chưa bắt đầu.');
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
      if (s.pending) fail('Hãy hoàn tất quyết định hiện tại trước.');
      const dice = [rollDie(rng, 6), rollDie(rng, 6)];
      const steps = dice[0] + dice[1];
      const from = p.position;
      const to = (from + steps) % BOARD_SIZE;
      s.dice = dice;
      s.rollSeq = (s.rollSeq || 0) + 1;
      s.lastMove = { playerId: p.id, from, steps, seq: (s.lastMove?.seq || 0) + 1 };
      p.position = to;
      log(s, `${p.name} gieo [${dice[0]} + ${dice[1]} = ${steps}], đáp xuống ${BOARD_TILES[to].name}.`);
      if (from + steps >= BOARD_SIZE) {
        p.gold += GO_SALARY;
        log(s, `${p.name} đi qua Ô Xuất Phát, nhận lương ${GO_SALARY}g.`, 'gold');
      }
      land(s, rng);
      break;
    }

    case 'BUY': {
      const { tileId } = requirePending(s, 'BUY');
      const tile = BOARD_TILES[tileId];
      if (p.gold < tile.price) fail('Không đủ vàng để mua mảnh đất này.');
      p.gold -= tile.price;
      s.properties[tileId] = { ownerId: p.id, level: 0 };
      log(s, `${p.name} mua ${tile.name} với giá ${tile.price}g.`, 'gold');
      if (tile.type === 'RELIC' && countRelics(s, p.id) === INSTANT_WIN_RELIC_IDS.length) {
        finishRelicWin(s, p);
      } else {
        endTurn(s);
      }
      break;
    }

    case 'BUY_RELIC': {
      const pending = requirePending(s, 'RENT');
      const tile = BOARD_TILES[pending.tileId];
      if (tile.type !== 'RELIC' || !pending.buyoutPrice) fail('Ô này không phải Kỳ Quan để chuộc.');
      if (p.gold < pending.buyoutPrice) fail('Không đủ vàng để chuộc Kỳ Quan.');
      const owner = s.players.find((x) => x.id === pending.ownerId);
      p.gold -= pending.buyoutPrice;
      if (owner) owner.gold += pending.buyoutPrice;
      s.properties[tile.id] = { ownerId: p.id, level: s.properties[tile.id]?.level ?? 0 };
      log(
        s,
        `${p.name} chuộc ${tile.name} từ ${owner?.name || 'chủ cũ'} với giá ${pending.buyoutPrice}g.`,
        'gold'
      );
      if (countRelics(s, p.id) === INSTANT_WIN_RELIC_IDS.length) {
        finishRelicWin(s, p);
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
      if (prop.level >= MAX_LEVEL) fail('Đất đã xây tới mức tối đa.');
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
      log(s, `${p.name} nộp ${JAIL_BAIL}g bảo lãnh và được tại ngoại.`);
      break;
    }

    case 'CONTINUE': {
      const pending = requirePending(s, 'EVENT', 'BLESSING', 'JAIL', 'TELEPORT', 'GO_TO_JAIL');
      if (pending.kind === 'TELEPORT') {
        p.position = pending.target;
        s.lastMove = { playerId: p.id, from: BOARD_TILES[pending.tileId].id, steps: 0, seq: (s.lastMove?.seq || 0) + 1, jump: true };
        log(s, `${p.name} lên máy bay, đổi chặng sang ${BOARD_TILES[pending.target].name}!`);
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
