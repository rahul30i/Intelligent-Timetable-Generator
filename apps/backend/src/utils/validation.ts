import { z } from "zod";

export const idSchema = z.string().uuid();

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:MM)");
