import { useQuery } from "@tanstack/react-query";
import { Database, Braces, GitBranch, SquarePlay, FileText, ShieldCheck } from "lucide-react";
import type { Project } from "@/types";
import {
  dataSourceService,
  variableService,
  ruleService,
  validationService,
} from "@/services/document-engine";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Database;
  label: string;
  value: string | number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-7 w-16" />
        ) : (
          <div className="text-2xl font-semibold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewModule({ project }: { project: Project }) {
  const sources = useQuery({
    queryKey: ["project-sources", project.id],
    queryFn: () => dataSourceService.listLinked(project.id),
  });
  const variables = useQuery({
    queryKey: ["project-variables", project.id],
    queryFn: () => variableService.listByProject(project.id),
  });
  const rules = useQuery({
    queryKey: ["project-rules", project.id],
    queryFn: () => ruleService.listByProject(project.id),
  });
  const validations = useQuery({
    queryKey: ["project-validations", project.id],
    queryFn: () => validationService.listByProject(project.id),
  });

  const errorCount = validations.data?.filter((v) => v.level === "error").length ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Database}
          label="Fontes de Dados"
          value={sources.data?.length ?? 0}
          loading={sources.isLoading}
        />
        <StatCard
          icon={Braces}
          label="Variáveis"
          value={variables.data?.length ?? 0}
          loading={variables.isLoading}
        />
        <StatCard
          icon={GitBranch}
          label="Regras"
          value={rules.data?.length ?? 0}
          loading={rules.isLoading}
        />
        <StatCard
          icon={ShieldCheck}
          label="Validações"
          value={validations.data?.length ?? 0}
          loading={validations.isLoading}
        />
        <StatCard
          icon={SquarePlay}
          label="Erros"
          value={errorCount}
          loading={validations.isLoading}
        />
        <StatCard icon={FileText} label="Status" value="Rascunho" loading={false} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Sobre este projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Use as abas acima para configurar as Fontes de Dados ({sources.data?.length ?? 0}),
            mapear as Variáveis ({variables.data?.length ?? 0}), definir as Regras (
            {rules.data?.length ?? 0}) e montar o documento no Builder Visual.
          </p>
          <p>
            Depois, execute o fluxo para gerar documentos (PDF, Markdown ou TXT) a partir dos dados
            reais.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
