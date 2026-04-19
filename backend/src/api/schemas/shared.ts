import { z } from "zod";

export const uuidSchema = z.uuid();

export const pointSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
});
