import { setCell } from "./engine";
import type { Grid } from "./types";

export interface PatternDefinition {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  cells: Array<[number, number]>;
}

export const PATTERNS: PatternDefinition[] = [
  {
    id: "glider",
    name: "Glider",
    description: "A 5-cell spaceship that travels diagonally across the board over time.",
    width: 3,
    height: 3,
    cells: [
      [1, 0],
      [2, 1],
      [0, 2],
      [1, 2],
      [2, 2],
    ],
  },
  {
    id: "blinker",
    name: "Blinker",
    description: "The simplest oscillator. It flips between a vertical and horizontal line.",
    width: 3,
    height: 3,
    cells: [
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: "toad",
    name: "Toad",
    description: "A six-cell period-2 oscillator that alternates between two staggered rows.",
    width: 4,
    height: 2,
    cells: [
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: "beacon",
    name: "Beacon",
    description: "A period-2 oscillator made from two blocks that blink at the touching corner.",
    width: 4,
    height: 4,
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 2],
      [3, 2],
      [2, 3],
      [3, 3],
    ],
  },
  {
    id: "lwss",
    name: "LWSS",
    description: "A lightweight spaceship that slides horizontally while cycling through phases.",
    width: 5,
    height: 4,
    cells: [
      [1, 0],
      [4, 0],
      [0, 1],
      [0, 2],
      [4, 2],
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
  },
];

export function getPatternById(patternId: string): PatternDefinition | undefined {
  return PATTERNS.find((pattern) => pattern.id === patternId);
}

export function insertPatternAt(grid: Grid, patternId: string, anchorX: number, anchorY: number): Grid {
  const pattern = getPatternById(patternId);
  const width = grid[0]?.length ?? 0;
  const height = grid.length;

  if (!pattern || width === 0 || height === 0) {
    return grid;
  }

  return pattern.cells.reduce((nextGrid, [x, y]) => {
    const targetX = anchorX + x;
    const targetY = anchorY + y;

    if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) {
      return nextGrid;
    }

    return setCell(nextGrid, targetX, targetY, 1);
  }, grid);
}
