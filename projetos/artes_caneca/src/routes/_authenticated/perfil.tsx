import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { uploadToBucket } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/perfil")({ component: Perfil });

function Perfil() {
  const { user, profile, role, refresh } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");
  const [pw, setPw] = useState("");
  const [pwc, setPwc] = useState("");
  const [busy, setBusy] = useState(false);

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setBusy(true);
    try {
      const { signedUrl } = await uploadToBucket("avatars", file, user.id);
      setAvatarUrl(signedUrl);
      await supabase.from("profiles").update({ avatar_url: signedUrl }).eq("id", user.id);
      await refresh();
      toast.success("Foto atualizada");
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function saveProfile() {
    if (!user) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() || null }).eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast.success("Perfil atualizado");
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function changePassword() {
    if (pw.length < 6) return toast.error("Mínimo 6 caracteres");
    if (pw !== pwc) return toast.error("As senhas não coincidem");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw(""); setPwc("");
      toast.success("Senha alterada");
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-display font-semibold">Meu perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e preferências.</p>
      </header>

      <Card>
        <CardHeader><CardTitle>Informações</CardTitle><CardDescription>Atualize seu nome e foto.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                {(fullName || user?.email || "U").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button asChild variant="outline" size="sm"><span>Trocar foto</span></Button>
              </Label>
              <Input id="avatar" type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              {role && <div><Badge variant="secondary" className="capitalize">{role === "admin" ? "Administrador" : role === "editor" ? "Editor" : "Visualizador"}</Badge></div>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
          </div>
          <Button onClick={saveProfile} disabled={busy}>Salvar perfil</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alterar senha</CardTitle><CardDescription>Use uma senha forte com pelo menos 6 caracteres.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5"><Label>Nova senha</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Confirmar senha</Label><Input type="password" value={pwc} onChange={(e) => setPwc(e.target.value)} /></div>
          <Button onClick={changePassword} disabled={busy} variant="outline">Alterar senha</Button>
        </CardContent>
      </Card>
    </div>
  );
}
