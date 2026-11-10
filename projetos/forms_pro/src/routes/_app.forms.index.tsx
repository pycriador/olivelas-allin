import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormCreateDialog } from "@/components/forms/form-create-dialog";
import { formsApi, type CreateFormInput } from "@/services/forms-service";
import type { FormDefinition } from "@/types/forms";

export const Route = createFileRoute("/_app/forms/")({
  head: () => ({
    meta: [
      { title: "Formulários — IAM Pro Forms" },
      {
        name: "description",
        content: "Gerencie, publique e compartilhe formulários criados no builder visual.",
      },
    ],
  }),
  component: FormsPage,
});

const statusVariant: Record<FormDefinition["status"], "default" | "secondary" | "outline"> = {
  published: "default",
  draft: "secondary",
  archived: "outline",
};

function FormsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<FormDefinition | null>(null);

  const formsQ = useQuery({ queryKey: ["forms"], queryFn: formsApi.list });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["forms"] });

  const create = useMutation({
    mutationFn: (input: CreateFormInput) => formsApi.create(input),
    onSuccess: (form) => {
      invalidate();
      setCreateOpen(false);
      toast.success(t("forms.toast.created"));
      navigate({ to: "/forms/$id/edit", params: { id: form.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: (id: string) => formsApi.duplicate(id),
    onSuccess: () => {
      invalidate();
      toast.success(t("forms.toast.duplicated"));
    },
  });

  const setStatusM = useMutation({
    mutationFn: ({ id, next }: { id: string; next: FormDefinition["status"] }) =>
      formsApi.setStatus(id, next),
    onSuccess: () => {
      invalidate();
      toast.success(t("forms.toast.statusChanged"));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => formsApi.remove(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success(t("forms.toast.deleted"));
    },
  });

  const forms = formsQ.data ?? [];
  const filtered = useMemo(
    () =>
      forms.filter(
        (f) =>
          (status === "all" || f.status === status) &&
          (category === "all" || f.category === category) &&
          (f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.description.toLowerCase().includes(query.toLowerCase())),
      ),
    [forms, status, category, query],
  );

  const counts = {
    total: forms.length,
    published: forms.filter((f) => f.status === "published").length,
    draft: forms.filter((f) => f.status === "draft").length,
    archived: forms.filter((f) => f.status === "archived").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight">
            {t("forms.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("forms.subtitle")}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="mr-1.5 h-4 w-4" />
          {t("forms.newForm")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {(["total", "published", "draft", "archived"] as const).map((key) => (
          <Card key={key}>
            <CardContent className="py-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t(`forms.stats.${key}`)}
              </p>
              <p className="text-2xl font-semibold">{counts[key]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder={t("forms.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("forms.filters.allStatus")}</SelectItem>
            <SelectItem value="draft">{t("forms.status.draft")}</SelectItem>
            <SelectItem value="published">{t("forms.status.published")}</SelectItem>
            <SelectItem value="archived">{t("forms.status.archived")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("forms.filters.allCategories")}</SelectItem>
            {[...new Set(forms.map((f) => f.category))].map((c) => (
              <SelectItem key={c} value={c}>
                {t(`forms.categories.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formsQ.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("forms.empty")}</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              {t("forms.newForm")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((form) => (
            <Card key={form.id} className="group transition hover:border-primary/40">
              <CardContent className="space-y-3 py-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to="/forms/$id/edit"
                      params={{ id: form.id }}
                      className="truncate text-base font-semibold hover:underline"
                    >
                      {form.name}
                    </Link>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {form.description || "—"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          navigate({ to: "/forms/$id/edit", params: { id: form.id } })
                        }
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        {t("common.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          navigate({ to: "/forms/$id/preview", params: { id: form.id } })
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        {t("forms.actions.preview")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate.mutate(form.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("forms.actions.duplicate")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {form.status !== "published" ? (
                        <DropdownMenuItem
                          onClick={() =>
                            setStatusM.mutate({ id: form.id, next: "published" })
                          }
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {t("forms.actions.publish")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setStatusM.mutate({ id: form.id, next: "draft" })}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          {t("forms.actions.unpublish")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => setStatusM.mutate({ id: form.id, next: "archived" })}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        {t("forms.actions.archive")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleting(form)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("common.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant[form.status]}>
                    {t(`forms.status.${form.status}`)}
                  </Badge>
                  <Badge variant="outline">{t(`forms.categories.${form.category}`)}</Badge>
                  <Badge variant="outline">v{form.version}</Badge>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {form.pages.length} {t("forms.pagesCount")} ·{" "}
                    {form.pages.reduce((a, p) => a + p.fields.length, 0)}{" "}
                    {t("forms.fieldsCount")}
                  </span>
                  {form.status === "published" && (
                    <a
                      href={`/f/${form.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      <ExternalLink className="h-3 w-3" />
                      /f/{form.slug}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <FormCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={create.isPending}
        onSubmit={(input) => create.mutate(input)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("forms.deleteTitle")}
        description={t("forms.deleteDescription", { name: deleting?.name ?? "" })}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
      />
    </div>
  );
}
