import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Trash2, Edit, Layers, Users as UsersIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/groups")({ component: GroupsPage });

interface Group { id: string; name: string; description: string | null; is_active: boolean; created_at: string; }

function GroupsPage() {
  const { t } = useTranslation();
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => { if (!loading && !isAdmin) navigate({ to: "/dashboard" }); }, [loading, isAdmin, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data: groups, error } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: counts } = await supabase.from("group_members").select("group_id");
      const map: Record<string, number> = {};
      (counts ?? []).forEach((c) => { map[c.group_id] = (map[c.group_id] ?? 0) + 1; });
      return { groups: (groups ?? []) as Group[], counts: map };
    },
    enabled: isAdmin,
  });

  const openNew = () => { setEditing(null); setName(""); setDesc(""); setOpen(true); };
  const openEdit = (g: Group) => { setEditing(g); setName(g.name); setDesc(g.description ?? ""); setOpen(true); };

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim(), description: desc.trim() || null };
    const { error } = editing
      ? await supabase.from("groups").update(payload).eq("id", editing.id)
      : await supabase.from("groups").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("✓"); setOpen(false); qc.invalidateQueries({ queryKey: ["groups"] });
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const { error } = await supabase.from("groups").delete().eq("id", confirmDelete);
    setConfirmDelete(null);
    if (error) return toast.error(error.message);
    toast.success("✓"); qc.invalidateQueries({ queryKey: ["groups"] });
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("groups.title")} subtitle={t("groups.subtitle")}
        action={<Button onClick={openNew} className="bg-brand shadow-glow"><Plus className="mr-2 h-4 w-4" />{t("groups.newGroup")}</Button>} />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (data?.groups ?? []).length === 0 ? (
        <Card className="border-dashed border-border/60 p-12 text-center shadow-soft">
          <Layers className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 font-display text-lg font-semibold">{t("common.empty")}</p>
          <Button onClick={openNew} className="mt-4 bg-brand"><Plus className="mr-2 h-4 w-4" />{t("groups.newGroup")}</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data!.groups.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="group h-full border-border/60 p-5 shadow-soft transition-all hover:shadow-elevated">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand text-primary-foreground shadow-glow">
                    <Layers className="h-5 w-5" />
                  </div>
                  <Badge variant={g.is_active ? "secondary" : "outline"}>
                    {g.is_active ? t("common.active") : t("common.inactive")}
                  </Badge>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold">{g.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{g.description || "—"}</p>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5" /> {data!.counts[g.id] ?? 0} {t("common.members").toLowerCase()}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(g)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(g.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("common.edit") : t("groups.newGroup")}</DialogTitle>
            <DialogDescription>{t("groups.subtitle")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="g-name">{t("common.name")}</Label>
              <Input id="g-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-desc">{t("common.description")}</Label>
              <Textarea id="g-desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={save} disabled={saving || !name.trim()} className="bg-brand">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("groups.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("groups.confirmDeleteDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-destructive">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
