'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error = false,
      errorMessage,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const containerStyles = fullWidth ? 'w-full' : '';

    const inputStyles = `
      w-full
      px-[var(--spacing-md)]
      py-[var(--spacing-md)]
      font-[var(--font-family-sans)]
      font-size-[var(--font-size-base)]
      border-b
      border-[var(--color-outline-variant)]
      bg-transparent
      text-[var(--color-text-primary)]
      transition-colors
      duration-[var(--transition-fast)]
      placeholder:text-[var(--color-text-tertiary)]
      focus:border-[var(--color-primary)]
      focus:outline-none
      ${error ? 'border-[var(--color-error)] text-[var(--color-error)]' : ''}
      disabled:border-[var(--color-text-disabled)]
      disabled:text-[var(--color-text-disabled)]
      ${className}
    `.trim();

    const labelStyles = `
      block
      mb-[var(--spacing-sm)]
      font-medium
      text-[var(--font-size-sm)]
      text-[var(--color-text-primary)]
    `;

    const helperTextStyles = `
      mt-[var(--spacing-xs)]
      text-[var(--font-size-sm)]
      ${error ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]'}
    `;

    return (
      <div className={containerStyles}>
        {label && (
          <label className={labelStyles}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={inputStyles}
          aria-invalid={error}
          aria-describedby={errorMessage || helperText ? `${props.id}-helper` : undefined}
          {...props}
        />
        {(helperText || errorMessage) && (
          <div id={`${props.id}-helper`} className={helperTextStyles}>
            {errorMessage || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
