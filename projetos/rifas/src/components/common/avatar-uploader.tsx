import { useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/common/confirm-delete";
import { storageService, validateFile } from "@/services/storage.service";
import { auditService } from "@/services/audit.service";

interface AvatarUploaderProps {
  userId: string;
  name: string;
  avatarUrl: string | null;
  onChange: (url: string | null) => void | Promise<void>;
}

const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function AvatarUploader({ userId, name, avatarUrl, onChange }: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSelect = async (file: File | undefined) => {
    if (!file) return;
    const validation = validateFile(file, { maxSizeMb: 5, allowedTypes: AVATAR_TYPES });
    if (validation) {
      toast.error(validation);
      return;
    }

    setBusy(true);
    try {
      const stored = await storageService.upload(file, "avatars", userId);
      const url = await storageService.longSignedUrl(stored.path);
      await onChange(url);
      toast.success("Avatar atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao enviar avatar.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await onChange(null);
      await auditService.log({
        action: "DELETE",
        entity: "profile",
        entityId: userId,
        newValue: { avatar_url: null },
      });
      toast.success("Avatar removido.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha ao remover avatar.");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Avatar className="size-16">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt={`Avatar de ${name}`} /> : null}
        <AvatarFallback>{initials(name)}</AvatarFallback>
      </Avatar>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload aria-hidden="true" className="size-4" />
          {avatarUrl ? "Trocar avatar" : "Enviar avatar"}
        </Button>
        {avatarUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Remover
          </Button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            void handleSelect(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <ConfirmDelete
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Remover avatar"
        description="A imagem deixará de ser exibida no seu perfil."
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
}
