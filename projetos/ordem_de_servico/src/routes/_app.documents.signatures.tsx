import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Plus, CheckCircle2, XCircle, User, Calendar, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, type Column } from "@/components/data-table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { documentService, signatureService, addHistory } from "@/modules/documents/service";
import { DocButton } from "@/components/doc-button";
import type { Document, Signature, SignatureType } from "@/modules/documents/types";
import { SIGNATURE_TYPE_LABELS } from "@/modules/documents/types";

export const Route = createFileRoute("/_app/documents/signatures")({
  head: () => ({ meta: [{ title: "Signature Manager — ServiceForge" }] }),
  component: SignaturesPage,
});

function SignaturesPage() {
  const qc = useQueryClient();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sigType, setSigType] = useState<SignatureType>("client");
  const [sigLabel, setSigLabel] = useState("");
  const [sigSignatory, setSigSignatory] = useState("");
  const [sigSignatoryName, setSigSignatoryName] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [imageData, setImageData] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);

  const { data: documents = [] } = useQuery({ queryKey: ["documents"], queryFn: () => documentService.list() });
  const { data: signatures = [] } = useQuery({
    queryKey: ["documents", "signatures", selectedDocId],
    queryFn: () => signatureService.list(selectedDocId || undefined),
    enabled: !!selectedDocId,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      if (!selectedDocId) throw new Error("Documento não selecionado");
      if (!sigSignatory || !sigSignatoryName) throw new Error("Preencha os dados do signatário");
      const sig = await signatureService.create({
        documentId: selectedDocId, type: sigType, label: sigLabel || SIGNATURE_TYPE_LABELS[sigType],
        imageData: imageData || "",
        signedBy: sigSignatory, signedByName: sigSignatoryName,
        signedAt: new Date().toISOString(), valid: true,
      });
      await addHistory(selectedDocId, "signed", sigSignatory, sigSignatoryName, `Assinatura adicionada: ${sigLabel || SIGNATURE_TYPE_LABELS[sigType]}`);
      return sig;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "signatures"] }); setDialogOpen(false); resetForm(); toast.success("Assinatura criada"); },
    onError: () => toast.error("Erro ao criar assinatura"),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => signatureService.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "signatures"] }); toast.success("Assinatura excluída"); },
  });

  const toggleValidMut = useMutation({
    mutationFn: ({ id, valid }: { id: string; valid: boolean }) => signatureService.update(id, { valid }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["documents", "signatures"] }); toast.success("Status alterado"); },
  });

  const resetForm = () => {
    setSigType("client"); setSigLabel(""); setSigSignatory(""); setSigSignatoryName(""); setImageData("");
  };

  const startDrawing = useCallback(() => setDrawing(true), []);
  const endDrawing = useCallback(() => setDrawing(false), []);
  const draw = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const dot = document.createElement("div");
    dot.className = "absolute bg-foreground rounded-full";
    dot.style.width = "3px";
    dot.style.height = "3px";
    dot.style.left = `${x}px`;
    dot.style.top = `${y}px`;
    canvasRef.current.appendChild(dot);
  }, [drawing]);

  const captureCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const dots = canvasRef.current.querySelectorAll("div");
    dots.forEach((dot) => {
      const left = parseInt(dot.style.left);
      const top = parseInt(dot.style.top);
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(left + 1.5, top + 1.5, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    setImageData(canvas.toDataURL());
    canvasRef.current.innerHTML = "";
  }, []);

  const columns: Column<Signature>[] = [
    { key: "type", header: "Tipo", render: (s) => <Badge variant="outline">{SIGNATURE_TYPE_LABELS[s.type]}</Badge> },
    { key: "label", header: "Label", render: (s) => <span className="font-medium">{s.label}</span> },
    { key: "signedBy", header: "Signatário", render: (s) => (
      <span className="flex items-center gap-1 text-sm"><User className="h-3 w-3" />{s.signedByName}</span>
    )},
    { key: "signedAt", header: "Data", render: (s) => (
      <span className="flex items-center gap-1 text-sm text-muted-foreground"><Calendar className="h-3 w-3" />{new Date(s.signedAt).toLocaleString()}</span>
    )},
    { key: "status", header: "Status", render: (s) => (
      <Badge variant={s.valid ? "default" : "secondary"} className="gap-1 cursor-pointer" onClick={() => toggleValidMut.mutate({ id: s.id, valid: !s.valid })}>
        {s.valid ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {s.valid ? "Válida" : "Inválida"}
      </Badge>
    )},
    { key: "preview", header: "Preview", render: (s) => s.imageData ? (
      <img src={s.imageData} alt="Assinatura" className="h-8 border rounded" />
    ) : <span className="text-xs text-muted-foreground">—</span> },
    { key: "actions", header: "", render: (s) => (
      <Button size="sm" variant="ghost" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gerenciar Assinaturas</h1>
          <DocButton module="documents" page="signatures" />
          <p className="text-sm text-muted-foreground">Gerencie assinaturas dos documentos</p>
        </div>
        <Button disabled={!selectedDocId} onClick={() => { resetForm(); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Nova Assinatura
        </Button>
      </div>

      <div className="w-80">
        <Select value={selectedDocId} onValueChange={setSelectedDocId}>
          <SelectTrigger><SelectValue placeholder="Selecione um documento" /></SelectTrigger>
          <SelectContent>
            {documents.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                <span className="flex items-center gap-2"><FileText className="h-4 w-4" />{d.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={signatures}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchKeys={["label", "signedBy", "signedByName"]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Assinatura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={sigType} onValueChange={(v) => setSigType(v as SignatureType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SIGNATURE_TYPE_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input value={sigLabel} onChange={(e) => setSigLabel(e.target.value)} placeholder={SIGNATURE_TYPE_LABELS[sigType]} />
            </div>
            <div className="space-y-2">
              <Label>ID do Signatário</Label>
              <Input value={sigSignatory} onChange={(e) => setSigSignatory(e.target.value)} placeholder="user-id" />
            </div>
            <div className="space-y-2">
              <Label>Nome do Signatário</Label>
              <Input value={sigSignatoryName} onChange={(e) => setSigSignatoryName(e.target.value)} placeholder="Nome completo" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Desenhe a assinatura</Label>
              <div
                ref={canvasRef}
                className="relative w-full h-32 border-2 border-dashed rounded-md bg-white cursor-crosshair select-none"
                onMouseDown={startDrawing}
                onMouseUp={() => { endDrawing(); captureCanvas(); }}
                onMouseLeave={() => { endDrawing(); captureCanvas(); }}
                onMouseMove={draw}
              />
              {imageData && (
                <div className="mt-2">
                  <Label>Preview</Label>
                  <img src={imageData} alt="Assinatura" className="h-12 border rounded mt-1" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => createMut.mutate()}>Salvar Assinatura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }} onConfirm={() => { if (deleteId) { deleteMut.mutate(deleteId); setDeleteId(null); } }} />
    </div>
  );
}
