import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Database } from "@/integrations/supabase/types";

type Role = Database["public"]["Enums"]["app_role"];
const ROLES: Role[] = ["administrator", "dba", "developer", "analyst", "user"];
type Perm = {
  key: string;
  resource: string;
  action: string;
  label: string;
  description: string | null;
};

export function AdminPermissionsTab() {
  const { t } = useTranslation();
  const catalog = useQuery({
    queryKey: ["permissions-catalog"],
    queryFn: async () =>
      ((await supabase.from("permissions_catalog").select("*").order("resource").order("action"))
        .data as Perm[] | null) ?? [],
  });
  const matrix = useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => (await supabase.from("role_permissions").select("*")).data ?? [],
  });

  const has = (role: Role, key: string) => {
    if (role === "administrator") return true;
    return !!matrix.data?.find((m) => m.role === role && m.permission_key === key);
  };

  const grouped = new Map<string, Perm[]>();
  catalog.data?.forEach((p) => {
    const arr = grouped.get(p.resource) ?? [];
    arr.push(p);
    grouped.set(p.resource, arr);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.permissions.title")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.permissions.subtitle")}</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[240px]">{t("admin.permissions.permission")}</TableHead>
              {ROLES.map((r) => (
                <TableHead key={r} className="text-center capitalize">
                  {r}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...grouped.entries()].map(([resource, perms]) => (
              <Fragment key={resource}>
                <TableRow className="bg-muted/40">
                  <TableCell
                    colSpan={ROLES.length + 1}
                    className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {resource}
                  </TableCell>
                </TableRow>
                {perms.map((p) => (
                  <TableRow key={p.key}>
                    <TableCell>
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground">{p.key}</div>
                    </TableCell>
                    {ROLES.map((r) => (
                      <TableCell key={r} className="text-center">
                        {has(r, p.key) ? (
                          <Check className="mx-auto h-4 w-4 text-primary" />
                        ) : (
                          <Minus className="mx-auto h-3 w-3 text-muted-foreground/50" />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
