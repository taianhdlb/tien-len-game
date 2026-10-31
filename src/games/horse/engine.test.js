import { describe, expect, it } from 'vitest';
import { COLORS, TRACK_LENGTH } from './board.js';
import {
  DEPLOY_FACES,
  GameError,
  HOME_FACES,
  ROLL_AGAIN_FACE,
  createInitialState,
  homeFaceFor,
  isSatNut,
  listMoves,
  reduce
} from './engine.js';

const GATE = TRACK_LENGTH - 1;

const die = (value) => (value - 1) / 6 + 0.001;
const rng = (values) => {
  let index = 0;
  return () => values[index++] ?? 0;
};

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

function started(count = 2) {
  return reduce(roomWith(count), 'p1', { type: 'START' });
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

function turn(state, playerIndex) {
  state.currentTurn = playerIndex;
  return state;
}

function roll(state, value, playerId) {
  const actor = playerId ?? state.players[state.currentTurn].id;
  return reduce(state, actor, { type: 'ROLL' }, rng([die(value)]));
}

function move(state, index, playerId) {
  const actor = playerId ?? state.players[state.currentTurn].id;
  return reduce(state, actor, { type: 'MOVE', index });
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

  it('chủ phòng là người tung xúc xắc trước', () => {
    expect(started(4).currentTurn).toBe(0);
    expect(started(4).die).toBeNull();
    expect(started(2).logs.at(-1).text).toMatch(/chủ phòng/);
  });

  it('chỉ chủ phòng được bắt đầu và cần ít nhất 2 người', () => {
    expect(() => reduce(roomWith(2), 'p2', { type: 'START' })).toThrow(GameError);
    expect(() => reduce(roomWith(1), 'p1', { type: 'START' })).toThrow('ít nhất 2');
  });

  it('giới hạn tối đa 4 người chơi', () => {
    expect(() => reduce(roomWith(5), 'p1', { type: 'START' })).toThrow('tối đa 4');
  });

  it('không cho tung ở ván đã kết thúc', () => {
    const state = started(2);
    state.status = 'FINISHED';
    expect(() => roll(state, 3)).toThrow(GameError);
  });
});

describe('Cờ Cá Ngựa · xuất chuồng', () => {
  it('chỉ ra 1 hoặc 6 mới xuất chuồng được', () => {
    expect(DEPLOY_FACES).toEqual([1, 6]);
    for (const value of [2, 3, 4, 5]) {
      const state = roll(started(2), value);
      expect(state.pending).toBeNull();
      expect(state.players[0].horses.every((horse) => horse.status === 'YARD')).toBe(true);
      expect(state.currentTurn).toBe(1);
    }
  });

  it('ra 1 thì đưa một ngựa ra ô xuất phát và được tung tiếp', () => {
    const state = roll(started(2), 1);
    expect(state.players[0].horses[0]).toMatchObject({ status: 'TRACK', pos: 0 });
    expect(state.players[0].horses.filter((horse) => horse.status === 'YARD')).toHaveLength(3);
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
    expect(state.pending).toBeNull();
  });

  it('ra 6 vừa xuất chuồng vừa được tung tiếp', () => {
    const state = roll(started(2), 6);
    expect(state.players[0].horses[0].status).toBe('TRACK');
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
  });

  it('một nước duy nhất thì tự đi luôn, không bắt chọn', () => {
    const state = roll(started(2), 6);
    expect(state.pending).toBeNull();
    expect(state.die).toBe(6);
  });

  it('nhiều nước thì phải chọn', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 0]]);
    state = roll(state, 6);
    expect(state.pending.moves).toHaveLength(2);
    expect(state.pending.moves.map((entry) => entry.kind)).toEqual(['DEPLOY', 'TRACK']);
    const next = move(state, 1);
    expect(next.players[0].horses[0].pos).toBe(6);
    expect(next.players[0].horses[1].status).toBe('YARD');
  });

  it('xuất chuồng vào ô có địch thì đá quân đó về chuồng', () => {
    let state = started(2);
    // Ô xuất phát của Đỏ là 5; Xanh lá tới đó ở progress 24.
    state = setHorses(state, 1, [['TRACK', 24]]);
    state = roll(state, 6);
    expect(state.players[1].horses[0]).toMatchObject({ status: 'YARD', pos: -1 });
    expect(state.logs.some((entry) => /đá/.test(entry.text))).toBe(true);
  });
});

