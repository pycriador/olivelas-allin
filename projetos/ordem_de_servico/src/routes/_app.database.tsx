import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { databaseService } from "@/modules/database/service";
import { CONNECTION_TYPE_LABELS, type ConnectionType } from "@/modules/database/types";
import { useTranslation } from "@/core/i18n/I18nProvider";

const schema = z.object({
  name: z.string().min(1),
  type: z.enum(["localstorage", "supabase", "postgresql", "mariadb", "sqlite"]),
  host: z.string().optional(),
  port: z.coerce.number().int().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  url: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export const Route = createFileRoute("/_app/database")({
  head: () => ({
    meta: [
      { title: "Bancos de Dados — ServiceForge" },
      { name: "description", content: "Gerenciamento de conexões de persistência." },
    ],
  }),
  component: DatabasePage,
});

function DatabasePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ["db", "list"],
    queryFn: () => databaseService.list(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "postgresql" },
  });

  const createMut = useMutation({
    mutationFn: (v: FormValues) => databaseService.create({ ...v, isActive: false, status: "inactive" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["db"] });
      setOpen(false);
      form.reset();
    },
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => databaseService.activate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["db"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => databaseService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["db"] }),
  });

  const handleTest = async (id: string) => {
    toast.loading(t("database.testing"), { id: "test-" + id });
    const res = await databaseService.test(id);
    toast.success(`${t("database.testSuccess")} — ${res.latencyMs}ms`, { id: "test-" + id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("database.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("database.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("database.new")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("database.new")}</DialogTitle>
            </DialogHeader>
            <form
              id="conn-form"
              className="space-y-4"
              onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
            >
              <div className="space-y-2">
                <Label>{t("database.name")}</Label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <Label>{t("database.type")}</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(v) => form.setValue("type", v as ConnectionType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONNECTION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input {...form.register("host")} placeholder="localhost" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" {...form.register("port")} placeholder="5432" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Database</Label>
                <Input {...form.register("database")} />
              </div>
            </form>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" form="conn-form">
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connections</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("database.name")}</TableHead>
                  <TableHead>{t("database.type")}</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>{t("database.status")}</TableHead>
                  <TableHead className="text-right">{t("database.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {connections.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{CONNECTION_TYPE_LABELS[c.type]}</TableCell>
                    <TableCell className="text-muted-foreground">{c.host ?? "—"}</TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Badge className="gap-1"><CheckCircle2 className="h-3 w-3" />{t("database.active")}</Badge>
                      ) : (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => handleTest(c.id)}>
                        <Zap className="h-4 w-4" />
                      </Button>
                      {!c.isActive && (
                        <Button size="sm" variant="outline" onClick={() => activateMut.mutate(c.id)}>
                          {t("database.activate")}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMut.mutate(c.id)}
                        disabled={c.isActive}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
