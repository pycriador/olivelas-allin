import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import { OrganizationService } from "@/services/organizations";
import { describeError, slugify, type Organization } from "@/services/types";

export function OrganizationGeneralForm({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const { canWrite, role, isGlobalAdmin } = usePermissions();
  const editable = canWrite("organization.update");
  const canEditSlug = isGlobalAdmin || role === "OWNER";

  const [name, setName] = useState(organization.name);
  const [slug, setSlug] = useState(organization.slug);
  const [legalName, setLegalName] = useState(organization.legal_name ?? "");
  const [document, setDocument] = useState(organization.document ?? "");

  useEffect(() => {
    setName(organization.name);
    setSlug(organization.slug);
    setLegalName(organization.legal_name ?? "");
    setDocument(organization.document ?? "");
  }, [organization]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (name.trim().length < 2) throw new Error("Informe um nome com pelo menos 2 caracteres.");
      if (slug.trim().length < 3) throw new Error("INVALID_SLUG");
      await OrganizationService.update(organization.id, {
        name: name.trim(),
        ...(canEditSlug ? { slug: slugify(slug) } : {}),
        legal_name: legalName.trim() || null,
        document: document.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Dados da organização atualizados.");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dados gerais</CardTitle>
        <CardDescription>Identificação da organização dentro da plataforma.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="org-name">Nome</Label>
            <Input
              id="org-name"
              value={name}
              disabled={!editable}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Identificador (slug)</Label>
            <Input
              id="org-slug"
              value={slug}
              disabled={!editable || !canEditSlug}
              maxLength={60}
              onChange={(e) => setSlug(slugify(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              {canEditSlug
                ? "Usado em URLs. Apenas letras, números e hífens."
                : "Somente o proprietário pode alterar o identificador."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-legal">Razão social</Label>
            <Input
              id="org-legal"
              value={legalName}
              disabled={!editable}
              maxLength={160}
              onChange={(e) => setLegalName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-doc">CNPJ / CPF</Label>
            <Input
              id="org-doc"
              value={document}
              disabled={!editable}
              maxLength={32}
              onChange={(e) => setDocument(e.target.value)}
            />
          </div>
          {editable ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando…" : "Salvar alterações"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
