import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { groupsApi } from "@/services/iam-service";
import { ALL_PERMISSIONS, type Group, type Permission } from "@/types/auth";

export const Route = createFileRoute("/_app/permissions")({
  head: () => ({ meta: [{ title: "Permissões — IAM Pro Forms" }] }),
  component: PermissionsPage,
});

function PermissionsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["groups"], queryFn: groupsApi.list });

  const toggle = useMutation({
    mutationFn: ({ group, perm }: { group: Group; perm: Permission }) => {
      const next = group.permissions.includes(perm)
        ? group.permissions.filter((p) => p !== perm)
        : [...group.permissions, perm];
      return groupsApi.update(group.id, { permissions: next });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      toast.success(t("permissions.updated"));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("permissions.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("permissions.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {ALL_PERMISSIONS.map((p) => (
          <Card key={p}>
            <CardContent className="flex items-start gap-3 p-5">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg"
                style={{ background: "var(--gradient-primary)" }}
              >
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{t(`permissionLabels.${p}`)}</h3>
                <p className="text-xs text-muted-foreground">
                  {t(`permissionDescriptions.${p}`)}
                </p>
              </div>
              <code className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {p}
              </code>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {t("permissions.byGroup")}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{t("permissions.matrixHint")}</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {q.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">{t("permissions.group")}</th>
                  {ALL_PERMISSIONS.map((p) => (
                    <th key={p} className="px-2 py-2 text-center font-medium">
                      <span
                        className="mx-auto block max-w-[90px] truncate"
                        title={t(`permissionLabels.${p}`)}
                      >
                        {t(`permissionLabels.${p}`)}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.data?.map((g) => (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{g.name}</td>
                    {ALL_PERMISSIONS.map((p) => (
                      <td key={p} className="px-2 py-3 text-center">
                        <Checkbox
                          checked={g.permissions.includes(p)}
                          disabled={toggle.isPending}
                          aria-label={`${g.name} — ${t(`permissionLabels.${p}`)}`}
                          onCheckedChange={() => toggle.mutate({ group: g, perm: p })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
