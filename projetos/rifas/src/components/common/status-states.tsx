import { AlertTriangle, Lock, ShieldOff } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface StatusStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string | undefined;
  onAction?: (() => void) | undefined;
}

function StatusState({ icon: Icon, title, description, actionLabel, onAction }: StatusStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction ? (
        <Button variant="outline" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  description = "Não foi possível carregar estas informações.",
  onRetry,
}: {
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <StatusState
      icon={AlertTriangle}
      title="Algo deu errado"
      description={description}
      actionLabel={onRetry ? "Tentar novamente" : undefined}
      {...(onRetry ? { onAction: onRetry } : {})}
    />
  );
}

export function UnauthorizedState({ onAction }: { onAction?: () => void }) {
  return (
    <StatusState
      icon={Lock}
      title="Sessão necessária"
      description="Entre com sua conta Google para acessar esta área."
      actionLabel={onAction ? "Entrar" : undefined}
      {...(onAction ? { onAction } : {})}
    />
  );
}

export function ForbiddenState() {
  return (
    <StatusState
      icon={ShieldOff}
      title="Acesso restrito"
      description="Você não possui permissão para visualizar este conteúdo."
    />
  );
}
