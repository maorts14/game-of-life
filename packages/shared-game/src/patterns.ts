import { setCell } from "./engine.js";
import type { Grid, PatternDefinition, SelectionBounds } from "./types.js";

export const BUILTIN_PATTERNS: PatternDefinition[] = [
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
    isBuiltin: true,
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
    isBuiltin: true,
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
    isBuiltin: true,
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
    isBuiltin: true,
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
    isBuiltin: true,
  },
];

export function getAllPatterns(customPatterns: PatternDefinition[] = []): PatternDefinition[] {
  return [...BUILTIN_PATTERNS, ...customPatterns];
}

export function getPatternById(
  patternId: string,
  customPatterns: PatternDefinition[] = [],
): PatternDefinition | undefined {
  return getAllPatterns(customPatterns).find((pattern) => pattern.id === patternId);
}

export function insertPatternAt(
  grid: Grid,
  patternId: string,
  anchorX: number,
  anchorY: number,
  customPatterns: PatternDefinition[] = [],
): Grid {
  const pattern = getPatternById(patternId, customPatterns);
  const width = grid[0]?.length ?? 0;
  const height = grid.length;

  if (!pattern || width === 0 || height === 0) {
    return grid;
  }

  const originX = anchorX - Math.floor(pattern.width / 2);
  const originY = anchorY - Math.floor(pattern.height / 2);

  return pattern.cells.reduce((nextGrid, [x, y]) => {
    const targetX = originX + x;
    const targetY = originY + y;

    if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) {
      return nextGrid;
    }

    return setCell(nextGrid, targetX, targetY, 1);
  }, grid);
}

export function createPatternFromSelection(
  grid: Grid,
  selection: SelectionBounds,
  name: string,
  description: string,
): PatternDefinition | null {
  const minX = Math.max(0, Math.min(selection.startX, selection.endX));
  const maxX = Math.min((grid[0]?.length ?? 1) - 1, Math.max(selection.startX, selection.endX));
  const minY = Math.max(0, Math.min(selection.startY, selection.endY));
  const maxY = Math.min(grid.length - 1, Math.max(selection.startY, selection.endY));

  const liveCells: Array<[number, number]> = [];

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (grid[y]?.[x] === 1) {
        liveCells.push([x, y]);
      }
    }
  }

  if (liveCells.length === 0) {
    return null;
  }

  const offsetX = Math.min(...liveCells.map(([x]) => x));
  const offsetY = Math.min(...liveCells.map(([, y]) => y));
  const trimmedCells = liveCells.map(([x, y]) => [x - offsetX, y - offsetY] as [number, number]);
  const width = Math.max(...trimmedCells.map(([x]) => x)) + 1;
  const height = Math.max(...trimmedCells.map(([, y]) => y)) + 1;

  return {
    id: `custom-${crypto.randomUUID()}`,
    name: name.trim(),
    description: description.trim(),
    width,
    height,
    cells: trimmedCells,
    isBuiltin: false,
  };
}
