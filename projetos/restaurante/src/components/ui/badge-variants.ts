import { cva } from 'class-variance-authority';

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/10 text-primary border-primary/20',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive/10 text-destructive border-destructive/20',
        outline: 'text-foreground border-border',
        success:
          'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        warning:
          'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
