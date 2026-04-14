'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-[var(--color-primary)]
    text-[var(--color-on-primary)]
    hover:bg-[var(--color-primary-hover)]
    active:bg-[var(--color-primary-focus)]
    disabled:bg-[var(--color-primary-disabled)]
    disabled:text-[var(--color-text-disabled)]
  `,
  secondary: `
    bg-[var(--color-secondary-container)]
    text-[var(--color-on-secondary-container)]
    hover:bg-[var(--color-secondary)]
    hover:text-[var(--color-on-secondary)]
    active:bg-[var(--color-secondary-focus)]
    disabled:bg-[var(--color-secondary-disabled)]
  `,
  ghost: `
    bg-transparent
    text-[var(--color-primary)]
    border border-[var(--color-outline-variant)]
    hover:bg-[var(--color-surface-container-low)]
    active:bg-[var(--color-surface-container)]
    disabled:text-[var(--color-text-disabled)]
    disabled:border-[var(--color-text-disabled)]
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-[var(--spacing-md)] py-[var(--spacing-sm)] text-[var(--font-size-sm)]',
  md: 'px-[var(--spacing-lg)] py-[var(--spacing-md)] text-[var(--font-size-base)]',
  lg: 'px-[var(--spacing-xl)] py-[var(--spacing-lg)] text-[var(--font-size-lg)]',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex
      items-center
      justify-center
      font-medium
      rounded-[var(--radius-md)]
      transition-all
      duration-[var(--transition-fast)]
      cursor-pointer
      focus-visible:outline-2
      focus-visible:outline-[var(--color-primary)]
      focus-visible:outline-offset-2
    `;

    const widthStyles = fullWidth ? 'w-full' : '';

    const combinedClassName = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${widthStyles}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${className}
    `.trim();

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={combinedClassName}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
