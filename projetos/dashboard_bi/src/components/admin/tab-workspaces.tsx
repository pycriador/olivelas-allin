import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Layers, Trash2 } from "lucide-react";
import { useCurrentOrg } from "@/hooks/use-current-org";
import { logAudit } from "@/lib/audit";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const formSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  color: z.string().min(4),
});
type FormValues = z.infer<typeof formSchema>;

export function AdminWorkspacesTab() {
  const { t } = useTranslation();
  const { org } = useCurrentOrg();
  const orgId = org?.id;
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", description: "", color: "#6366f1" },
  });

  const workspaces = useQuery({
    queryKey: ["admin-workspaces", orgId],
    enabled: !!orgId,
    queryFn: async () =>
      (await supabase.from("workspaces").select("*").eq("organization_id", orgId!).order("name"))
        .data ?? [],
  });

  const create = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!orgId) throw new Error("no org");
      const { error } = await supabase.from("workspaces").insert({
        organization_id: orgId,
        name: values.name,
        description: values.description || null,
        color: values.color,
      });
      if (error) throw error;
      await logAudit({
        organizationId: orgId,
        action: "workspace.create",
        resource: "workspaces",
        metadata: { name: values.name },
      });
    },
    onSuccess: () => {
      toast.success(t("admin.workspaces.created"));
      setOpen(false);
      form.reset({ name: "", description: "", color: "#6366f1" });
      qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workspaces").delete().eq("id", id);
      if (error) throw error;
      if (orgId)
        await logAudit({
          organizationId: orgId,
          action: "workspace.delete",
          resource: "workspaces",
          resourceId: id,
        });
    },
    onSuccess: () => {
      toast.success(t("admin.workspaces.deleted"));
      qc.invalidateQueries({ queryKey: ["admin-workspaces"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{t("admin.workspaces.title")}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.workspaces.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t("admin.workspaces.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("admin.workspaces.new")}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={form.handleSubmit((values) => create.mutate(values))}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="workspaces-name">{t("admin.workspaces.name")}</Label>
                <Input id="workspaces-name" {...form.register("name")} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{t("errors.required")}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspaces-description">{t("admin.workspaces.description")}</Label>
                <Textarea id="workspaces-description" {...form.register("description")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workspaces-color">{t("admin.workspaces.color")}</Label>
                <Input
                  id="workspaces-color"
                  type="color"
                  {...form.register("color")}
                  className="h-10 w-24"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {workspaces.data?.map((w) => (
            <div key={w.id} className="flex items-start justify-between rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: w.color ?? "#6366f1" }}
                >
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-muted-foreground">{w.description ?? "—"}</div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {w.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(w.id)}>
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          {!workspaces.data?.length && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">—</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
