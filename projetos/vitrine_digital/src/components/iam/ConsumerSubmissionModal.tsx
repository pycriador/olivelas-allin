import { useState, useRef } from "react";
import { UploadCloud, X, Send, Image as ImageIcon, Phone, Building2, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitArt } from "@/lib/iam-service";
import type { IamGroup } from "@/lib/iam-types";
import { useAuth } from "@/lib/auth-context";

interface ConsumerSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups?: IamGroup[];
  onSuccess?: () => void;
}

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export function ConsumerSubmissionModal({
  isOpen,
  onClose,
  onSuccess,
}: ConsumerSubmissionModalProps) {
  const { user, iamUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  function handleFileSelect(file: File | undefined | null) {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato inválido. Use JPG, PNG ou WebP.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Por favor, selecione uma imagem para enviar.");
      return;
    }

    if (!user) {
      toast.error("Você precisa estar conectado para enviar artes.");
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading("Enviando imagem para análise...");

    try {
      const fileExt = selectedFile.name.split(".").pop() || "png";
      const sanitizedName = selectedFile.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "_");
      const storagePath = `submissions/${user.id}/${Date.now()}_${sanitizedName}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Falha no upload do arquivo: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from("images")
        .getPublicUrl(storagePath);

      const targetGroupId = iamUser?.group_ids?.[0] || null;

      await submitArt({
        userId: user.id,
        userEmail: user.email || "",
        userName: iamUser?.full_name || user.user_metadata?.["full_name"],
        imagePath: storagePath,
        imageUrl: publicUrlData.publicUrl,
        notes: notes.trim() || undefined,
        senderPhone: senderPhone.trim() || undefined,
        senderName: senderName.trim() || undefined,
        targetGroupId: targetGroupId || undefined,
      });

      toast.success("Arte enviada com sucesso para a fila de moderação!", { id: toastId });
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes("");
      setSenderPhone("");
      setSenderName("");
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao submeter arte.";
      toast.error(`Falha no envio: ${msg}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
              <UploadCloud className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Submeter Arte para Análise</h3>
              <p className="mt-0.5 text-xs text-slate-400">
                Envie cartazes ou folhetos para extração automatizada de produtos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Área de Drop da Imagem */}
          <div>
            <label className="block text-slate-300 mb-1.5 font-medium">Arquivo de Imagem *</label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                isDragging
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {previewUrl ? (
                <div className="relative max-h-48 w-full overflow-hidden rounded-lg">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="mx-auto max-h-48 object-contain rounded"
                  />
                  <div className="mt-2 text-[11px] text-blue-400 font-medium">
                    Clique para trocar a imagem selecionada
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-slate-800/80 text-blue-400 border border-slate-700/60">
                    <ImageIcon className="size-5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">Clique para selecionar</span> ou arraste a imagem aqui
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">JPG, PNG ou WebP até 10MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Contato Opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                <Phone className="size-3 text-slate-400" />
                <span>WhatsApp / Contato</span>
              </label>
              <input
                type="text"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
                <Building2 className="size-3 text-slate-400" />
                <span>Empresa / Estabelecimento</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ex: Supermercado Alfa"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-slate-300 mb-1 font-medium flex items-center gap-1.5">
              <FileText className="size-3 text-slate-400" />
              <span>Observações (Opcional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Descreva detalhes como validade de ofertas, filiais ou observações para o analista..."
              className="w-full rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none resize-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:border-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <Send className="size-3.5" />
                  <span>Enviar para Moderação</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
