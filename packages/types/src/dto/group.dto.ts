import { UserDto } from "./user.dto";

export interface GroupDto {
  id: string;
  name: string;
  description?: string;
  city?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface GroupWithMembersDto extends GroupDto {
  members: UserDto[];
  memberCount: number;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  city?: string;
  phone?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  city?: string;
  phone?: string;
}
