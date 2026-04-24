// רשימת המודלים שמבוססי שוכר (tenant-scoped)
// כל שאילתה עליהם תסונן אוטומטית לפי organizationId
export const TENANT_SCOPED_MODELS = [
  'User',
  'Group',
  'GroupMembership',
  'Family',
  'WeeklyOrder',
  'WeeklyDistributorAssignment',
  'Payment',
  'MonthlyPaymentStatus',
  'PaymentReminder',
  'Notification',
  'PushSubscription',
  'Alert',
  'WeeklyFamilyDelivery',
  'Asset',
  'Review',
  'LandingLead',
] as const;

// מודלים שלא מסוננים לפי שוכר
// Organization — הוא השוכר עצמו
// OtpCode — מבוסס טלפון בלבד
// WebhookEvent — nullable organizationId
export const NON_TENANT_MODELS = [
  'Organization',
  'OtpCode',
  'WebhookEvent',
] as const;
