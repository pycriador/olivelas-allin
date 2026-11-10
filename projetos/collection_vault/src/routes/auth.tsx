import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Joystick } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Login — RetroVault" }] }),
});

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres").max(72),
});

function AuthPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (mode: "signin" | "signup", form: HTMLFormElement) => {
    const fd = new FormData(form);
    const parsed = schema.safeParse({ email: fd.get("email"), password: fd.get("password") });
    if (!parsed.success) return toast.error(parsed.error.errors[0].message);
    setLoading(true);
    try {
      if (mode === "signup") {
        const display_name = String(fd.get("display_name") || "").trim();
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name } },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu email para confirmar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        toast.success("Bem-vindo de volta, Player!");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally { setLoading(false); }
  };

  const google = async () => {
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r.error) { toast.error("Falha no login Google"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 arcade-grid">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8">
          <Joystick className="h-8 w-8 text-primary" />
          <span className="font-display text-lg neon-text-pink">RETROVAULT</span>
        </Link>

        <div className="rounded-lg border-2 border-primary bg-card p-6 shadow-[var(--shadow-neon-pink)]">
          <h1 className="font-display text-sm text-center neon-text-cyan mb-6">
            ► INSERT COIN<span className="blink">_</span>
          </h1>

          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2 font-display text-xs">
              <TabsTrigger value="signin">LOGIN</TabsTrigger>
              <TabsTrigger value="signup">REGISTRO</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={(e) => { e.preventDefault(); submit("signin", e.currentTarget); }} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-mono text-lg">EMAIL</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="font-mono text-lg">SENHA</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <Button type="submit" disabled={loading} className="w-full font-display text-xs">
                  ▶ ENTRAR
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={(e) => { e.preventDefault(); submit("signup", e.currentTarget); }} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="font-mono text-lg">NICKNAME</Label>
                  <Input id="display_name" name="display_name" maxLength={40} placeholder="PLAYER1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email2" className="font-mono text-lg">EMAIL</Label>
                  <Input id="email2" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password2" className="font-mono text-lg">SENHA</Label>
                  <Input id="password2" name="password" type="password" required minLength={6} />
                </div>
                <Button type="submit" disabled={loading} className="w-full font-display text-xs">
                  ▶ CRIAR CONTA
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="font-mono text-lg text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <Button variant="outline" onClick={google} disabled={loading} className="w-full font-display text-xs border-accent text-accent hover:bg-accent hover:text-accent-foreground">
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z"/></svg>
            CONTINUAR COM GOOGLE
          </Button>
        </div>
      </div>
    </div>
  );
}
