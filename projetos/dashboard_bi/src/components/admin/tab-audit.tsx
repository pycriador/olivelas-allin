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
import { Badge } from "@/components/ui/badge";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { useTranslation } from "react-i18next";

export function AdminAuditTab() {
  const { t } = useTranslation();
  const { org } = useCurrentOrg();
  const orgId = org?.id;

  const logs = useQuery({
    queryKey: ["admin-audit", orgId],
    enabled: !!orgId,
    queryFn: async () =>
      (
        await supabase
          .from("audit_logs")
          .select("*")
          .eq("organization_id", orgId!)
          .order("created_at", { ascending: false })
          .limit(200)
      ).data ?? [],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.audit.title")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.audit.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.audit.date")}</TableHead>
              <TableHead>{t("admin.audit.action")}</TableHead>
              <TableHead>{t("admin.audit.resource")}</TableHead>
              <TableHead>{t("admin.audit.user")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.data?.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(l.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{l.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">{l.resource ?? "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {l.user_id?.slice(0, 8) ?? "—"}
                </TableCell>
              </TableRow>
            ))}
            {!logs.data?.length && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  —
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
