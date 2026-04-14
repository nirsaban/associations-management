export interface FamilyDto {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
  groupId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateFamilyDto {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
  groupId: string;
}

export interface UpdateFamilyDto {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  city?: string;
  address?: string;
  notes?: string;
}
