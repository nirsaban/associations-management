import { z } from "zod";
import { PaymentStatus, PaymentMethod } from "../enums";

export const createPaymentSchema = z.object({
  familyId: z.string().cuid(),
  amount: z.number().positive(),
  monthKey: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  method: z.nativeEnum(PaymentMethod),
  notes: z.string().max(500).optional(),
});

export const webhookPayloadSchema = z.object({
  transactionId: z.string(),
  familyId: z.string().cuid(),
  amount: z.number().positive(),
  status: z.nativeEnum(PaymentStatus),
  method: z.nativeEnum(PaymentMethod),
  timestamp: z.string().datetime(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
