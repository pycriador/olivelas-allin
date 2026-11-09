import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePermissions } from "@/hooks/usePermissions";
import { OrganizationService } from "@/services/organizations";
import { describeError, type Organization } from "@/services/types";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

export function OrganizationBrandingForm({ organization }: { organization: Organization }) {
  const queryClient = useQueryClient();
  const { canWrite } = usePermissions();
  const editable = canWrite("organization.update");
  const fileInput = useRef<HTMLInputElement>(null);

  const [primary, setPrimary] = useState(organization.primary_color);
  const [secondary, setSecondary] = useState(organization.secondary_color);

  useEffect(() => {
    setPrimary(organization.primary_color);
    setSecondary(organization.secondary_color);
  }, [organization]);

  const logo = useQuery({
    queryKey: ["organization-logo", organization.id, organization.logo_url],
    queryFn: () => OrganizationService.signedLogoUrl(organization.logo_url),
  });

  const colors = useMutation({
    mutationFn: () =>
      OrganizationService.update(organization.id, {
        primary_color: primary,
        secondary_color: secondary,
      }),
    onSuccess: async () => {
      toast.success("Identidade visual atualizada.");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!ACCEPTED.includes(file.type)) throw new Error("Use uma imagem PNG, JPG, WEBP ou SVG.");
      if (file.size > MAX_LOGO_BYTES) throw new Error("A imagem deve ter no máximo 2 MB.");
      await OrganizationService.uploadLogo(organization.id, file);
    },
    onSuccess: async () => {
      toast.success("Logo enviada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
      await queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  const removeLogo = useMutation({
    mutationFn: () => OrganizationService.removeLogo(organization.id, organization.logo_url),
    onSuccess: async () => {
      toast.success("Logo removida.");
      await queryClient.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (error) => toast.error(describeError(error)),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Identidade visual</CardTitle>
        <CardDescription>
          Logo e cores da organização. Os arquivos ficam isolados na pasta desta organização.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-20 rounded-xl border">
            {logo.data ? <AvatarImage src={logo.data} alt={`Logo de ${organization.name}`} /> : null}
            <AvatarFallback className="rounded-xl text-lg">
              {organization.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) upload.mutate(file);
                e.target.value = "";
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!editable || upload.isPending}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="mr-2 size-4" />
                {upload.isPending ? "Enviando…" : "Enviar logo"}
              </Button>
              {organization.logo_url ? (
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!editable || removeLogo.isPending}
                  onClick={() => removeLogo.mutate()}
                >
                  <ImageOff className="mr-2 size-4" /> Remover
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP ou SVG — até 2 MB.</p>
          </div>
        </div>

        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            colors.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="primary-color">Cor primária</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                className="h-10 w-16 p-1"
                value={primary}
                disabled={!editable}
                onChange={(e) => setPrimary(e.target.value)}
              />
              <Input value={primary} disabled={!editable} onChange={(e) => setPrimary(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary-color">Cor secundária</Label>
            <div className="flex gap-2">
              <Input
                id="secondary-color"
                type="color"
                className="h-10 w-16 p-1"
                value={secondary}
                disabled={!editable}
                onChange={(e) => setSecondary(e.target.value)}
              />
              <Input
                value={secondary}
                disabled={!editable}
                onChange={(e) => setSecondary(e.target.value)}
              />
            </div>
          </div>
          {editable ? (
            <div className="sm:col-span-2">
              <Button type="submit" disabled={colors.isPending}>
                {colors.isPending ? "Salvando…" : "Salvar cores"}
              </Button>
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
