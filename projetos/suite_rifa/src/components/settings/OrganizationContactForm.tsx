import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import { OrganizationService } from "@/services/organizations";
import { describeError, type Organization } from "@/services/types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function OrganizationContactForm({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const { canWrite } = usePermissions();
  const editable = canWrite("organization.update");

  const [email, setEmail] = useState(organization.email ?? "");
  const [phone, setPhone] = useState(organization.phone ?? "");
  const [website, setWebsite] = useState(organization.website ?? "");

  useEffect(() => {
    setEmail(organization.email ?? "");
    setPhone(organization.phone ?? "");
    setWebsite(organization.website ?? "");
  }, [organization]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (email.trim() && !EMAIL_RE.test(email.trim())) throw new Error("INVALID_EMAIL");
      if (website.trim() && !/^https?:\/\/.+\..+/.test(website.trim()))
        throw new Error("Informe um site válido começando com http:// ou https://");
      await OrganizationService.update(organization.id, {
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
      });
    },
    onSuccess: async () => {
      toast.success("Contato atualizado.");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contato</CardTitle>
        <CardDescription>Canais usados em comunicações e documentos da organização.</CardDescription>
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
            <Label htmlFor="org-email">E-mail</Label>
            <Input
              id="org-email"
              type="email"
              value={email}
              maxLength={255}
              disabled={!editable}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-phone">Telefone</Label>
            <Input
              id="org-phone"
              value={phone}
              maxLength={32}
              disabled={!editable}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="org-site">Site</Label>
            <Input
              id="org-site"
              value={website}
              maxLength={255}
              placeholder="https://"
              disabled={!editable}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          {editable ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Salvando…" : "Salvar contato"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
