import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export function Card({ hover = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'card-premium p-6',
        hover && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
