import { describe, expect, it } from 'vitest';
import { COLORS } from './board.js';
import {
  GameError,
  MAX_BONUS_ROLLS,
  createInitialState,
  isDeployRoll,
  reduce
} from './engine.js';

const die = (value) => (value - 1) / 6 + 0.001;

function rng(values) {
  let index = 0;
  return () => values[index++] ?? 0;
}

function roomWith(count) {
  const state = createInitialState('TEST');
  state.players = Array.from({ length: count }, (_, index) => ({
    id: `p${index + 1}`,
    name: `Người ${index + 1}`,
    classId: 'horse',
    connected: true,
    left: false
  }));
  return state;
}

function started(count = 2, first = 0) {
  const state = roomWith(count);
  return reduce(state, 'p1', { type: 'START' }, rng([(first + 0.001) / count]));
}

function setHorses(state, playerIndex, specs) {
  const player = state.players[playerIndex];
  player.horses = player.horses.map((horse, index) => {
    const spec = specs[index];
    if (!spec) return { ...horse, status: 'YARD', pos: -1 };
    return { ...horse, status: spec[0], pos: spec[1] };
  });
  return state;
}

function roll(state, d1, d2, playerId) {
  const actor = playerId ?? state.players[state.currentTurn].id;
  return reduce(state, actor, { type: 'ROLL' }, rng([die(d1), die(d2)]));
}

function move(state, index, playerId) {
  const actor = playerId ?? state.players[state.currentTurn].id;
  return reduce(state, actor, { type: 'MOVE', index });
}

function findMove(state, horseId, dieKey) {
  return state.pending.moves.findIndex((entry) => entry.horseId === horseId && entry.die === dieKey);
}

describe('Cờ Cá Ngựa · khởi tạo', () => {
  it('chia màu theo số người chơi và 4 ngựa mỗi người', () => {
    const two = started(2);
    expect(two.players.map((player) => player.color)).toEqual(['RED', 'GREEN']);
    expect(two.players.every((player) => player.horses.length === 4)).toBe(true);
    expect(two.players[0].horses.every((horse) => horse.status === 'YARD' && horse.pos === -1)).toBe(true);

    expect(started(3).players.map((player) => player.color)).toEqual(['RED', 'BLUE', 'GREEN']);
    expect(started(4).players.map((player) => player.color)).toEqual(['RED', 'BLUE', 'GREEN', 'YELLOW']);
  });

  it('chọn người đi trước ngẫu nhiên', () => {
    expect(started(4, 2).currentTurn).toBe(2);
    expect(started(4, 3).currentTurn).toBe(3);
  });

  it('chỉ chủ phòng được bắt đầu và cần ít nhất 2 người', () => {
    expect(() => reduce(roomWith(2), 'p2', { type: 'START' }, rng([0]))).toThrow(GameError);
    expect(() => reduce(roomWith(1), 'p1', { type: 'START' }, rng([0]))).toThrow('ít nhất 2');
  });

  it('giới hạn tối đa 4 người chơi', () => {
    expect(() => reduce(roomWith(5), 'p1', { type: 'START' }, rng([0]))).toThrow('tối đa 4');
  });

  it('không cho vào ván đã kết thúc', () => {
    const state = started(2);
    state.status = 'FINISHED';
    expect(() => roll(state, 1, 2)).toThrow(GameError);
  });
});

