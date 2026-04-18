'use client';

import React from 'react';
import { Card, CardContent } from './Card';
import { Badge } from './Badge';

export type StatusType = 'payment' | 'order' | 'task';

interface StatusCardProps {
  type: StatusType;
  title: string;
  status: 'pending' | 'completed' | 'overdue' | 'failed';
  amount?: number;
  dueDate?: Date;
  metadata?: Record<string, React.ReactNode>;
  action?: React.ReactNode;
}

const statusConfig = {
  payment: {
    pending: { badge: 'warning' as const, label: 'ממתין לתשלום' },
    completed: { badge: 'success' as const, label: 'שולם' },
    overdue: { badge: 'error' as const, label: 'באיחור' },
    failed: { badge: 'error' as const, label: 'נכשל' },
  },
  order: {
    pending: { badge: 'info' as const, label: 'בהמתנה' },
    completed: { badge: 'success' as const, label: 'הושלם' },
    overdue: { badge: 'warning' as const, label: 'תפוג תוך קרוב' },
    failed: { badge: 'error' as const, label: 'נכשל' },
  },
  task: {
    pending: { badge: 'info' as const, label: 'בהמתנה' },
    completed: { badge: 'success' as const, label: 'הושלם' },
    overdue: { badge: 'error' as const, label: 'פג' },
    failed: { badge: 'error' as const, label: 'נכשל' },
  },
};

export const StatusCard: React.FC<StatusCardProps> = ({
  type,
  title,
  status,
  amount,
  dueDate,
  metadata,
  action,
}) => {
  const config = statusConfig[type][status];

  const formattedDueDate = dueDate
    ? new Intl.DateTimeFormat('he-IL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(dueDate)
    : null;

  return (
    <Card>
      <CardContent padding="md">
        <div className="flex items-start justify-between gap-[var(--spacing-md)] mb-[var(--spacing-md)]">
          <div>
            <h4 className="text-[var(--font-size-base)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-xs)]">
              {title}
            </h4>
            <Badge variant={config.badge} size="sm">
              {config.label}
            </Badge>
          </div>
          {amount && (
            <div className="text-[var(--font-size-lg)] font-semibold text-[var(--color-primary)]">
              ₪{amount.toFixed(2)}
            </div>
          )}
        </div>

        {formattedDueDate && (
          <p className="text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] mb-[var(--spacing-md)]">
            תאריך הדחקה: {formattedDueDate}
          </p>
        )}

        {metadata && Object.entries(metadata).length > 0 && (
          <div className="mb-[var(--spacing-md)] space-y-[var(--spacing-sm)]">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between text-[var(--font-size-sm)]">
                <span className="text-[var(--color-text-secondary)]">{key}:</span>
                <span className="text-[var(--color-text-primary)] font-medium">
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}

        {action && (
          <div className="mt-[var(--spacing-md)] flex gap-[var(--spacing-sm)]">
            {action}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

StatusCard.displayName = 'StatusCard';
