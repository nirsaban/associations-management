'use client';

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-[var(--spacing-3xl)] px-[var(--spacing-lg)]">
      {icon && (
        <div className="mb-[var(--spacing-lg)] text-5xl text-[var(--color-outline-variant)]">
          {icon}
        </div>
      )}

      <h3 className="text-center text-[var(--font-size-xl)] font-semibold text-[var(--color-text-primary)] mb-[var(--spacing-sm)]">
        {title}
      </h3>

      {description && (
        <p className="text-center text-[var(--font-size-sm)] text-[var(--color-text-tertiary)] mb-[var(--spacing-lg)] max-w-sm">
          {description}
        </p>
      )}

      {action && (
        <div className="mt-[var(--spacing-lg)]">
          {action}
        </div>
      )}
    </div>
  );
};

EmptyState.displayName = 'EmptyState';
