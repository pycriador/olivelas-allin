import { FileStack, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textClassName?: string;
}

export function Logo({ className, iconClassName, showText = true, textClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          iconClassName,
        )}
      >
        <FileStack className="size-4.5" aria-hidden />
      </div>
      {showText && (
        <span className={cn("text-lg font-semibold tracking-tight", textClassName)}>
          Clause<span className="text-primary">Forge</span>
        </span>
      )}
    </div>
  );
}

export function BrandMark({ className, icon }: { className?: string; icon?: LucideIcon }) {
  const Icon = icon ?? FileStack;
  return (
    <div
      className={cn(
        "flex size-9 items-center justify-center rounded-xl border bg-primary text-primary-foreground",
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </div>
  );
}
