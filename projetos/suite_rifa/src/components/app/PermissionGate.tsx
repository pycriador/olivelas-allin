import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/hooks/usePermissions";
import type { PermissionKey } from "@/services/types";
import { ShieldAlert } from "lucide-react";

interface PermissionGateProps {
  permission: PermissionKey | PermissionKey[];
  children: ReactNode;
  /** Renders nothing instead of the "no access" card. */
  silent?: boolean;
}

/**
 * Hides UI the current role cannot use. This is presentation only —
 * the database enforces the same matrix through RLS and definer functions.
 */
export function PermissionGate({ permission, children, silent }: PermissionGateProps) {
  const { canAny, isPending } = usePermissions();
  const wanted = Array.isArray(permission) ? permission : [permission];

  if (isPending) return silent ? null : <Skeleton className="h-32 w-full" />;
  if (canAny(wanted)) return <>{children}</>;
  if (silent) return null;

  return (
    <Card>
      <CardContent className="pt-6">
        <Alert>
          <ShieldAlert className="size-4" />
          <AlertTitle>Acesso restrito</AlertTitle>
          <AlertDescription>
            Seu papel nesta organização não permite ver este conteúdo. Fale com um administrador.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
