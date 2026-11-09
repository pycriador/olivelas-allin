import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ScrollText,
  Database,
  Braces,
  GitBranch,
  Workflow,
  ShieldCheck,
  SquarePlay,
  FileText,
  Gauge,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OverviewModule } from "@/features/project/ui/modules/overview";
import { SpecificationModule } from "@/features/project/ui/modules/specification";
import { SourcesModule } from "@/features/project/ui/modules/sources";
import { VariablesModule } from "@/features/project/ui/modules/variables";
import { RulesModule } from "@/features/project/ui/modules/rules";
import { FlowModule } from "@/features/project/ui/modules/flow";
import { BuilderModule } from "@/features/project/ui/modules/builder";
import { ValidationModule } from "@/features/project/ui/modules/validation";
import { ExecutionsModule } from "@/features/project/ui/modules/executions";
import { DocumentsModule } from "@/features/project/ui/modules/documents";

type ModuleKey =
  | "overview"
  | "specification"
  | "sources"
  | "variables"
  | "rules"
  | "flow"
  | "builder"
  | "validation"
  | "executions"
  | "documents";

interface ModuleTab {
  key: ModuleKey;
  label: string;
  icon: LucideIcon;
}

const MODULES: ModuleTab[] = [
  { key: "overview", label: "Visão geral", icon: LayoutDashboard },
  { key: "specification", label: "Especificação", icon: ScrollText },
  { key: "sources", label: "Fontes de Dados", icon: Database },
  { key: "variables", label: "Variáveis", icon: Braces },
  { key: "rules", label: "Regras", icon: GitBranch },
  { key: "flow", label: "Fluxo", icon: Workflow },
  { key: "builder", label: "Builder Visual", icon: Gauge },
  { key: "validation", label: "Validações", icon: ShieldCheck },
  { key: "executions", label: "Execuções", icon: SquarePlay },
  { key: "documents", label: "Documentos", icon: FileText },
];

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  archived: "Arquivado",
};

export function ProjectShell({ project }: { project: Project }) {
  const [active, setActive] = useState<ModuleKey>("overview");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/projects" title="Voltar para projetos">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
              <Badge variant="secondary">{STATUS_LABEL[project.status] ?? project.status}</Badge>
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground">{project.description}</p>
            )}
          </div>
        </div>
      </div>

      <Card className="p-1">
        <nav className="flex flex-wrap gap-1">
          {MODULES.map((module) => (
            <button
              key={module.key}
              type="button"
              onClick={() => setActive(module.key)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                active === module.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <module.icon className="h-4 w-4" />
              {module.label}
            </button>
          ))}
        </nav>
      </Card>

      {active === "overview" && <OverviewModule project={project} />}
      {active === "specification" && <SpecificationModule project={project} />}
      {active === "sources" && <SourcesModule project={project} />}
      {active === "variables" && <VariablesModule project={project} />}
      {active === "rules" && <RulesModule project={project} />}
      {active === "flow" && <FlowModule project={project} />}
      {active === "builder" && <BuilderModule project={project} />}
      {active === "validation" && <ValidationModule project={project} />}
      {active === "executions" && <ExecutionsModule project={project} />}
      {active === "documents" && <DocumentsModule project={project} />}
    </div>
  );
}
