import { SystemRole, GroupRole } from "../enums";

export interface UserDto {
  id: string;
  phone: string;
  name: string;
  email?: string;
  systemRole: SystemRole;
  groupId?: string;
  groupRole?: GroupRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateUserDto {
  phone: string;
  name: string;
  email?: string;
  systemRole?: SystemRole;
  groupId?: string;
  groupRole?: GroupRole;
}

export interface UpdateUserDto {
  phone?: string;
  name?: string;
  email?: string;
  systemRole?: SystemRole;
  groupId?: string;
  groupRole?: GroupRole;
}
