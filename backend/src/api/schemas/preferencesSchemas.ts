import { z } from "zod";

export const updatePreferencesSchema = z.object({
  simulationSpeed: z.number().int().min(1).max(20).optional(),
  lastOpenedCloudWorldId: z.uuid().nullable().optional(),
});
