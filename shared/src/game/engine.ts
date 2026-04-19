import type { Cell, Grid, Point } from "./types.js";

export function createEmptyGrid(width: number, height: number): Grid {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => 0 as Cell));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function countNeighbors(grid: Grid, x: number, y: number): number {
  let count = 0;

  for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
    for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
      if (offsetX === 0 && offsetY === 0) {
        continue;
      }

      const nextY = y + offsetY;
      const nextX = x + offsetX;

      if (nextY < 0 || nextY >= grid.length || nextX < 0 || nextX >= grid[0].length) {
        continue;
      }

      count += grid[nextY][nextX];
    }
  }

  return count;
}

export function computeNextGeneration(grid: Grid): Grid {
  return grid.map((row, y) =>
    row.map((cell, x) => {
      const neighbors = countNeighbors(grid, x, y);

      if (cell === 1) {
        return neighbors < 2 || neighbors > 3 ? 0 : 1;
      }

      return neighbors === 3 ? 1 : 0;
    }),
  );
}

export function setCell(grid: Grid, x: number, y: number, value: Cell): Grid {
  return grid.map((row, rowIndex) =>
    rowIndex === y
      ? row.map((cell, columnIndex) => (columnIndex === x ? value : cell))
      : row,
  );
}

export function applyCellBatch(
  grid: Grid,
  updates: Array<Point & { value: Cell }>,
): Grid {
  const next = cloneGrid(grid);

  for (const update of updates) {
    if (
      update.y < 0 ||
      update.y >= next.length ||
      update.x < 0 ||
      update.x >= (next[update.y]?.length ?? 0)
    ) {
      continue;
    }

    next[update.y][update.x] = update.value;
  }

  return next;
}

export function randomizeGrid(width: number, height: number, density = 0.24): Grid {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => (Math.random() < density ? 1 : 0) as Cell),
  );
}

export function getPopulation(grid: Grid): number {
  return grid.reduce(
    (sum, row) => sum + row.reduce<number>((rowSum, cell) => rowSum + cell, 0),
    0,
  );
}
