import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Monitor, Smartphone, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { FormRunner } from "@/components/forms/form-runner";
import { previewApi } from "@/services/forms-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/forms/$id/preview")({
  head: () => ({
    meta: [
      { title: "Preview do formulário — IAM Pro Forms" },
      {
        name: "description",
        content: "Visualize o formulário em desktop, tablet e mobile antes de publicar.",
      },
    ],
  }),
  component: PreviewPage,
});

const WIDTHS = { desktop: "max-w-3xl", tablet: "max-w-xl", mobile: "max-w-sm" } as const;

function PreviewPage() {
  const { id } = Route.useParams();
  const { t } = useTranslation();
  const [device, setDevice] = useState<keyof typeof WIDTHS>("desktop");

  const formQ = useQuery({ queryKey: ["form-preview", id], queryFn: () => previewApi.get(id) });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/forms/$id/edit" params={{ id }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold">{t("forms.preview.title")}</h1>
          <p className="text-xs text-muted-foreground">{t("forms.preview.subtitle")}</p>
        </div>
        <ToggleGroup
          type="single"
          value={device}
          onValueChange={(v) => v && setDevice(v as keyof typeof WIDTHS)}
          className="ml-auto"
        >
          <ToggleGroupItem value="desktop" aria-label="Desktop">
            <Monitor className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="tablet" aria-label="Tablet">
            <Tablet className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="mobile" aria-label="Mobile">
            <Smartphone className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 md:p-8">
        {formQ.isLoading || !formQ.data ? (
          <Skeleton className="mx-auto h-96 max-w-2xl rounded-xl" />
        ) : (
          <div className={cn("mx-auto transition-all", WIDTHS[device])}>
            <FormRunner form={formQ.data} demo />
          </div>
        )}
      </div>
    </div>
  );
}
