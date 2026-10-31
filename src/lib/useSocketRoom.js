import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getSocket } from './socket.js';
import { getPlayerId } from './player.js';
import { useToast } from '../components/toast-context.js';

/**
 * Owns the socket session for one game: join/leave, state broadcast, reconnect.
 * `stateEvent` is the server event that carries the room snapshot.
 * `options.onSession` reports { joined, inGame, leave } so a parent shell can
 * hand the seat over before swapping to another game mode.
 */
export function useSocketRoom(game, stateEvent, { onSession } = {}) {
  const socket = getSocket();
  const { notify } = useToast();
  const [myId] = useState(getPlayerId);
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);

  const joinedRef = useRef(false);
  const targetRoomRef = useRef(null);
  const lastJoinRef = useRef(null);
  // The last snapshot the server actually accepted. Optimistic local edits never touch it,
  // so a rejected submit can be replayed against real server state instead of being lost.
  const serverRoomRef = useRef(null);

  // Reading socket.connected through an external store avoids missing a connect
  // that fires between render and the first effect subscription.
  const connected = useSyncExternalStore(
    useCallback(
      (onChange) => {
        socket.on('connect', onChange);
        socket.on('disconnect', onChange);
        return () => {
          socket.off('connect', onChange);
          socket.off('disconnect', onChange);
        };
      },
      [socket]
    ),
    () => socket.connected,
    () => false
  );

  useEffect(() => {
    const onState = (next) => {
      if (!next || (targetRoomRef.current && next.id !== targetRoomRef.current)) return;
      serverRoomRef.current = next;
      setRoom(next);
    };
    const onConnect = () => {
      if (joinedRef.current && lastJoinRef.current) {
        socket.emit(`${game}:join`, { ...lastJoinRef.current, playerId: getPlayerId() });
      }
    };
    const onReplaced = () => {
      joinedRef.current = false;
      serverRoomRef.current = null;
      setJoined(false);
      setRoom(null);
      notify('Tài khoản này vừa được mở ở một tab khác.', 'error');
    };

    socket.on(stateEvent, onState);
    socket.on('connect', onConnect);
    socket.on('session:replaced', onReplaced);
    if (socket.connected && joinedRef.current && lastJoinRef.current) {
      socket.emit(`${game}:join`, { ...lastJoinRef.current, playerId: getPlayerId() });
    }

    return () => {
      socket.off(stateEvent, onState);
      socket.off('connect', onConnect);
      socket.off('session:replaced', onReplaced);
    };
  }, [socket, game, stateEvent, notify]);

  const emit = useCallback(
    (event, payload, { silent = false } = {}) =>
      new Promise((resolve) => {
        socket.emit(event, payload, (res) => {
          if (res && res.ok === false && !silent) notify(res.error || 'Không thể thực hiện thao tác.', 'error');
          resolve(res);
        });
      }),
    [socket, notify]
  );

  const getServerRoom = useCallback(() => serverRoomRef.current, []);

  const join = useCallback(
    async (payload) => {
      const body = { ...payload, playerId: myId };
      targetRoomRef.current = String(payload.roomId || '');
      lastJoinRef.current = body;
      const res = await emit(`${game}:join`, body);
      if (res?.ok) {
        joinedRef.current = true;
        setJoined(true);
      } else {
        targetRoomRef.current = null;
      }
      return res;
    },
    [emit, game, myId]
  );

  const leave = useCallback(async () => {
    joinedRef.current = false;
    lastJoinRef.current = null;
    targetRoomRef.current = null;
    serverRoomRef.current = null;
    await emit('room:leave');
    setJoined(false);
    setRoom(null);
  }, [emit]);

  const inGame = room?.status === 'PLAYING';
  useEffect(() => {
    onSession?.({ joined, inGame, leave });
  }, [onSession, joined, inGame, leave]);

  return { socket, myId, room, setRoom, joined, connected, join, leave, emit, getServerRoom };
}
