# Build React Component

Create a new React component following the Amutot design system and architecture standards.

## Input Parameters
- `componentName` - PascalCase name for the component (e.g., "DonorCard")
- `path` - Location in app/ (e.g., "(dashboard)/donors/_components")
- `description` - What the component does (Hebrew text)
- `hasForm` - Whether this is a form component (true/false)
- `states` - Comma-separated list of states to handle: loading, empty, error

## Steps

### 1. Verify design tokens
```bash
cat packages/ui/styles/tokens.css
```
Identify the correct token names for:
- Colors (--color-primary, --color-surface, --color-border, --color-text-primary)
- Spacing (--gap-sm, --gap-md, --gap-lg)
- Radius (--radius-sm, --radius-md, --radius-lg)
- Typography (--font-sans, --font-size-sm, --font-size-base)

### 2. Create component file
Path: `apps/web/app/{path}/{componentName}.tsx`

Template:
```typescript
'use client';

import React, { ReactNode } from 'react';
import cn from 'clsx';

interface {ComponentName}Props {
  // Define props with Hebrew comments
  // Example:
  // /** תיאור הנכס */
  // title: string;
  className?: string;
}

export function {ComponentName}({
  // Destructure props
  className,
}: {ComponentName}Props) {
  // Loading state
  // Empty state
  // Error state
  // Success state

  return (
    <div
      className={cn(
        'p-[var(--gap-md)]',
        'rounded-[var(--radius-md)]',
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'text-[var(--color-text-primary)]',
        'font-[var(--font-sans)]',
        '[direction:rtl]', // Explicit RTL
        className
      )}
    >
      {/* Use ms-/me- for directional margins, never ml-/mr- */}
      {/* Example: me-[var(--gap-sm)] = margin-end (right in RTL) */}
      <p className="text-[var(--color-text-secondary)]">
        {description}
      </p>
    </div>
  );
}
```

### 3. Create types file
Path: `apps/web/app/{path}/_types/{componentName}.ts`

Example:
```typescript
export interface {ComponentName}Item {
  id: string;
  title: string;
  // All types match backend models from packages/types
}
```

### 4. Create test file
Path: `apps/web/app/{path}/__tests__/{componentName}.spec.tsx`

Template:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { {ComponentName} } from '../{ComponentName}';

describe('{ComponentName}', () => {
  it('renders with title', () => {
    render(
      <{ComponentName}
        title="תיאור"
      />
    );
    expect(screen.getByText('תיאור')).toBeInTheDocument();
  });

  it('handles loading state', () => {
    render(
      <{ComponentName}
        isLoading={true}
      />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays empty state', () => {
    render(
      <{ComponentName}
        items={[]}
      />
    );
    expect(screen.getByText(/אין נתונים/i)).toBeInTheDocument();
  });

  it('handles RTL layout', () => {
    const { container } = render(
      <{ComponentName}
        title="תיאור"
      />
    );
    const element = container.querySelector('[direction="rtl"]');
    expect(element).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <{ComponentName}
        title="תיאור"
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
```

### 5. Create Storybook story
Path: `packages/ui/stories/{ComponentName}.stories.tsx`

Template:
```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { {ComponentName} } from './../../apps/web/app/{path}/{ComponentName}';

const meta = {
  title: 'Components/{CategoryName}/{ComponentName}',
  component: {ComponentName},
  parameters: {
    layout: 'centered',
    direction: 'rtl',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof {ComponentName}>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'דוגמה',
  },
};

export const Loading: Story = {
  args: {
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const WithError: Story = {
  args: {
    error: 'שגיאה בטעינת הנתונים',
  },
};
```

### 6. Validation checklist

Run:
```bash
pnpm typecheck
pnpm lint
pnpm test --run
```

Verify:
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] All tests pass
- [ ] Component renders in both LTR and RTL
- [ ] All text is in Hebrew (no English UI strings)
- [ ] Only uses design tokens (no hardcoded colors)
- [ ] Uses `ms-` / `me-` for directional spacing, not `ml-` / `mr-`
- [ ] Handles loading, empty, error states (if applicable)
- [ ] No `console.log` in production code
- [ ] `"use client"` only added if component needs client-side interactivity
- [ ] Test coverage >= 70% for the component

### 7. Update exports (if in UI package)
If component is in `packages/ui/`:
```typescript
// packages/ui/index.ts
export { {ComponentName} } from './components/{ComponentName}';
export type { {ComponentName}Props } from './components/{ComponentName}';
```

## Success Criteria
- Component compiles without errors
- All tests pass with >= 70% coverage
- Component displays correctly in Storybook (both RTL and LTR)
- Follows all design tokens from tokens.css
- All user-facing text is in Hebrew
- RTL directional spacing uses ms-/me- pattern
- Component handles all specified states gracefully