describe('Cờ Cá Ngựa · xúc xắc và xuất quân', () => {
  it('nhận diện xúc xắc đặc biệt', () => {
    expect(isDeployRoll([3, 3])).toBe(true);
    expect(isDeployRoll([1, 6])).toBe(true);
    expect(isDeployRoll([6, 1])).toBe(true);
    expect(isDeployRoll([2, 5])).toBe(false);
  });

  it('đôi 6 cho xuất quân cả 4 ngựa và thêm lượt', () => {
    let state = started(2);
    state = roll(state, 6, 6);
    expect(state.pending.moves).toHaveLength(4);
    expect(state.pending.moves.every((entry) => entry.kind === 'DEPLOY')).toBe(true);

    state = move(state, 0);
    expect(state.players[0].horses[0].status).toBe('TRACK');
    expect(state.players[0].horses[0].pos).toBe(0);
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
    expect(state.pending).toBeNull();
  });

  it('cặp 1–6 cũng cho xuất quân', () => {
    let state = started(2);
    state = roll(state, 1, 6);
    expect(state.pending.moves).toHaveLength(4);
    state = move(state, 0);
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
  });

  it('tổng hoặc từng viên đều là lựa chọn hợp lệ', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 0]]);
    state = roll(state, 2, 3);
    const options = state.pending.moves
      .filter((entry) => entry.horseId === state.players[0].horses[0].id)
      .map((entry) => `${entry.die}:${entry.target.status}:${entry.target.pos}`);
    expect(options).toEqual(['SUM:TRACK:5', 'D1:TRACK:2', 'D2:TRACK:3']);
  });

  it('không có nước đi thì chuyển lượt', () => {
    let state = started(2);
    state = roll(state, 2, 3);
    expect(state.pending).toBeNull();
    expect(state.currentTurn).toBe(1);
  });

  it('không có nước đi nhưng tung đôi thì được thêm lượt', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 1], ['HOME', 2], ['HOME', 3], ['HOME', 6]]);
    state = roll(state, 6, 6);
    expect(state.pending).toBeNull();
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
  });

  it('giới hạn số lượt thưởng liên tiếp', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 1], ['HOME', 2], ['HOME', 3], ['HOME', 6]]);
    state.bonusRolls = MAX_BONUS_ROLLS;
    state = roll(state, 6, 6);
    expect(state.currentTurn).toBe(1);
  });
});

describe('Cờ Cá Ngựa · di chuyển trên đường đua', () => {
  it('đá toàn bộ quân đối thủ ở ô đích và được thêm lượt', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 0]]);
    // Green starts at 29, so progress 27 lands on absolute cell 8 — the same cell Red reaches with a 3.
    state = setHorses(state, 1, [['TRACK', 27]]);
    state = roll(state, 3, 1);
    const index = findMove(state, state.players[0].horses[0].id, 'D1');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(state.pending.moves[index].captures).toHaveLength(1);

    state = move(state, index);
    expect(state.players[1].horses[0].status).toBe('YARD');
    expect(state.players[1].horses[0].pos).toBe(-1);
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
  });

  it('cho phép xếp quân của mình cùng ô', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 0], ['TRACK', 3]]);
    state = roll(state, 3, 1);
    const index = findMove(state, state.players[0].horses[0].id, 'D1');
    expect(index).toBeGreaterThanOrEqual(0);
    state = move(state, index);
    expect(state.players[0].horses[0].pos).toBe(3);
    expect(state.players[0].horses[1].pos).toBe(3);
  });

  it('xuất quân vào ô xuất quân có địch cũng đá được', () => {
    let state = started(2);
    // Red's start is absolute 5; Green reaches it at progress 24.
    state = setHorses(state, 1, [['TRACK', 24]]);
    state = roll(state, 5, 5);
    const index = state.pending.moves.findIndex(
      (entry) => entry.kind === 'DEPLOY' && entry.captures.length === 1
    );
    expect(index).toBeGreaterThanOrEqual(0);
    state = move(state, index);
    expect(state.players[1].horses[0].status).toBe('YARD');
  });

  it('chỉ người đang tới lượt mới được tung và đi', () => {
    const state = started(2);
    expect(() => roll(state, 2, 3, 'p2')).toThrow('Chưa tới lượt');
    expect(() => move(state, 0, 'p2')).toThrow('Chưa tới lượt');
  });

  it('không thể đi khi chưa tung hoặc chọn nước sai', () => {
    const state = started(2);
    expect(() => move(state, 0)).toThrow('tung xúc xắc');
    const rolled = roll(state, 6, 6);
    expect(() => move(rolled, 99)).toThrow('không hợp lệ');
  });
});

