export const PROJECT_STATUS = [
  { value: "em_criacao", label: "Em criação", tone: "bg-muted text-foreground" },
  { value: "aguardando_aprovacao", label: "Aguardando aprovação", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  { value: "aprovado", label: "Aprovado", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  { value: "em_producao", label: "Em produção", tone: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  { value: "produzido", label: "Produzido", tone: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300" },
  { value: "enviado", label: "Enviado", tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  { value: "finalizado", label: "Finalizado", tone: "bg-primary/15 text-primary" },
  { value: "cancelado", label: "Cancelado", tone: "bg-destructive/15 text-destructive" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[number]["value"];

export const statusMeta = (s: string) =>
  PROJECT_STATUS.find((p) => p.value === s) ?? PROJECT_STATUS[0];

export const FILE_KINDS = [
  { value: "arte", label: "Arte" },
  { value: "referencia", label: "Referência" },
  { value: "documento", label: "Documento" },
  { value: "ordem_servico", label: "Ordem de Serviço" },
] as const;
export type FileKind = (typeof FILE_KINDS)[number]["value"];
