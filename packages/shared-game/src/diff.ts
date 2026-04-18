import { setCell } from "./engine.js";
import type { CellDiff, Grid } from "./types.js";

export function createCellDiffFromGrids(previousGrid: Grid, nextGrid: Grid): CellDiff {
  const setAlive: Array<[number, number]> = [];
  const setDead: Array<[number, number]> = [];

  for (let y = 0; y < nextGrid.length; y += 1) {
    for (let x = 0; x < (nextGrid[y]?.length ?? 0); x += 1) {
      const previousValue = previousGrid[y]?.[x] ?? 0;
      const nextValue = nextGrid[y]?.[x] ?? 0;

      if (previousValue === nextValue) {
        continue;
      }

      if (nextValue === 1) {
        setAlive.push([x, y]);
      } else {
        setDead.push([x, y]);
      }
    }
  }

  return {
    setAlive,
    setDead,
  };
}

export function applyCellDiff(grid: Grid, diff: CellDiff): Grid {
  let nextGrid = grid;

  for (const [x, y] of diff.setAlive) {
    if (y < nextGrid.length && x < (nextGrid[0]?.length ?? 0)) {
      nextGrid = setCell(nextGrid, x, y, 1);
    }
  }

  for (const [x, y] of diff.setDead) {
    if (y < nextGrid.length && x < (nextGrid[0]?.length ?? 0)) {
      nextGrid = setCell(nextGrid, x, y, 0);
    }
  }

  return nextGrid;
}
