import { Construction, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/features/dashboard/ui/page-header";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  plannedFeatures: string[];
  comingSoon?: string;
}

export function ModulePlaceholder({
  title,
  description,
  icon: Icon = Construction,
  plannedFeatures,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="secondary">Em construção</Badge>}
      />

      <Card className="border-dashed shadow-none">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" aria-hidden />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-semibold tracking-tight">Módulo em construção</h2>
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Este módulo fará parte das próximas sprints. A arquitetura de dados e navegação já
              está preparada para recebê-lo sem refatoração estrutural.
            </p>
          </div>
          <div className="mt-4 grid w-full max-w-lg gap-2 sm:grid-cols-2">
            {plannedFeatures.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {feature}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
