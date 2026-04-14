import { PaymentStatus, PaymentMethod } from "../enums";

export interface PaymentDto {
  id: string;
  familyId: string;
  amount: number;
  monthKey: string;
  status: PaymentStatus;
  method: PaymentMethod;
  notes?: string;
  transactionId?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface PaymentStatusDto {
  familyId: string;
  monthKey: string;
  isPaid: boolean;
  amount?: number;
  dueDate?: Date;
  lastReminder?: Date;
  reminderCount: number;
}

export interface CreatePaymentDto {
  familyId: string;
  amount: number;
  monthKey: string;
  method: PaymentMethod;
  notes?: string;
  transactionId?: string;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  notes?: string;
  amount?: number;
}
