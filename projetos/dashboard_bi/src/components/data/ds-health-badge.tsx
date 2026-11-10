import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { DsHealth } from "@/lib/datasources/types";

const TONE: Record<DsHealth, string> = {
  online: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  offline: "bg-destructive/15 text-destructive border-destructive/30",
  unstable: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  timeout: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  invalid_credentials: "bg-destructive/15 text-destructive border-destructive/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

export function DsHealthBadge({ health }: { health: DsHealth }) {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className={TONE[health]}>
      {t(`ds.health.${health}`)}
    </Badge>
  );
}
