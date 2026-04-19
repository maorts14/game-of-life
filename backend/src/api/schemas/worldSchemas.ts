import { z } from "zod";
import { pointSchema, uuidSchema } from "./shared.js";

export const worldIdParamsSchema = z.object({
  id: uuidSchema,
});

export const createWorldSchema = z.object({
  name: z.string().trim().min(1).max(80),
  width: z.number().int().min(12).max(120),
  height: z.number().int().min(12).max(80),
  grid: z.array(z.array(z.union([z.literal(0), z.literal(1)]))).optional(),
  generation: z.number().int().min(0).optional(),
});

export const renameWorldSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export const patchCellsSchema = z.object({
  setAlive: z.array(pointSchema).default([]),
  setDead: z.array(pointSchema).default([]),
  expectedVersion: z.number().int().positive(),
});

export const versionedMutationSchema = z.object({
  expectedVersion: z.number().int().positive(),
});

export const applyPatternSchema = z.object({
  patternId: z.string().min(1),
  anchorX: z.number().int().min(0),
  anchorY: z.number().int().min(0),
  expectedVersion: z.number().int().positive(),
});
