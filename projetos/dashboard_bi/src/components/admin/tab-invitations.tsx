import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2 } from "lucide-react";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function AdminInvitationsTab() {
  const { t } = useTranslation();
  const { org } = useCurrentOrg();
  const orgId = org?.id;
  const qc = useQueryClient();

  const invitations = useQuery({
    queryKey: ["admin-invitations", orgId],
    enabled: !!orgId,
    queryFn: async () =>
      (
        await supabase
          .from("invitations")
          .select("*")
          .eq("organization_id", orgId!)
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invitations")
        .update({ status: "revoked" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("admin.invitations.revoked"));
      qc.invalidateQueries({ queryKey: ["admin-invitations"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyLink = (token: string) => {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(t("admin.invitations.copied"));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.invitations.title")}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.invitations.subtitle")}</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("auth.email")}</TableHead>
              <TableHead>{t("admin.users.role")}</TableHead>
              <TableHead>{t("admin.invitations.status")}</TableHead>
              <TableHead>{t("admin.invitations.expires")}</TableHead>
              <TableHead className="text-right">{t("admin.invitations.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.data?.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium">{i.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {i.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={i.status === "pending" ? "default" : "outline"}
                    className="capitalize"
                  >
                    {i.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {new Date(i.expires_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => copyLink(i.token)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  {i.status === "pending" && (
                    <Button variant="ghost" size="icon" onClick={() => revoke.mutate(i.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!invitations.data?.length && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
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
