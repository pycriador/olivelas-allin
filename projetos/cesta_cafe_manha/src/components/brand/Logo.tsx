import { cn } from "@/lib/utils";

export function Logo({ className, subtitle = true }: { className?: string; subtitle?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid size-9 place-items-center rounded-xl bg-foreground/10 outline outline-1 -outline-offset-1 outline-foreground/15">
        <span className="text-sm font-extrabold tracking-tight">O</span>
      </div>
      <span className="text-[15px] font-semibold tracking-tight">Olivelas</span>
      {subtitle && <span className="hidden text-[13px] text-muted-foreground sm:inline">Cestas de Café</span>}
    </div>
  );
}
