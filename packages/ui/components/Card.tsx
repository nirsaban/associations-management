'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevation?: 'low' | 'medium' | 'high';
  noBorder?: boolean;
}

const elevationStyles = {
  low: 'shadow-[var(--shadow-sm)]',
  medium: 'shadow-[var(--shadow-md)]',
  high: 'shadow-[var(--shadow-lg)]',
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      elevation = 'medium',
      noBorder = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      rounded-[var(--radius-md)]
      bg-[var(--color-surface-container-low)]
      transition-all
      duration-[var(--transition-fast)]
    `;

    const borderStyles = noBorder ? '' : 'border border-[var(--color-border-light)]';
    const shadowStyles = elevationStyles[elevation];

    const combinedClassName = `
      ${baseStyles}
      ${borderStyles}
      ${shadowStyles}
      ${className}
    `.trim();

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-[var(--spacing-md)]',
  md: 'p-[var(--spacing-lg)]',
  lg: 'p-[var(--spacing-xl)]',
};

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, padding = 'md', className = '', ...props }, ref) => {
    const combinedClassName = `${paddingStyles[padding]} ${className}`.trim();

    return (
      <div ref={ref} className={combinedClassName} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';
