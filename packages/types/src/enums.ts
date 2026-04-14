/**
 * SystemRole — User system-level role
 */
export enum SystemRole {
  ADMIN = "ADMIN",
  USER = "USER",
}

/**
 * GroupRole — User role within a group
 */
export enum GroupRole {
  MEMBER = "MEMBER",
  MANAGER = "MANAGER",
}

/**
 * OrderStatus — Status of a weekly order
 */
export enum OrderStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
}

/**
 * PaymentStatus — Status of a payment
 */
export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

/**
 * PaymentMethod — How a payment was made
 */
export enum PaymentMethod {
  CREDIT_CARD = "CREDIT_CARD",
  BANK_TRANSFER = "BANK_TRANSFER",
  CASH = "CASH",
  OTHER = "OTHER",
}

/**
 * ReminderChannel — How to send a reminder
 */
export enum ReminderChannel {
  SMS = "SMS",
  PUSH = "PUSH",
  WHATSAPP = "WHATSAPP",
}

/**
 * NotificationType — Type of notification to send
 */
export enum NotificationType {
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  WEEKLY_ORDER = "WEEKLY_ORDER",
  WEEKLY_DISTRIBUTOR = "WEEKLY_DISTRIBUTOR",
  ADMIN_ALERT = "ADMIN_ALERT",
  SYSTEM = "SYSTEM",
}
