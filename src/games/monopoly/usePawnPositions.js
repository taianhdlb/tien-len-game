import { useEffect, useState, useSyncExternalStore } from 'react';
import { BOARD_SIZE } from './engine.js';

const STEP_MS = 130;
// 2×D6 tối đa 12 ô: khoảng cách dài hơn nghĩa là nhảy tức thì (chặng bay, tạm giam).
const MAX_WALK = 12;

const walkingGap = (from, to) => (to - from + BOARD_SIZE) % BOARD_SIZE;
const positionsOf = (room) =>
  Object.fromEntries((room?.players || []).filter((p) => !p.left).map((p) => [p.id, p.position || 0]));

/**
 * Quân cờ bước từng ô tới vị trí chuẩn của phòng. Trạng thái di chuyển sống ngoài React
 * (một interval tự dừng khi tới nơi), nên broadcast của người khác chỉ đổi đích đến
 * chứ không cắt ngang bước đi — hết lỗi icon đứng yên ở ô cũ khi chơi 4 người.
 */
export function createPawnWalker() {
  let targets = {};
  let positions = {};
  let snapshot = {};
  let timer = 0;
  const listeners = new Set();

  const stopRun = () => {
    if (timer) {
      clearInterval(timer);
      timer = 0;
    }
  };

  const publish = () => {
    snapshot = { ...positions };
    listeners.forEach((notify) => notify());
  };

  const step = () => {
    let moved = false;
    let stillBehind = false;
    Object.keys(targets).forEach((id) => {
      if (positions[id] === targets[id]) return;
      positions[id] = (positions[id] + 1) % BOARD_SIZE;
      moved = true;
      if (positions[id] !== targets[id]) stillBehind = true;
    });
    if (moved) publish();
    // Dừng ngay ở bước cuối để không để lại interval chạy chờ.
    if (!stillBehind) stopRun();
  };

  return {
    sync(room) {
      if (room?.status !== 'PLAYING') {
        stopRun();
        targets = {};
        positions = positionsOf(room);
        publish();
        return;
      }

      targets = positionsOf(room);
      Object.keys(positions).forEach((id) => {
        if (!(id in targets)) delete positions[id];
      });
      Object.entries(targets).forEach(([id, to]) => {
        const from = positions[id];
        if (from === undefined || walkingGap(from, to) > MAX_WALK) positions[id] = to;
      });
      publish();

      const walking = Object.keys(targets).some((id) => positions[id] !== targets[id]);
      if (walking && !timer) timer = setInterval(step, STEP_MS);
      if (!walking) stopRun();
    },
    subscribe(notify) {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    getSnapshot: () => snapshot,
    stop() {
      stopRun();
      listeners.clear();
    }
  };
}

export function usePawnPositions(room) {
  const [walker] = useState(createPawnWalker);

  useEffect(() => {
    walker.sync(room);
  }, [walker, room]);

  useEffect(() => () => walker.stop(), [walker]);

  return useSyncExternalStore(walker.subscribe, walker.getSnapshot, walker.getSnapshot);
}
