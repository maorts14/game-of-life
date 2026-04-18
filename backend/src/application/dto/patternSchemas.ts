import { z } from "zod";
import { coordinateSchema } from "./worldSchemas.js";

export const createPatternSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    description: z.string().trim().max(280).default(""),
    width: z.number().int().positive().max(120),
    height: z.number().int().positive().max(80),
    cells: z.array(coordinateSchema),
  })
  .superRefine((value, context) => {
    for (const [x, y] of value.cells) {
      if (x >= value.width || y >= value.height) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Pattern cells must stay within the declared width and height.",
        });
        return;
      }
    }
  });
