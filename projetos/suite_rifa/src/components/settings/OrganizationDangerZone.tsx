import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import { OrganizationService } from "@/services/organizations";
import { ORG_STATUS_LABEL, describeError, type Organization } from "@/services/types";

export function OrganizationDangerZone({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const { role, isGlobalAdmin } = usePermissions();
  const canSuspend = isGlobalAdmin || role === "OWNER";
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");

  const suspend = useMutation({
    mutationFn: () => OrganizationService.suspendSelf(organization.id, confirmation),
    onSuccess: async () => {
      toast.success("Organização suspensa. Somente o administrador da plataforma pode reativá-la.");
      setOpen(false);
      setConfirmation("");
      await queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const reactivate = useMutation({
    mutationFn: () => OrganizationService.setStatus(organization.id, "ACTIVE"),
    onSuccess: async () => {
      toast.success("Organização reativada.");
      await queryClient.invalidateQueries();
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const isActive = organization.status === "ACTIVE";

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Zona de risco</CardTitle>
        <CardDescription>
          Ações sensíveis sobre a organização. Situação atual: {ORG_STATUS_LABEL[organization.status]}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Suspender bloqueia toda a operação</AlertTitle>
          <AlertDescription>
            Enquanto suspensa, ninguém pode criar ou alterar dados da organização. A reativação é feita
            apenas pelo administrador da plataforma. Nenhum dado é apagado.
          </AlertDescription>
        </Alert>

        {isActive ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" disabled={!canSuspend}>
                Suspender organização
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Suspender {organization.name}</DialogTitle>
                <DialogDescription>
                  Digite <strong>{organization.name}</strong> para confirmar. Esta ação é registrada na
                  auditoria.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor="confirm-suspend">Nome da organização</Label>
                <Input
                  id="confirm-suspend"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  disabled={suspend.isPending || confirmation.trim() !== organization.name}
                  onClick={() => suspend.mutate()}
                >
                  {suspend.isPending ? "Suspendendo…" : "Confirmar suspensão"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : isGlobalAdmin ? (
          <Button onClick={() => reactivate.mutate()} disabled={reactivate.isPending}>
            {reactivate.isPending ? "Reativando…" : "Reativar organização"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Esta organização está {ORG_STATUS_LABEL[organization.status].toLowerCase()}. Fale com o
            administrador da plataforma para reativá-la.
          </p>
        )}

        {!canSuspend && isActive ? (
          <p className="text-sm text-muted-foreground">
            Somente o proprietário pode suspender a organização.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
