import { z } from "zod";
import { SystemRole, GroupRole } from "../enums";

export const createUserSchema = z.object({
  phone: z.string().min(9).max(20),
  name: z.string().min(2).max(255),
  email: z.string().email().optional(),
  systemRole: z.nativeEnum(SystemRole).default(SystemRole.USER),
  groupId: z.string().cuid().optional(),
  groupRole: z.nativeEnum(GroupRole).optional(),
});

export const updateUserSchema = z.object({
  phone: z.string().min(9).max(20).optional(),
  name: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  systemRole: z.nativeEnum(SystemRole).optional(),
  groupId: z.string().cuid().optional(),
  groupRole: z.nativeEnum(GroupRole).optional(),
});

export const loginByPhoneSchema = z.object({
  phone: z.string().min(9).max(20),
  verificationCode: z.string().length(6),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginByPhoneInput = z.infer<typeof loginByPhoneSchema>;
