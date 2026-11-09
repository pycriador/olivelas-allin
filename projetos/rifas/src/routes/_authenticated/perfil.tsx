import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { PageHeader } from "@/components/common/page-header";
import { AvatarUploader } from "@/components/common/avatar-uploader";
import { LoadingState } from "@/components/common/loading-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useUpdateProfile } from "@/hooks/use-profile";
import { updateProfileSchema, type UpdateProfileInput } from "@/schemas/profile.schema";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — RaffleHub" },
      { name: "description", content: "Gerencie seus dados de conta no RaffleHub." },
      { property: "og:title", content: "Perfil — RaffleHub" },
      { property: "og:description", content: "Gerencie seus dados de conta no RaffleHub." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, isProfileLoading, isGlobalAdmin } = useAuth();
  const updateProfile = useUpdateProfile(profile?.id ?? null);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: "", avatar_url: "" },
  });

  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name, avatar_url: profile.avatar_url ?? "" });
    }
  }, [profile, form]);

  const onSubmit = (values: UpdateProfileInput) => {
    updateProfile.mutate(values, {
      onSuccess: () => toast.success("Perfil atualizado com sucesso"),
      onError: (error) => toast.error("Não foi possível salvar", { description: error.message }),
    });
  };

  if (isProfileLoading || !profile) {
    return <LoadingState label="Carregando perfil…" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Perfil"
        description="Atualize suas informações pessoais."
        actions={
          <Badge variant={isGlobalAdmin ? "default" : "secondary"}>
            {isGlobalAdmin ? "Global Admin" : "Usuário"}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informações da conta</CardTitle>
          <CardDescription>Seu e-mail é definido pelo login Google.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex items-center gap-4">
            <AvatarUploader
              userId={profile.id}
              name={profile.name}
              avatarUrl={form.watch("avatar_url") || null}
              onChange={(url) => form.setValue("avatar_url", url ?? "", { shouldDirty: true })}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{profile.name}</p>
              <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            </div>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-6 sm:max-w-lg"
              noValidate
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="avatar_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do avatar</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://…"
                        inputMode="url"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>Deixe em branco para usar as iniciais.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-2">
                <Label htmlFor="profile-email">E-mail</Label>
                <Input id="profile-email" value={profile.email} readOnly disabled />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Salvando…" : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
