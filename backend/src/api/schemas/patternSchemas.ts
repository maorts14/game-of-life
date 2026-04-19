import { z } from "zod";
import { uuidSchema } from "./shared.js";

export const patternIdParamsSchema = z.object({
  id: uuidSchema,
});

export const listPatternsQuerySchema = z.object({
  scope: z.enum(["builtin", "mine"]).default("mine"),
});

export const createPatternSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).default(""),
  width: z.number().int().min(1).max(120),
  height: z.number().int().min(1).max(120),
  cells: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])).min(1),
});
