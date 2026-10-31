import { describe, expect, it, vi } from 'vitest';
import { runAction } from './useOptimisticDispatch.js';

class GameError extends Error {}

const step = (state) => ({ ...state, version: state.version + 1 });
const STALE = { ok: false, error: 'Trạng thái đã cũ, đang đồng bộ lại...' };

function harness({ reduce = step, emits = [{ ok: true }], server = null, room = { version: 1 } } = {}) {
  const calls = { emitted: [], reduced: [], set: [], notified: [] };
  let index = 0;
  const ctx = {
    room,
    myId: 'p1',
    event: 'game:submit',
    reduce: (state, playerId, action) => {
      calls.reduced.push({ state, playerId, action });
      return reduce(state, playerId, action);
    },
    GameError,
    setRoom: (next) => calls.set.push(next),
    emit: async (event, payload, options) => {
      calls.emitted.push({ event, payload, options });
      return emits[index++] ?? { ok: true };
    },
    getServerRoom: () => server,
    notify: (message, tone) => calls.notified.push({ message, tone }),
    inFlight: { current: false }
  };
  return { calls, ctx };
}

describe('gửi nước đi lạc quan', () => {
  it('gửi một lần khi server chấp nhận', async () => {
    const { calls, ctx } = harness();
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(true);
    expect(calls.emitted).toHaveLength(1);
    expect(calls.emitted[0].payload.state.version).toBe(2);
    expect(calls.set).toHaveLength(1);
    expect(calls.notified).toHaveLength(0);
  });

  it('báo lỗi luật chơi và không gửi gì lên server', async () => {
    const { calls, ctx } = harness({
      reduce: () => {
        throw new GameError('Chưa tới lượt của bạn!');
      }
    });
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(calls.emitted).toHaveLength(0);
    expect(calls.notified).toEqual([{ message: 'Chưa tới lượt của bạn!', tone: 'error' }]);
  });

  it('không nuốt lỗi ngoài dự kiến', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const boom = new Error('bug');
    const { calls, ctx } = harness({
      reduce: () => {
        throw boom;
      }
    });
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(spy).toHaveBeenCalledWith(boom);
    expect(calls.notified).toHaveLength(0);
    spy.mockRestore();
  });

  it('chơi lại trên snapshot của server khi bị chê là cũ', async () => {
    const fresh = { version: 7 };
    const { calls, ctx } = harness({ emits: [STALE, { ok: true }], server: fresh });
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(true);
    expect(calls.emitted).toHaveLength(2);
    expect(calls.reduced[1].state).toBe(fresh);
    expect(calls.emitted[1].payload.state.version).toBe(8);
  });

  it('thử tối đa ba lần rồi chịu thua', async () => {
    const { calls, ctx } = harness({ emits: [STALE, STALE, STALE], server: { version: 2 } });
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(calls.emitted).toHaveLength(3);
    // Lần cuối mới hiện thông báo để người chơi không bị làm phiền giữa chừng.
    expect(calls.emitted.map((entry) => entry.options.silent)).toEqual([true, true, false]);
  });

  it('dừng ngay khi server từ chối vì lý do khác', async () => {
    const { calls, ctx } = harness({ emits: [{ ok: false, error: 'Chưa tới lượt của bạn!' }], server: { version: 9 } });
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(calls.emitted).toHaveLength(1);
  });

  it('không chơi lại nếu mất snapshot của server', async () => {
    const { calls, ctx } = harness({ emits: [STALE], server: null });
    await expect(runAction(ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(calls.emitted).toHaveLength(1);
  });

  it('chặn thao tác chồng lên nhau và không gửi khi chưa vào phòng', async () => {
    const busy = harness();
    busy.ctx.inFlight.current = true;
    await expect(runAction(busy.ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(busy.calls.emitted).toHaveLength(0);

    const noRoom = harness({ room: null });
    await expect(runAction(noRoom.ctx, { type: 'ROLL' })).resolves.toBe(false);
    expect(noRoom.calls.emitted).toHaveLength(0);
  });

  it('thả khoá sau khi xong để lần sau còn đi được', async () => {
    const { ctx } = harness();
    await runAction(ctx, { type: 'ROLL' });
    expect(ctx.inFlight.current).toBe(false);
    const failed = harness({ emits: [STALE, STALE, STALE], server: { version: 2 } });
    await runAction(failed.ctx, { type: 'ROLL' });
    expect(failed.ctx.inFlight.current).toBe(false);
  });
});
