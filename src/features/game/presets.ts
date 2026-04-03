import type { Grid } from "./types";
import { setCell } from "./engine";

export function seedGlider(grid: Grid): Grid {
  const width = grid[0]?.length ?? 0;
  const height = grid.length;

  if (width < 3 || height < 3) {
    return grid;
  }

  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);
  const pattern = [
    [1, 0],
    [2, 1],
    [0, 2],
    [1, 2],
    [2, 2],
  ];

  return pattern.reduce((nextGrid, [offsetX, offsetY]) => {
    const x = Math.min(width - 1, Math.max(0, centerX + offsetX - 1));
    const y = Math.min(height - 1, Math.max(0, centerY + offsetY - 1));

    return setCell(nextGrid, x, y, 1);
  }, grid);
}
