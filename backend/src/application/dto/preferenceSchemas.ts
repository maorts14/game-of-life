import {
  DEFAULT_SIMULATION_SPEED,
  MAX_SIMULATION_SPEED,
  MIN_SIMULATION_SPEED,
} from "@game-of-life/shared-game";
import { z } from "zod";

export const updatePreferencesSchema = z.object({
  simulationSpeed: z
    .number()
    .int()
    .min(MIN_SIMULATION_SPEED)
    .max(MAX_SIMULATION_SPEED)
    .default(DEFAULT_SIMULATION_SPEED),
  lastOpenedWorldId: z.string().uuid().nullable(),
});
