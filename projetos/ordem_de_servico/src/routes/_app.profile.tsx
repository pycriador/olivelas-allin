import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { friendlyAuthError } from "@/lib/supabase-errors";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(80),
});
const passwordSchema = z
  .object({
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não conferem" });

function ProfilePage() {
  const { user, updateProfile, updatePassword, uploadAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const nameForm = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "" },
  });
  const pwdForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirm: "" },
  });

  const initials = (user?.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const onAvatarChange = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      await uploadAvatar(file);
      toast.success("Avatar atualizado.");
    } catch (err) {
      toast.error(friendlyAuthError(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie seus dados e credenciais</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto e dados</CardTitle>
          <CardDescription>Suas informações públicas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatarUrl} alt={user?.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5 text-primary-foreground shadow"
                disabled={uploading}
                aria-label="Alterar avatar"
              >
                {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAvatarChange(e.target.files?.[0])}
              />
            </div>
            <div className="text-sm">
              <p className="font-medium">{user?.email}</p>
              <p className="text-muted-foreground">Papel: {user?.role}</p>
            </div>
          </div>

          <form
            onSubmit={nameForm.handleSubmit(async ({ name }) => {
              try {
                await updateProfile({ name });
                toast.success("Perfil atualizado.");
              } catch (err) {
                toast.error(friendlyAuthError(err));
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...nameForm.register("name")} />
              {nameForm.formState.errors.name && (
                <p className="text-xs text-destructive">{nameForm.formState.errors.name.message}</p>
              )}
            </div>
            <Button type="submit" disabled={nameForm.formState.isSubmitting}>
              {nameForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alterar senha</CardTitle>
          <CardDescription>Escolha uma nova senha forte</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={pwdForm.handleSubmit(async ({ password }) => {
              try {
                await updatePassword(password);
                toast.success("Senha atualizada.");
                pwdForm.reset();
              } catch (err) {
                toast.error(friendlyAuthError(err));
              }
            })}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="new-pwd">Nova senha</Label>
              <Input id="new-pwd" type="password" autoComplete="new-password" {...pwdForm.register("password")} />
              {pwdForm.formState.errors.password && (
                <p className="text-xs text-destructive">{pwdForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">Confirmar senha</Label>
              <Input id="confirm-pwd" type="password" autoComplete="new-password" {...pwdForm.register("confirm")} />
              {pwdForm.formState.errors.confirm && (
                <p className="text-xs text-destructive">{pwdForm.formState.errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={pwdForm.formState.isSubmitting}>
              {pwdForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Atualizar senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
