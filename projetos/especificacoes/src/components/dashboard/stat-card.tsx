import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: string;
}

export function StatCard({ label, value, icon: Icon, hint, accent }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-shadow hover:shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary",
            accent,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}