describe('Cờ Cá Ngựa · di chuyển trên đường đua', () => {
  it('đi đúng số vừa tung', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 4]]);
    state = roll(state, 3);
    expect(state.players[0].horses[0].pos).toBe(7);
    expect(state.currentTurn).toBe(1);
    expect(state.bonusRolls).toBe(0);
  });

  it('tung được 6 thì đi 6 ô và còn được tung tiếp không giới hạn', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 4], ['TRACK', 46], ['TRACK', 46], ['TRACK', 46]]);
    state.bonusRolls = 9;
    state = roll(state, ROLL_AGAIN_FACE);
    expect(state.players[0].horses[0].pos).toBe(10);
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(10);
  });

  it('không được vượt qua ô vào chuồng', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', GATE - 1]]);
    state = roll(state, 2);
    expect(state.players[0].horses[0].pos).toBe(GATE - 1);
    expect(state.currentTurn).toBe(1);
  });

  it('đá quân đối thủ ở đúng ô đích', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 10], ['TRACK', 11]]);
    // Đỏ đi 3 từ progress 10 sẽ tới ô tuyệt đối 18; Xanh lá đứng ở đó với progress 37.
    state = setHorses(state, 1, [['TRACK', 37]]);
    state = roll(state, 3);
    const index = state.pending.moves.findIndex((entry) => entry.captures.length === 1);
    expect(index).toBeGreaterThanOrEqual(0);
    state = move(state, index);
    expect(state.players[1].horses[0]).toMatchObject({ status: 'YARD', pos: -1 });
    expect(state.players[0].horses[0].pos).toBe(13);
  });

  it('quân của mình đứng chung ô thì không sao', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', 0], ['TRACK', 3]]);
    state = roll(state, 3);
    const index = state.pending.moves.findIndex((entry) => entry.captures.length === 0);
    state = move(state, index);
    expect(state.players[0].horses[0].pos).toBe(3);
    expect(state.players[0].horses[1].pos).toBe(3);
  });

  it('quân đang đứng ở ô vào chuồng vẫn bị đá được', () => {
    let state = started(2);
    // Đỏ dừng ở cổng (ô tuyệt đối 4); Xanh lá đi 3 ô từ progress 20 sẽ vào đúng ô đó.
    state = setHorses(state, 0, [['TRACK', GATE]]);
    state = setHorses(state, 1, [['TRACK', 20]]);
    state = turn(state, 1);
    state = roll(state, 3, 'p2');
    expect(state.players[0].horses[0]).toMatchObject({ status: 'YARD', pos: -1 });
    expect(state.players[1].horses[0].pos).toBe(23);
  });

  it('"sát nút" nhận diện quân địch đứng ngay ô trước mặt', () => {
    const state = started(2);
    setHorses(state, 0, [['TRACK', 10]]);
    setHorses(state, 1, [['TRACK', 35]]);
    expect(isSatNut(state, state.players[0], state.players[0].horses[0])).toBe(true);
    expect(isSatNut(state, state.players[1], state.players[1].horses[0])).toBe(false);
  });

  it('chỉ người đang tới lượt mới được tung và đi', () => {
    const state = started(2);
    expect(() => roll(state, 3, 'p2')).toThrow('Chưa tới lượt');
    expect(() => move(state, 0, 'p2')).toThrow('Chưa tới lượt');
  });

  it('không thể đi khi chưa tung hoặc chọn nước sai', () => {
    const state = started(2);
    expect(() => move(state, 0)).toThrow('tung xúc xắc');
    const rolled = roll(setHorses(state, 0, [['TRACK', 0]]), 6);
    expect(() => move(rolled, 99)).toThrow('không hợp lệ');
  });
});

