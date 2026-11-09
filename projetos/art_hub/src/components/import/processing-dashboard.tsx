import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useImportStore } from "@/lib/upload/import-store";

export function ProcessingDashboard() {
  const { items } = useImportStore();

  const total = items.length;
  const uploading = items.filter((i) => i.status === "uploading").length;
  const queued = items.filter((i) => i.status === "queued").length;
  const uploaded = items.filter((i) => i.status === "uploaded").length;
  const analyzing = items.filter((i) => i.status === "analyzing").length;
  const done = items.filter((i) => i.status === "done").length;
  const errors = items.filter((i) => i.status === "error").length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const stats = [
    { label: "Total", value: total, tone: "text-foreground" },
    { label: "Na fila", value: queued, tone: "text-muted-foreground" },
    { label: "Enviando", value: uploading, tone: "text-info" },
    { label: "IA", value: analyzing, tone: "text-primary" },
    { label: "Concluídas", value: done, tone: "text-emerald-600" },
    { label: "Com erro", value: errors, tone: "text-destructive" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Progresso geral</p>
          <p className="text-xs text-muted-foreground">
            {done} de {total} arquivos processados
          </p>
        </div>
        <span className="font-display text-2xl tabular-nums tracking-tight">{pct}%</span>
      </div>
      <Progress value={pct} className="mb-6 h-2.5" />

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            className="rounded-xl border border-border/50 bg-surface/40 px-3 py-3 text-center"
          >
            <p className={`font-display text-xl tabular-nums ${s.tone}`}>{s.value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
