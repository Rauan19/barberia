import * as React from 'react';

import { cn } from '@/lib/utils';

type Variant = 'default' | 'muted' | 'success' | 'danger' | 'outline';

const variants: Record<Variant, string> = {
  default: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  danger: 'bg-destructive/10 text-destructive',
  outline: 'border border-border text-muted-foreground',
};

export function Badge({
  className,
  variant = 'muted',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
