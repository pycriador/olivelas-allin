import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  size = "md",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: { box: "h-7 w-7", icon: "h-3.5 w-3.5", text: "text-sm" },
    md: { box: "h-9 w-9", icon: "h-4 w-4", text: "text-base" },
    lg: { box: "h-11 w-11", icon: "h-5 w-5", text: "text-lg" },
  }[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg shadow-elegant",
          sizes.box,
        )}
        style={{ background: "var(--gradient-primary)" }}
      >
        <Shield className={cn("text-primary-foreground", sizes.icon)} />
      </div>
      {showText && (
        <div className="flex flex-col leading-tight">
          <span className={cn("font-semibold tracking-tight", sizes.text)}>
            Olivelas
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Forms Pro Enterprise
          </span>
        </div>
      )}
    </div>
  );
}
