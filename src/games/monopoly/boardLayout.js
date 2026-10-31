export const CORNER_IDS = new Set([0, 10, 20, 30]);

// 11x11 CSS grid: corners take 1.45fr, edge tiles 1fr.
export function getTileGridArea(pos) {
  let row;
  let col;
  let edge;

  if (pos <= 10) {
    row = 11;
    col = 11 - pos;
    edge = pos === 0 || pos === 10 ? 'corner' : 'bottom';
  } else if (pos <= 20) {
    row = 11 - (pos - 10);
    col = 1;
    edge = pos === 20 ? 'corner' : 'left';
  } else if (pos <= 30) {
    row = 1;
    col = pos - 19;
    edge = pos === 30 ? 'corner' : 'top';
  } else {
    row = pos - 29;
    col = 11;
    edge = 'right';
  }

  return { row, col, edge };
}

export const isCorner = (pos) => CORNER_IDS.has(pos);
