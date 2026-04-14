import { z } from "zod";

export const createFamilySchema = z.object({
  name: z.string().min(2).max(255),
  contactPerson: z.string().min(2).max(255),
  phone: z.string().min(9).max(20),
  email: z.string().email().optional(),
  city: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  groupId: z.string().cuid(),
});

export const updateFamilySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  contactPerson: z.string().min(2).max(255).optional(),
  phone: z.string().min(9).max(20).optional(),
  email: z.string().email().optional(),
  city: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateFamilyInput = z.infer<typeof createFamilySchema>;
export type UpdateFamilyInput = z.infer<typeof updateFamilySchema>;
