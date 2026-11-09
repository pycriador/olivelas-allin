import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";
import { OrganizationService } from "@/services/organizations";
import { slugify, describeError } from "@/services/types";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Nova organização — RaffleHub" },
      { name: "description", content: "Crie sua organização para começar a usar o RaffleHub." },
      { property: "og:title", content: "Nova organização — RaffleHub" },
      { property: "og:description", content: "Crie sua organização para começar a usar o RaffleHub." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isPending } = useCurrentUser();
  const { switchOrganization } = useTenant();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPending && !user) void navigate({ to: "/auth", replace: true });
  }, [isPending, user, navigate]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      const id = await OrganizationService.create({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      switchOrganization(id);
      await queryClient.invalidateQueries();
      toast.success("Organização criada com sucesso.");
      void navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(describeError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-muted/40 px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Criar organização</CardTitle>
          <CardDescription>
            Cada organização tem dados, usuários e arquivos totalmente isolados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => void submit(e)}>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(slugify(e.target.value));
                }}
                placeholder="Rifas do Bairro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Identificador</Label>
              <Input id="slug" required value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
              <p className="text-xs text-muted-foreground">Usado em URLs. Apenas letras, números e hífens.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail de contato (opcional)</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={saving || !name.trim()}>
              {saving ? "Criando…" : "Criar organização"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
