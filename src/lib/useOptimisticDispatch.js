import { useCallback, useRef } from 'react';
import { useToast } from '../components/toast-context.js';

export const STALE_ERROR = /trạng thái đã cũ/i;
const MAX_ATTEMPTS = 3;

/**
 * Cờ Tỷ Phú và Cờ Cá Ngựa để client tự tính nước đi rồi gửi trạng thái lên server.
 * Nếu trong lúc đó người khác đi trước, server chê "trạng thái đã cũ" — phải chơi lại
 * đúng thao tác ấy trên snapshot mới nhất, nếu không lượt của mình sẽ biến mất.
 */
export async function runAction(ctx, action) {
  const { room, myId, event, reduce, GameError, setRoom, emit, getServerRoom, notify, inFlight } = ctx;
  if (!room || inFlight.current) return false;
  inFlight.current = true;
  try {
    let base = room;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
      let next;
      try {
        next = reduce(base, myId, action);
      } catch (err) {
        if (err instanceof GameError) notify(err.message, 'error');
        else console.error(err);
        return false;
      }
      setRoom(next);
      const res = await emit(event, { state: next }, { silent: attempt < MAX_ATTEMPTS - 1 });
      if (res?.ok !== false) return true;
      if (!STALE_ERROR.test(res.error || '')) return false;
      base = getServerRoom();
      if (!base) return false;
    }
    return false;
  } finally {
    inFlight.current = false;
  }
}

export function useOptimisticDispatch({
  room,
  myId,
  event,
  reduce,
  GameError,
  setRoom,
  emit,
  getServerRoom
}) {
  const { notify } = useToast();
  const inFlight = useRef(false);
  return useCallback(
    (action) =>
      runAction({ room, myId, event, reduce, GameError, setRoom, emit, getServerRoom, notify, inFlight }, action),
    [room, myId, event, reduce, GameError, setRoom, emit, getServerRoom, notify]
  );
}
