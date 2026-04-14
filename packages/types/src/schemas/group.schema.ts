import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2).max(255),
  description: z.string().max(1000).optional(),
  city: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(1000).optional(),
  city: z.string().max(255).optional(),
  phone: z.string().max(20).optional(),
});

export const assignManagerSchema = z.object({
  userId: z.string().cuid(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AssignManagerInput = z.infer<typeof assignManagerSchema>;
