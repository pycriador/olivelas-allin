import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Download, Plus, Search } from "lucide-react";
import { useCallback, useState } from "react";

import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCampaignList } from "@/hooks/useCampaigns";
import { useParticipants, useExportParticipantsCsv } from "@/hooks/useParticipants";
import { formatMoney, formatDate } from "@/services/types";

export const Route = createFileRoute("/participants")({
  head: () => ({
    meta: [{ title: "Participantes — RaffleHub" }],
  }),
  component: ParticipantsPage,
});

function ParticipantsPage() {
  const { data: campaigns, isPending: loadingCampaigns } = useCampaignList();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  const { data: participants, isPending: loadingParticipants } = useParticipants(
    selectedCampaignId || undefined,
    { limit: LIMIT, offset: page, ...(search ? { search } : {}) },
  );

  const exportCsv = useExportParticipantsCsv();

  const handleExport = useCallback(() => {
    if (selectedCampaignId) exportCsv.mutate(selectedCampaignId);
  }, [selectedCampaignId, exportCsv]);

  const activeCampaign = campaigns?.rows?.find((c) => c.id === selectedCampaignId);

  return (
    <AppShell
      title="Participantes"
      description="Lista de participantes de uma campanha."
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={!selectedCampaignId || exportCsv.isPending}>
            <Download className="size-4" /> {exportCsv.isPending ? "Exportando…" : "Exportar CSV"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Campaign selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full max-w-xs">
            {loadingCampaigns ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                value={selectedCampaignId}
                onChange={(e) => { setSelectedCampaignId(e.target.value); setPage(0); setSearch(""); }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Selecione uma campanha</option>
                {campaigns?.rows?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedCampaignId && (
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou telefone…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="pl-9"
              />
            </div>
          )}
        </div>

        {!selectedCampaignId ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="font-medium">Selecione uma campanha</p>
            <p className="text-sm text-muted-foreground">
              Escolha uma campanha acima para visualizar seus participantes.
            </p>
          </div>
        ) : loadingParticipants ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !participants || participants.items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-16 text-center">
            <p className="font-medium">Nenhum participante</p>
            <p className="text-sm text-muted-foreground">
              Esta campanha ainda não possui participantes registrados.
            </p>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {participants.total} participante(s) encontrado(s)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Números</TableHead>
                      <TableHead>Total gasto</TableHead>
                      <TableHead>Última compra</TableHead>
                      <TableHead>Criado em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participants.items.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>{p.phone ?? "—"}</TableCell>
                        <TableCell>{p.numbers_count}</TableCell>
                        <TableCell>{formatMoney(p.total_spent)}</TableCell>
                        <TableCell>{formatDate(p.last_purchase)}</TableCell>
                        <TableCell>{formatDate(p.created_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {page + 1}–{Math.min(page + LIMIT, participants.total)} de {participants.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - LIMIT))}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + LIMIT >= participants.total}
                  onClick={() => setPage((p) => p + LIMIT)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