describe('Cờ Cá Ngựa · vào chuồng', () => {
  it('hàng dọc có 4 ô và vào theo thứ tự 6 – 5 – 4 – 3', () => {
    expect(HOME_FACES).toEqual([6, 5, 4, 3]);
    const state = started(2);
    expect(homeFaceFor(state.players[0])).toBe(6);
    setHorses(state, 0, [['HOME', 1], ['HOME', 2], ['HOME', 3]]);
    expect(homeFaceFor(state.players[0])).toBe(3);
  });

  it('đứng ở cổng và tung đúng 6 thì vào chuồng bậc 1', () => {
    let state = started(2);
    state = setHorses(state, 0, [['TRACK', GATE], ['TRACK', 46], ['TRACK', 46], ['TRACK', 46]]);
    state = roll(state, 6);
    expect(state.players[0].horses[0]).toMatchObject({ status: 'HOME', pos: 1 });
    expect(state.currentTurn).toBe(0);
    expect(state.bonusRolls).toBe(1);
  });

  it('đứng ở cổng mà tung sai số thì mất lượt', () => {
    for (const value of [2, 3, 4, 5]) {
      let state = started(2);
      state = setHorses(state, 0, [['TRACK', GATE], ['TRACK', 46], ['TRACK', 46], ['TRACK', 46]]);
      state = roll(state, value);
      expect(state.players[0].horses[0]).toMatchObject({ status: 'TRACK', pos: GATE });
      expect(state.currentTurn).toBe(1);
    }
  });

  it('ra 1 cũng không đưa quân đang ở cổng vào chuồng', () => {
    const state = started(2);
    setHorses(state, 0, [['TRACK', GATE], ['TRACK', 46], ['TRACK', 46], ['TRACK', 46]]);
    expect(listMoves(state, state.players[0], 1).some((entry) => entry.target.status === 'HOME')).toBe(false);
  });

  it('quân thứ hai phải tung đúng 5', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 1], ['TRACK', GATE]]);
    expect(listMoves(state, state.players[0], 6).some((entry) => entry.target.status === 'HOME')).toBe(false);
    state = roll(state, 5);
    expect(state.players[0].horses[1]).toMatchObject({ status: 'HOME', pos: 2 });
    expect(state.currentTurn).toBe(1);
  });

  it('đủ 4 ngựa vào chuồng thì thắng ngay', () => {
    let state = started(2);
    state = setHorses(state, 0, [['HOME', 1], ['HOME', 2], ['HOME', 3], ['TRACK', GATE]]);
    state = roll(state, 3);
    expect(state.status).toBe('FINISHED');
    expect(state.winnerId).toBe('p1');
    expect(state.winReason).toBe('ALL_HOME');
    expect(state.players[0].horses.map((horse) => horse.pos)).toEqual([1, 2, 3, 4]);
  });
});

describe('Cờ Cá Ngựa · vòng chơi', () => {
  it('bỏ qua người đã rời phòng khi chuyển lượt', () => {
    let state = started(3);
    state.players[1].left = true;
    state = roll(state, 3);
    expect(state.currentTurn).toBe(2);
  });

  it('chủ phòng chỉ được bỏ lượt của người mất kết nối', () => {
    let state = started(2);
    state.players[1].connected = false;
    turn(state, 1);
    expect(() => reduce(state, 'p2', { type: 'SKIP_TURN' })).toThrow(GameError);
    state = reduce(state, 'p1', { type: 'SKIP_TURN' });
    expect(state.currentTurn).toBe(0);
    expect(state.players).toHaveLength(2);
  });

  it('không bỏ lượt của người vẫn đang kết nối', () => {
    const state = turn(started(2), 1);
    expect(() => reduce(state, 'p1', { type: 'SKIP_TURN' })).toThrow('vẫn đang kết nối');
  });

  it('mỗi hành động tăng version để server đồng bộ', () => {
    let state = started(2);
    const before = state.version;
    state = roll(state, 3);
    expect(state.version).toBe(before + 1);
  });

  it('màu chuồng khớp với ô xuất quân trên bàn cờ', () => {
    expect(COLORS.RED.start).toBe(5);
    expect(COLORS.BLUE.start).toBe(17);
    expect(COLORS.GREEN.start).toBe(29);
    expect(COLORS.YELLOW.start).toBe(41);
  });
});
