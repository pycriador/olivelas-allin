import { useState } from "react";
import { toast } from "sonner";
import { Shield, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useRoles, useGroups, useSaveRole } from "@/hooks/iam";
import { Resource, Action, type Role } from "@/types/iam";
import { ListSkeleton } from "@/components/common/skeletons";
import { cn } from "@/lib/utils";

const resources = Object.values(Resource);
const actions = Object.values(Action);

function hasPerm(role: Role, resource: string, action: string) {
  return role.permissions.some((p) => {
    const [pr, pa] = p.split(":");
    return (pr === "*" || pr === resource) && (pa === "*" || pa === action);
  });
}

export function RolesPanel() {
  const roles = useRoles();
  const groups = useGroups();
  const saveRole = useSaveRole();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (roles.isLoading) return <ListSkeleton rows={5} />;

  const list = roles.data ?? [];
  const selected = list.find((r) => r.id === (selectedId ?? list[0]?.id));

  const toggle = async (role: Role, resource: string, action: string) => {
    const key = `${resource}:${action}`;
    const explicit = role.permissions.includes(key);
    const next = explicit
      ? role.permissions.filter((p) => p !== key)
      : [...role.permissions.filter((p) => p !== "*:*" && p !== `${resource}:*`), key];
    try {
      await saveRole.mutateAsync({ ...role, permissions: next });
      toast.success("Permissions updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save role");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <Card>
        <CardHeader><CardTitle className="text-base">Roles</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedId(r.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                selected?.id === r.id && "bg-primary/10 text-primary",
              )}
            >
              <Shield className="h-4 w-4" />
              <span className="flex-1 truncate">{r.name}</span>
              {r.system && <Badge variant="outline" className="text-[9px]">SYS</Badge>}
            </button>
          ))}
          <div className="pt-4">
            <p className="mb-2 flex items-center gap-2 px-3 text-xs font-medium text-muted-foreground">
              <UsersIcon className="h-3.5 w-3.5" /> Groups
            </p>
            {(groups.data ?? []).map((g) => (
              <div key={g.id} className="px-3 py-1 text-xs text-muted-foreground">{g.name}</div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{selected?.name ?? "Select a role"}</CardTitle>
          {selected && <p className="text-sm text-muted-foreground">{selected.description}</p>}
        </CardHeader>
        <CardContent>
          {selected && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-4">Resource</th>
                    {actions.map((a) => (
                      <th key={a} className="px-2 py-2 text-center">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((r) => (
                    <tr key={r} className="border-t border-border/60">
                      <td className="py-2 pr-4 font-medium capitalize">{r}</td>
                      {actions.map((a) => (
                        <td key={a} className="px-2 py-2 text-center">
                          <Checkbox
                            checked={hasPerm(selected, r, a)}
                            onCheckedChange={() => toggle(selected, r, a)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selected.permissions.includes("*:*") && (
                <p className="mt-3 text-xs text-muted-foreground">
                  This role has a wildcard grant (<code>*:*</code>). Unchecking a box converts it to explicit grants.
                </p>
              )}
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveRole.mutate({ ...selected, permissions: ["*:*"] })}
                  disabled={selected.permissions.includes("*:*")}
                >
                  Grant full access
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
