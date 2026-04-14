import { z } from "zod";

export const usersCsvRowSchema = z.object({
  phone: z.string(),
  name: z.string(),
  email: z.string().optional(),
});

export const familiesCsvRowSchema = z.object({
  name: z.string(),
  contactPerson: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
});

export const groupsCsvRowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
});

export type UsersCsvRow = z.infer<typeof usersCsvRowSchema>;
export type FamiliesCsvRow = z.infer<typeof familiesCsvRowSchema>;
export type GroupsCsvRow = z.infer<typeof groupsCsvRowSchema>;
