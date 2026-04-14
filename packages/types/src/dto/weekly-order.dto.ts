import { OrderStatus } from "../enums";

export interface WeeklyOrderItemDto {
  name: string;
  quantity: number;
  unit: string;
}

export interface WeeklyOrderDto {
  id: string;
  familyId: string;
  monthKey: string;
  status: OrderStatus;
  items: WeeklyOrderItemDto[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface CreateWeeklyOrderDto {
  familyId: string;
  monthKey: string;
  items: WeeklyOrderItemDto[];
  notes?: string;
}

export interface UpdateWeeklyOrderDto {
  status?: OrderStatus;
  items?: WeeklyOrderItemDto[];
  notes?: string;
}
