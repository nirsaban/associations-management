'use client';

import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, string> = {
  success: `
    bg-[var(--color-success-container)]
    text-[var(--color-on-success-container)]
    border border-[var(--color-success)]
  `,
  warning: `
    bg-[var(--color-warning-container)]
    text-[var(--color-on-warning-container)]
    border border-[var(--color-warning)]
  `,
  error: `
    bg-[var(--color-error-container)]
    text-[var(--color-on-error-container)]
    border border-[var(--color-error)]
  `,
  info: `
    bg-[var(--color-info-container)]
    text-[var(--color-on-info-container)]
    border border-[var(--color-info)]
  `,
};

const sizeStyles = {
  sm: 'px-[var(--spacing-sm)] py-[var(--spacing-xs)] text-[var(--font-size-xs)]',
  md: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--font-size-sm)]',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      children,
      variant = 'info',
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex
      items-center
      justify-center
      rounded-[var(--radius-full)]
      font-medium
      whitespace-nowrap
      transition-colors
      duration-[var(--transition-fast)]
    `;

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${className}
    `.trim();

    return (
      <span ref={ref} className={combinedClassName} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
