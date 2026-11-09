import React from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'subtle' | 'elevated' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  padded?: boolean;
  hoverable?: boolean;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  padded,
  hoverable = false,
  className = '',
  ...props
}) => {
  const effectivePadding = padded === false ? 'none' : padding;
  const variantStyles = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs',
    subtle:
      'bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80',
    elevated:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md',
    bordered:
      'bg-transparent border border-slate-200 dark:border-slate-700/80',
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-150 ${variantStyles[variant]} ${paddingStyles[effectivePadding]} ${
        hoverable ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  iconBgColor?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  iconBgColor = 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  onClick,
  className = '',
}) => {
  return (
    <Card
      onClick={onClick}
      className={`relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 active:scale-[0.99]' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </p>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-1.5 truncate">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{subtitle}</p>
          )}
          {change && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
              <span
                className={
                  change.trend === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : change.trend === 'down'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-500'
                }
              >
                {change.value}
              </span>
              {change.label && <span className="text-slate-400">{change.label}</span>}
            </div>
          )}
        </div>

        {icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  iconBg = 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
  badge,
  onClick,
  className = '',
}) => {
  return (
    <Card
      onClick={onClick}
      className={`group cursor-pointer hover:border-blue-500/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10 transition-all select-none ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                {title}
              </h3>
              {badge}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {description}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
      </div>
    </Card>
  );
};

export interface InteractiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  selected = false,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        p-4 sm:p-5 rounded-2xl border transition-all duration-150 cursor-pointer select-none
        ${
          selected
            ? 'bg-blue-50/70 border-blue-500 dark:bg-blue-950/40 dark:border-blue-500 shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};
