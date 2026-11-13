import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', ...props }) => {
  const variantClasses = {
    default: 'border-transparent bg-zinc-900 text-zinc-50 shadow',
    secondary: 'border-transparent bg-zinc-100 text-zinc-900',
    destructive: 'border-transparent bg-red-100 text-red-700',
    outline: 'text-zinc-950 border border-zinc-200',
    success: 'border-transparent bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'border-transparent bg-amber-50 text-amber-700 border border-amber-200',
  }[variant];

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2',
        variantClasses,
        className
      )}
      {...props}
    />
  );
};