describe('Cờ Cá Ngựa · chuồng về đích', () => {
  it('vượt cửa chuồng sẽ vào đúng bậc theo điểm dư', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 47]]);
    state = roll(state, 2, 3);
    const targets = state.pending.moves.map((entry) => `${entry.die}:${entry.target.status}:${entry.target.pos}`);
    expect(targets).toEqual(['SUM:HOME:5', 'D1:HOME:2', 'D2:HOME:3']);
  });

  it('đứng ngay trước cửa chuồng đi 2 thì vào bậc 1', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 46]]);
    state = roll(state, 2, 1);
    const entry = state.pending.moves.find((candidate) => candidate.die === 'D1');
    expect(entry.target).toEqual({ status: 'HOME', pos: 1 });
  });

  it('cho phép nhảy qua ngựa của mình khi đích trống', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 1], ['HOME', 4]]);
    state = roll(state, 4, 1);
    const firstHorse = state.players[0].horses[0].id;
    const index = findMove(state, firstHorse, 'D1');
    expect(index).toBeGreaterThanOrEqual(0);
    expect(state.pending.moves[index].target.pos).toBe(5);
    expect(state.pending.moves[index].captures).toHaveLength(0);
  });

  it('bậc đã có ngựa của mình thì không vào được', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 1], ['HOME', 2], ['HOME', 3], ['HOME', 6]]);
    state = roll(state, 6, 6);
    expect(state.pending).toBeNull();
    expect(state.currentTurn).toBe(0);
  });

  it('không được vượt quá bậc 6', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 3], ['HOME', 4], ['HOME', 5], ['HOME', 6]]);
    state = roll(state, 2, 2);
    expect(state.pending).toBeNull();
  });

  it('bốn ngựa đúng bậc 3–4–5–6 thì thắng', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 3], ['HOME', 4], ['HOME', 5], ['HOME', 1]]);
    state = roll(state, 5, 1);
    const lastHorse = state.players[0].horses[3].id;
    const index = findMove(state, lastHorse, 'D1');
    expect(index).toBeGreaterThanOrEqual(0);
    state = move(state, index);
    expect(state.status).toBe('FINISHED');
    expect(state.winnerId).toBe('p1');
    expect(state.winReason).toBe('ALL_HOME');
    expect(state.players[0].horses.map((horse) => horse.pos).sort()).toEqual([3, 4, 5, 6]);
  });
});

describe('Cờ Cá Ngựa · vòng chơi', () => {
  it('bỏ qua người đã rời phòng khi chuyển lượt', () => {
    let state = started(3, 0);
    state.players[1].left = true;
    state = roll(state, 2, 3);
    expect(state.currentTurn).toBe(2);
  });

  it('chủ phòng chỉ được bỏ lượt của người mất kết nối', () => {
    let state = started(2, 1);
    state.players[1].connected = false;
    expect(() => reduce(state, 'p2', { type: 'SKIP_TURN' })).toThrow(GameError);
    expect(() => reduce(state, 'p1', { type: 'SKIP_TURN' })).not.toThrow();
    state = reduce(state, 'p1', { type: 'SKIP_TURN' });
    expect(state.currentTurn).toBe(0);
    expect(state.players).toHaveLength(2);
  });

  it('không bỏ lượt của người vẫn đang kết nối', () => {
    const state = started(2, 1);
    expect(() => reduce(state, 'p1', { type: 'SKIP_TURN' })).toThrow('vẫn đang kết nối');
  });

  it('mỗi hành động tăng version để server đồng bộ', () => {
    let state = started(2);
    const before = state.version;
    state = roll(state, 2, 3);
    expect(state.version).toBe(before + 1);
  });

  it('danh sách nước đi không trùng lặp', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 0]]);
    state = roll(state, 3, 3);
    const keys = state.pending.moves.map((entry) => `${entry.horseId}:${entry.target.status}:${entry.target.pos}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(state.pending.moves.filter((entry) => entry.kind === 'DEPLOY')).toHaveLength(3);
  });

  it('màu chuồng khớp với ô xuất quân trên bàn cờ', () => {
    expect(COLORS.RED.start).toBe(5);
    expect(COLORS.BLUE.start).toBe(17);
    expect(COLORS.GREEN.start).toBe(29);
    expect(COLORS.YELLOW.start).toBe(41);
  });
});
