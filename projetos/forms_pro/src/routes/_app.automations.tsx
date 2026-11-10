import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Workflow } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrgGuard } from "@/components/org/org-guard";
import { automationsApi } from "@/services/platform-extras-service";
import type {
  ActionType,
  AutomationAction,
  AutomationCondition,
  AutomationRule,
  TriggerType,
} from "@/types/org";

const TRIGGERS: TriggerType[] = [
  "response.created",
  "response.completed",
  "form.published",
  "form.updated",
  "user.created",
];
const ACTION_TYPES: ActionType[] = [
  "send_notification",
  "send_webhook",
  "create_log",
  "update_status",
];
const OPERATORS: AutomationCondition["operator"][] = ["eq", "neq", "gt", "lt", "contains"];

export const Route = createFileRoute("/_app/automations")({
  head: () => ({
    meta: [
      { title: "Automações — IAM Pro Forms" },
      { name: "description", content: "Workflow engine IF/THEN: gatilhos, condições e ações automáticas." },
      { property: "og:title", content: "Automações — IAM Pro Forms" },
      { property: "og:description", content: "Regras automáticas disparadas por eventos da plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <OrgGuard>{(orgId) => <AutomationsPage organizationId={orgId} />}</OrgGuard>
  ),
});

function AutomationsPage({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["automations", organizationId],
    queryFn: () => automationsApi.list(organizationId),
  });
  const execQ = useQuery({
    queryKey: ["automation-executions", organizationId],
    queryFn: () => automationsApi.executions(organizationId),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AutomationRule["status"] }) =>
      automationsApi.setStatus(id, status),
    onSuccess: () => {
      toast.success(t("automations.statusChanged"));
      qc.invalidateQueries({ queryKey: ["automations", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => automationsApi.remove(id),
    onSuccess: () => {
      toast.success(t("automations.removed"));
      qc.invalidateQueries({ queryKey: ["automations", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("automations.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("automations.subtitle")}</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("automations.create")}
        </Button>
      </div>

      {q.isLoading ? (
        <Skeleton className="h-56 w-full" />
      ) : !q.data?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center">
            <Workflow className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("automations.empty")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {q.data.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{rule.name}</h3>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                    {t(`automations.status.${rule.status}`)}
                  </Badge>
                </div>
                <div className="space-y-1 rounded-lg bg-muted/50 p-3 text-xs">
                  <p>
                    <span className="font-semibold">IF</span>{" "}
                    {t(`automations.triggers.${rule.triggerType}`)}
                    {rule.conditions.map((c, i) => (
                      <span key={i}>
                        {" "}
                        · {c.field} {t(`automations.operators.${c.operator}`)} {c.value}
                      </span>
                    ))}
                  </p>
                  <p>
                    <span className="font-semibold">THEN</span>{" "}
                    {rule.actions.map((a) => t(`automations.actionTypes.${a.type}`)).join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {t("automations.runs")}: {rule.runCount}
                  </span>
                  <span>
                    {t("automations.lastRun")}:{" "}
                    {rule.lastRunAt ? new Date(rule.lastRunAt).toLocaleString() : "—"}
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setStatus.mutate({
                          id: rule.id,
                          status: rule.status === "active" ? "paused" : "active",
                        })
                      }
                    >
                      {rule.status === "active"
                        ? t("automations.status.paused")
                        : t("automations.status.active")}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => remove.mutate(rule.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("automations.executions")}</CardTitle>
        </CardHeader>
        <CardContent>
          {execQ.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !execQ.data?.length ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {t("automations.noExecutions")}
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              {execQ.data.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <Badge variant={e.status === "success" ? "default" : "secondary"}>{e.status}</Badge>
                  <span className="text-xs">{e.triggerType}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AutomationDialog
        organizationId={organizationId}
        open={open}
        onOpenChange={setOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ["automations", organizationId] })}
      />
    </div>
  );
}

function AutomationDialog({
  organizationId,
  open,
  onOpenChange,
  onCreated,
}: {
  organizationId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("response.created");
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);
  const [actions, setActions] = useState<AutomationAction[]>([
    { type: "send_notification", config: {} },
  ]);

  const create = useMutation({
    mutationFn: () =>
      automationsApi.create({
        organizationId,
        name,
        description,
        triggerType,
        formId: null,
        conditions,
        actions,
        status: "active",
      }),
    onSuccess: () => {
      toast.success(t("automations.created"));
      onCreated();
      onOpenChange(false);
      setName("");
      setDescription("");
      setConditions([]);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("automations.create")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("automations.name")}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("automations.description")}</Label>
            <Textarea
              value={description}
              rows={2}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("automations.trigger")}</Label>
            <Select value={triggerType} onValueChange={(v) => setTriggerType(v as TriggerType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRIGGERS.map((tr) => (
                  <SelectItem key={tr} value={tr}>
                    {t(`automations.triggers.${tr}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("automations.conditions")}</Label>
            {conditions.map((c, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <Input
                  className="w-40"
                  placeholder={t("automations.field")}
                  value={c.field}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((x, idx) => (idx === i ? { ...x, field: e.target.value } : x)),
                    )
                  }
                />
                <Select
                  value={c.operator}
                  onValueChange={(v) =>
                    setConditions((prev) =>
                      prev.map((x, idx) =>
                        idx === i ? { ...x, operator: v as AutomationCondition["operator"] } : x,
                      ),
                    )
                  }
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPERATORS.map((op) => (
                      <SelectItem key={op} value={op}>
                        {t(`automations.operators.${op}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="w-40"
                  placeholder={t("automations.value")}
                  value={c.value}
                  onChange={(e) =>
                    setConditions((prev) =>
                      prev.map((x, idx) => (idx === i ? { ...x, value: e.target.value } : x)),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setConditions((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setConditions((prev) => [...prev, { field: "", operator: "eq", value: "" }])
              }
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("automations.addCondition")}
            </Button>
          </div>

          <div className="space-y-2">
            <Label>{t("automations.actions")}</Label>
            {actions.map((a, i) => (
              <div key={i} className="flex items-center gap-2">
                <Select
                  value={a.type}
                  onValueChange={(v) =>
                    setActions((prev) =>
                      prev.map((x, idx) => (idx === i ? { ...x, type: v as ActionType } : x)),
                    )
                  }
                >
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map((at) => (
                      <SelectItem key={at} value={at}>
                        {t(`automations.actionTypes.${at}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {actions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActions((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActions((prev) => [...prev, { type: "create_log", config: {} }])}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> {t("automations.addAction")}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
            {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
