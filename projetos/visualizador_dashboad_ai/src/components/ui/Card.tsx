import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  hoverable?: boolean;
  children?: React.ReactNode;
}

export function Card({ className, hoverable = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-theme bg-theme-surface p-6 shadow-xs text-theme-main transition-all',
        hoverable && 'hover:border-theme hover:shadow-md hover:scale-[1.005]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'h3'>) {
  return (
    <h3
      className={cn(
        'text-base font-bold tracking-tight text-theme-main',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'p'>) {
  return (
    <p
      className={cn('text-xs text-theme-muted leading-relaxed', className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <div className={cn('pt-0', className)} {...props}>
      {children}
    </div>
  );
}
