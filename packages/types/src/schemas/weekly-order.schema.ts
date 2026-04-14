import { z } from "zod";
import { OrderStatus } from "../enums";

export const createWeeklyOrderSchema = z.object({
  familyId: z.string().cuid(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        quantity: z.number().positive(),
        unit: z.string().max(50),
      })
    )
    .min(1),
  notes: z.string().max(1000).optional(),
});

export const updateWeeklyOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(255),
        quantity: z.number().positive(),
        unit: z.string().max(50),
      })
    )
    .optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateWeeklyOrderInput = z.infer<typeof createWeeklyOrderSchema>;
export type UpdateWeeklyOrderInput = z.infer<typeof updateWeeklyOrderSchema>;
