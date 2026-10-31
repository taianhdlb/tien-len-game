// 13×13 grid. The 48-cell shared track is the perimeter, clockwise.
export const BOARD_SIZE = 13;
export const TRACK_LENGTH = 48;

function buildTrack() {
  const cells = [];
  for (let col = 0; col < BOARD_SIZE; col++) cells.push({ row: 0, col });
  for (let row = 1; row < BOARD_SIZE; row++) cells.push({ row, col: BOARD_SIZE - 1 });
  for (let col = BOARD_SIZE - 2; col >= 0; col--) cells.push({ row: BOARD_SIZE - 1, col });
  for (let row = BOARD_SIZE - 2; row >= 1; row--) cells.push({ row, col: 0 });
  return cells;
}

export const TRACK = buildTrack();

const lane = (cells) => cells.map(([row, col]) => ({ row, col }));

export const COLORS = {
  RED: {
    id: 'RED',
    label: 'Đỏ',
    short: 'Đỏ',
    hex: 0xef4444,
    css: '#ef4444',
    light: '#fecaca',
    dark: '#7f1d1d',
    start: 5,
    gate: 4,
    yard: { row: 1, col: 1, size: 3 },
    lane: lane([[1, 4], [2, 4], [3, 4], [4, 4]])
  },
  BLUE: {
    id: 'BLUE',
    label: 'Xanh dương',
    short: 'Xanh dương',
    hex: 0x3b82f6,
    css: '#3b82f6',
    light: '#dbeafe',
    dark: '#1e3a8a',
    start: 17,
    gate: 16,
    yard: { row: 1, col: 9, size: 3 },
    lane: lane([[4, 11], [4, 10], [4, 9], [4, 8]])
  },
  GREEN: {
    id: 'GREEN',
    label: 'Xanh lá',
    short: 'Xanh lá',
    hex: 0x22c55e,
    css: '#22c55e',
    light: '#dcfce7',
    dark: '#14532d',
    start: 29,
    gate: 28,
    yard: { row: 9, col: 9, size: 3 },
    lane: lane([[11, 8], [10, 8], [9, 8], [8, 8]])
  },
  YELLOW: {
    id: 'YELLOW',
    label: 'Vàng',
    short: 'Vàng',
    hex: 0xfacc15,
    css: '#facc15',
    light: '#fef9c3',
    dark: '#713f12',
    start: 41,
    gate: 40,
    yard: { row: 9, col: 1, size: 3 },
    lane: lane([[8, 1], [8, 2], [8, 3], [8, 4]])
  }
};

export const COLOR_ORDER = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

// Two players sit opposite each other; extra seats fill clockwise.
export const COLOR_SETS = {
  2: ['RED', 'GREEN'],
  3: ['RED', 'BLUE', 'GREEN'],
  4: ['RED', 'BLUE', 'GREEN', 'YELLOW']
};

// Hàng dọc màu có đúng 4 ô: 4 ngựa vào lần lượt theo thứ tự tung 6 → 5 → 4 → 3.
export const HOME_SLOTS = 4;

const YARD_OFFSETS = [
  [0.85, 0.85],
  [0.85, 2.15],
  [2.15, 0.85],
  [2.15, 2.15]
];

export const cellCenter = (cell) => ({ row: cell.row + 0.5, col: cell.col + 0.5 });

export const trackIndex = (colorId, progress) =>
  (COLORS[colorId].start + progress) % TRACK_LENGTH;

export function yardSlot(colorId, index) {
  const { yard } = COLORS[colorId];
  const [dr, dc] = YARD_OFFSETS[index % 4];
  return { row: yard.row + dr, col: yard.col + dc };
}

export function homeSlot(colorId, step) {
  const cell = COLORS[colorId].lane[step - 1];
  return cell ? cellCenter(cell) : null;
}

export function horsePoint(colorId, horse, slot = 0) {
  if (horse.status === 'YARD') return yardSlot(colorId, slot);
  if (horse.status === 'HOME') return homeSlot(colorId, horse.pos);
  if (horse.status === 'TRACK') return cellCenter(TRACK[trackIndex(colorId, horse.pos)]);
  return null;
}

export function describeCell(colorId, target) {
  if (!target) return '';
  if (target.status === 'HOME') return `chuồng bậc ${target.pos}`;
  if (target.status === 'TRACK') {
    const absolute = trackIndex(colorId, target.pos);
    return `ô ${absolute + 1}`;
  }
  return 'chuồng';
}
