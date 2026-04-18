import {
  DEFAULT_WORLD_NAME,
  MAX_WORLD_HEIGHT,
  MAX_WORLD_WIDTH,
  MIN_WORLD_HEIGHT,
  MIN_WORLD_WIDTH,
} from "@game-of-life/shared-game";
import { z } from "zod";

const cellSchema = z.union([z.literal(0), z.literal(1)]);
export const coordinateSchema = z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]);
export const gridSchema = z.array(z.array(cellSchema)).superRefine((grid, context) => {
  const width = grid[0]?.length ?? 0;

  if (width === 0 || grid.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Grid must contain at least one row and one column.",
    });
    return;
  }

  for (const row of grid) {
    if (row.length !== width) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Grid rows must all have the same width.",
      });
      return;
    }
  }
});

export const createWorldSchema = z.object({
  name: z.string().trim().max(80).optional().default(DEFAULT_WORLD_NAME),
  width: z.number().int().min(MIN_WORLD_WIDTH).max(MAX_WORLD_WIDTH),
  height: z.number().int().min(MIN_WORLD_HEIGHT).max(MAX_WORLD_HEIGHT),
});

export const updateWorldMetadataSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const patchWorldCellsSchema = z.object({
  setAlive: z.array(coordinateSchema).default([]),
  setDead: z.array(coordinateSchema).default([]),
});

export const replaceWorldStateSchema = z.object({
  grid: gridSchema,
  generation: z.number().int().nonnegative(),
});
