import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, KeyRound, Loader2, Plus, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrgGuard } from "@/components/org/org-guard";
import { apiKeysApi, webhooksApi } from "@/services/developer-service";
import { PLATFORM_EVENTS } from "@/types/org";

export const Route = createFileRoute("/_app/developer")({
  head: () => ({
    meta: [
      { title: "Developer — IAM Pro Forms" },
      { name: "description", content: "API keys, webhooks assinados e documentação da API pública do IAM Pro Forms." },
      { property: "og:title", content: "Developer — IAM Pro Forms" },
      { property: "og:description", content: "Plataforma de API: keys, webhooks e entregas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <OrgGuard>{(orgId) => <DeveloperPage organizationId={orgId} />}</OrgGuard>
  ),
});

function DeveloperPage({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("developer.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("developer.subtitle")}</p>
      </div>
      <Tabs defaultValue="keys">
        <TabsList className="flex-wrap">
          <TabsTrigger value="keys">{t("developer.tabs.keys")}</TabsTrigger>
          <TabsTrigger value="webhooks">{t("developer.tabs.webhooks")}</TabsTrigger>
          <TabsTrigger value="deliveries">{t("developer.tabs.deliveries")}</TabsTrigger>
          <TabsTrigger value="docs">{t("developer.tabs.docs")}</TabsTrigger>
        </TabsList>
        <TabsContent value="keys" className="mt-5">
          <KeysTab organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-5">
          <WebhooksTab organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="deliveries" className="mt-5">
          <DeliveriesTab organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="docs" className="mt-5">
          <DocsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KeysTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [plainKey, setPlainKey] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["api-keys", organizationId],
    queryFn: () => apiKeysApi.list(organizationId),
  });

  const create = useMutation({
    mutationFn: () => apiKeysApi.create({ organizationId, name }),
    onSuccess: (res) => {
      setPlainKey(res.plainKey);
      setName("");
      setOpen(false);
      toast.success(t("developer.keys.created"));
      qc.invalidateQueries({ queryKey: ["api-keys", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revoke = useMutation({
    mutationFn: (id: string) => apiKeysApi.revoke(id),
    onSuccess: () => {
      toast.success(t("developer.keys.revoked"));
      qc.invalidateQueries({ queryKey: ["api-keys", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold">{t("developer.keys.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("developer.keys.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("developer.keys.create")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {plainKey && (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
            <p className="text-xs font-medium text-muted-foreground">{t("developer.keys.copyOnce")}</p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{plainKey}</code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(plainKey);
                  toast.success(t("org.invitations.copied"));
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {q.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !q.data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("developer.keys.empty")}</p>
        ) : (
          <div className="space-y-2">
            {q.data.map((k) => (
              <div key={k.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{k.name}</span>
                <code className="rounded bg-muted px-2 py-0.5 text-xs">{k.prefix}…</code>
                <Badge variant={k.status === "active" ? "default" : "secondary"}>{k.status}</Badge>
                <span className="text-xs text-muted-foreground">
                  {t("developer.keys.lastUsed")}:{" "}
                  {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : "—"}
                </span>
                {k.status === "active" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive"
                    onClick={() => revoke.mutate(k.id)}
                  >
                    {t("developer.keys.revoke")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("developer.keys.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="key-name">{t("developer.keys.name")}</Label>
            <Input id="key-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function WebhooksTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>(["response.created"]);

  const q = useQuery({
    queryKey: ["webhooks", organizationId],
    queryFn: () => webhooksApi.list(organizationId),
  });

  const create = useMutation({
    mutationFn: () => webhooksApi.create({ organizationId, name, url, events }),
    onSuccess: () => {
      toast.success(t("developer.webhooks.created"));
      setOpen(false);
      setName("");
      setUrl("");
      qc.invalidateQueries({ queryKey: ["webhooks", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      webhooksApi.update(id, { status }),
    onSuccess: () => {
      toast.success(t("developer.webhooks.updated"));
      qc.invalidateQueries({ queryKey: ["webhooks", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => webhooksApi.remove(id),
    onSuccess: () => {
      toast.success(t("developer.webhooks.removed"));
      qc.invalidateQueries({ queryKey: ["webhooks", organizationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base font-semibold">{t("developer.webhooks.title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("developer.webhooks.subtitle")}</p>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> {t("developer.webhooks.create")}
        </Button>
      </CardHeader>
      <CardContent>
        {q.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !q.data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("developer.webhooks.empty")}</p>
        ) : (
          <div className="space-y-2">
            {q.data.map((w) => (
              <div key={w.id} className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm">
                <WebhookIcon className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="font-medium">{w.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{w.url}</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {w.events.map((e) => (
                    <Badge key={e} variant="secondary" className="text-[10px]">
                      {e}
                    </Badge>
                  ))}
                </div>
                <Badge variant={w.status === "active" ? "default" : "secondary"}>{w.status}</Badge>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggle.mutate({ id: w.id, status: w.status === "active" ? "paused" : "active" })
                    }
                  >
                    {w.status === "active" ? t("developer.webhooks.pause") : t("developer.webhooks.activate")}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(w.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("developer.webhooks.create")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t("developer.webhooks.name")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("developer.webhooks.url")}</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>{t("developer.webhooks.events")}</Label>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {PLATFORM_EVENTS.map((ev) => (
                  <label key={ev} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={events.includes(ev)}
                      onCheckedChange={(c) =>
                        setEvents((prev) => (c ? [...prev, ev] : prev.filter((e) => e !== ev)))
                      }
                    />
                    <span className="text-xs">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={!name.trim() || !url.startsWith("http") || !events.length || create.isPending}
            >
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function DeliveriesTab({ organizationId }: { organizationId: string }) {
  const { t } = useTranslation();
  const q = useQuery({
    queryKey: ["webhook-deliveries", organizationId],
    queryFn: () => webhooksApi.deliveries(organizationId),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("developer.deliveries.title")}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {q.isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : !q.data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("developer.deliveries.empty")}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2 pr-4 font-medium">{t("developer.deliveries.event")}</th>
                <th className="py-2 pr-4 font-medium">{t("developer.deliveries.status")}</th>
                <th className="py-2 pr-4 font-medium">HTTP</th>
                <th className="py-2 pr-4 font-medium">{t("developer.deliveries.attempt")}</th>
                <th className="py-2 pr-4 font-medium">{t("developer.deliveries.duration")}</th>
                <th className="py-2 font-medium">{t("common.date", { defaultValue: "Data" })}</th>
              </tr>
            </thead>
            <tbody>
              {q.data.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2.5 pr-4">{d.event}</td>
                  <td className="py-2.5 pr-4">
                    <Badge variant={d.status === "success" ? "default" : "secondary"}>{d.status}</Badge>
                  </td>
                  <td className="py-2.5 pr-4">{d.httpStatus ?? "—"}</td>
                  <td className="py-2.5 pr-4">{d.attempt}</td>
                  <td className="py-2.5 pr-4">{d.durationMs ? `${d.durationMs}ms` : "—"}</td>
                  <td className="py-2.5 text-muted-foreground">
                    {new Date(d.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function DocsTab() {
  const { t } = useTranslation();
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{t("developer.docs.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("developer.docs.subtitle")}</p>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        <div>
          <h3 className="font-semibold">{t("developer.docs.auth")}</h3>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`curl ${base}/api/public/v1/forms \\
  -H "Authorization: Bearer ipf_xxx_your_api_key"`}
          </pre>
        </div>
        <div>
          <h3 className="font-semibold">{t("developer.docs.endpoints")}</h3>
          <ul className="mt-2 space-y-1.5 text-xs">
            <li><code className="rounded bg-muted px-1.5 py-0.5">GET /api/public/v1/forms</code></li>
            <li><code className="rounded bg-muted px-1.5 py-0.5">GET /api/public/v1/forms/:id</code></li>
            <li><code className="rounded bg-muted px-1.5 py-0.5">GET /api/public/v1/forms/:id/responses</code></li>
            <li><code className="rounded bg-muted px-1.5 py-0.5">POST /api/public/v1/forms/:id/responses</code></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold">Webhook signature</h3>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs">
{`X-Webhook-Signature: sha256=<hmac(secret, rawBody)>
X-Webhook-Event: response.created`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
