import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GroupFormDialog } from "@/components/groups/group-form-dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { groupsApi } from "@/services/iam-service";
import type { Group } from "@/types/auth";

export const Route = createFileRoute("/_app/groups")({
  head: () => ({ meta: [{ title: "Grupos — IAM Pro Forms" }] }),
  component: GroupsPage,
});

function GroupsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);

  const removeGroup = useMutation({
    mutationFn: (id: string) => groupsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(t("groups.deleted"));
      setDeleting(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("groups.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("groups.subtitle")}</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> {t("groups.new")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {q.isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))
          : q.data?.map((g) => (
              <Card key={g.id} className="transition hover:shadow-elegant">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        <UsersRound className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{g.name}</h3>
                        <p className="text-xs text-muted-foreground">{g.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge
                        className={
                          g.status === "active"
                            ? "bg-success/15 text-success hover:bg-success/15"
                            : ""
                        }
                        variant={g.status === "active" ? "default" : "secondary"}
                      >
                        {t(`users.status.${g.status}`)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.actions")}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(g);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> {t("common.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleting(g)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("groups.members")}</p>
                      <p className="text-base font-semibold">{g.memberIds.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {t("groups.permissions")}
                      </p>
                      <p className="flex items-center gap-1 text-base font-semibold">
                        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                        {g.permissions.length}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {g.permissions.slice(0, 4).map((p) => (
                      <span
                        key={p}
                        className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                      >
                        {t(`permissionLabels.${p}`)}
                      </span>
                    ))}
                    {g.permissions.length > 4 && (
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        +{g.permissions.length - 4}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <GroupFormDialog open={formOpen} onOpenChange={setFormOpen} group={editing} />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={t("groups.deleteTitle")}
        description={t("groups.deleteDesc", { name: deleting?.name ?? "" })}
        confirmLabel={t("common.delete")}
        destructive
        onConfirm={() => deleting && removeGroup.mutate(deleting.id)}
      />
    </div>
  );
}
