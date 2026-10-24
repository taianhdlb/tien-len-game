import { useEffect, useRef, useState } from 'react';
import { BOARD_SIZE } from './engine.js';

const STEP_MS = 140;

/**
 * Walks pawns tile-by-tile from `lastMove` so every client sees the same path.
 * Jumps (teleport / jail) and non-move updates snap straight to the authoritative position.
 */
export function usePawnPositions(room) {
  const [display, setDisplay] = useState({});
  const seenSeq = useRef(null);

  useEffect(() => {
    if (!room) return;
    const move = room.lastMove;
    const timers = [];

    const sync = () =>
      setDisplay(Object.fromEntries(room.players.map((p) => [p.id, p.position || 0])));

    if (!move) {
      seenSeq.current = null;
      timers.push(setTimeout(sync, 0));
    } else if (move.seq !== seenSeq.current) {
      seenSeq.current = move.seq;
      if (!move.jump && move.steps > 0) {
        for (let step = 1; step <= move.steps; step += 1) {
          timers.push(
            setTimeout(
              () => setDisplay((prev) => ({ ...prev, [move.playerId]: (move.from + step) % BOARD_SIZE })),
              step * STEP_MS
            )
          );
        }
        timers.push(setTimeout(sync, move.steps * STEP_MS + 80));
      } else {
        timers.push(setTimeout(sync, 0));
      }
    } else {
      timers.push(setTimeout(sync, 0));
    }

    return () => timers.forEach(clearTimeout);
  }, [room, room?.lastMove?.seq, room?.players?.length, room?.status]);

  return display;
}
