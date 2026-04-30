import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'gold' | 'silver' | 'green' | 'red' | 'yellow';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  gold: 'bg-brand-gold/10 text-brand-gold border border-brand-gold/30',
  silver: 'bg-brand-muted text-brand-silver border border-brand-border',
  green: 'bg-green-900/30 text-green-400 border border-green-800/50',
  red: 'bg-red-900/30 text-red-400 border border-red-800/50',
  yellow: 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50',
};

export function Badge({ variant = 'silver', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-body uppercase tracking-wider',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
