import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogIn, LogOut, History, ShieldAlert, Clock, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/data-table";
import { impersonationService, auditService } from "@/modules/admin/service";
import { DocButton } from "@/components/doc-button";
import { useTranslation } from "@/core/i18n/I18nProvider";
import type { ImpersonationSession, AuditLog } from "@/modules/admin/types";

const impersonationSchema = z.object({
  companyId: z.string().min(1, "Empresa é obrigatória"),
  companyName: z.string().optional(),
  reason: z.string().optional(),
});

type ImpersonationForm = z.infer<typeof impersonationSchema>;

export const Route = createFileRoute("/_app/admin/impersonation")({
  head: () => ({ meta: [{ title: "Admin Impersonação — ServiceForge" }] }),
  component: AdminImpersonationPage,
});

function AdminImpersonationPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [historyOpen, setHistoryOpen] = useState(false);

  const { data: session } = useQuery({ queryKey: ["admin", "impersonation", "session"], queryFn: () => impersonationService.get() });
  const { data: history = [] } = useQuery({ queryKey: ["admin", "impersonation", "history"], queryFn: () => impersonationService.getHistory() });

  const form = useForm<ImpersonationForm>({
    resolver: zodResolver(impersonationSchema),
    defaultValues: { companyName: "" },
  });

  const startMut = useMutation({
    mutationFn: (data: ImpersonationForm) => impersonationService.start({
      originalUserId: "admin", originalUserName: "Administrador",
      companyId: data.companyId, companyName: data.companyName ?? "Empresa",
      startedAt: new Date().toISOString(), reason: data.reason,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "impersonation"] }); form.reset(); toast.success("Impersonação iniciada"); },
    onError: () => { toast.error("Erro ao iniciar impersonação"); },
  });

  const endMut = useMutation({
    mutationFn: () => impersonationService.end(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin", "impersonation"] }); toast.success("Impersonação encerrada"); },
    onError: () => { toast.error("Erro ao encerrar impersonação"); },
  });

  const columns: Column<AuditLog>[] = [
    { key: "date", header: "Data", render: (l) => <span className="text-sm">{l.date} {l.time}</span> },
    { key: "userName", header: "Usuário", render: (l) => (
      <div className="flex items-center gap-2">
        <User className="h-3 w-3 text-muted-foreground" />
        <span>{l.userName}</span>
      </div>
    )},
    { key: "companyName", header: "Empresa", render: (l) => (
      <div className="flex items-center gap-2">
        <Building2 className="h-3 w-3 text-muted-foreground" />
        <span>{l.companyName}</span>
      </div>
    )},
    { key: "action", header: "Ação", render: (l) => (
      <Badge variant={l.action.includes("Iniciou") ? "default" : "secondary"}>{l.action}</Badge>
    )},
    { key: "description", header: "Descrição", render: (l) => <span className="text-sm text-muted-foreground">{l.description}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{t("admin.impersonation")}</h1>
            <DocButton module="admin" page="impersonation" title="Impersonação" />
          </div>
          <p className="text-sm text-muted-foreground">Gerencie sessões de impersonação</p>
        </div>
      </div>

      {session?.active && (
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-yellow-500" />
              Sessão de Impersonação Ativa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Empresa</span>
                <p className="font-medium flex items-center gap-2"><Building2 className="h-4 w-4" />{session.companyName}</p>
              </div>
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Iniciada em</span>
                <p className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" />{new Date(session.startedAt).toLocaleString()}</p>
              </div>
              {session.reason && (
                <div className="space-y-1 col-span-2">
                  <span className="text-sm text-muted-foreground">Motivo</span>
                  <p className="text-sm">{session.reason}</p>
                </div>
              )}
            </div>
            <Button variant="destructive" onClick={() => endMut.mutate()}>
              <LogOut className="mr-2 h-4 w-4" />Encerrar Impersonação
            </Button>
          </CardContent>
        </Card>
      )}

      {!session?.active && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Iniciar Impersonação</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit((v) => startMut.mutate(v))} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Empresa</Label>
                  <Select value={form.watch("companyId")} onValueChange={(v) => form.setValue("companyId", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company_1">Empresa Exemplo 1</SelectItem>
                      <SelectItem value="company_2">Empresa Exemplo 2</SelectItem>
                      <SelectItem value="company_3">Empresa Exemplo 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Motivo (opcional)</Label><Input {...form.register("reason")} placeholder="Motivo da impersonação" /></div>
              </div>
              <Button type="submit"><LogIn className="mr-2 h-4 w-4" />Iniciar Impersonação</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Histórico de Impersonação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={history}
            columns={columns}
            keyExtractor={(l) => l.id}
            searchKeys={["userName", "companyName", "description"]}
            initialSortColumn="date"
          />
        </CardContent>
      </Card>
    </div>
  );
}