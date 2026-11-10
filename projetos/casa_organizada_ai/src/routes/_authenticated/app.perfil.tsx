import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Loader2,
  Brain,
  Trash2,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { useTheme, type ThemeMode } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  getUserProfile,
  updateUserProfile,
  updateUserAvatar,
} from "@/modules/avatar/avatars.functions";
import { AvatarDisplay } from "@/modules/avatar/components/AvatarDisplay";
import { AvatarPicker } from "@/modules/avatar/components/AvatarPicker";
import { getAiSettings } from "@/modules/ai/settings.functions";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  component: PerfilPage,
});

const CATEGORIES = [
  { value: "decoration", label: "Decoração" },
  { value: "garden", label: "Jardim" },
  { value: "kitchen", label: "Cozinha" },
  { value: "organization", label: "Organização" },
  { value: "cleaning", label: "Limpeza" },
  { value: "renovation", label: "Reforma" },
  { value: "events", label: "Eventos" },
  { value: "technology", label: "Tecnologia" },
  { value: "sustainability", label: "Sustentabilidade" },
  { value: "finances", label: "Finanças" },
  { value: "health", label: "Saúde" },
  { value: "leisure", label: "Lazer" },
];

function PerfilPage() {
  const { mode, setMode } = useTheme();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [locale, setLocale] = useState("pt-BR");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [country, setCountry] = useState("BR");
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [notif, setNotif] = useState({
    in_app: true,
    email: false,
    reminders: true,
    invites: true,
    shares: true,
  });
  const [saving, setSaving] = useState(false);
  const initialized = useRef(false);

  const profileFn = useServerFn(getUserProfile);
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["userProfile"],
    queryFn: () => profileFn(),
  });

  const aiSettingsFn = useServerFn(getAiSettings);
  const { data: aiSettings, isLoading: aiLoading } = useQuery({
    queryKey: ["aiSettings"],
    queryFn: () => aiSettingsFn(),
  });

  const updateProfileFn = useServerFn(updateUserProfile);
  const updateAvatarFn = useServerFn(updateUserAvatar);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: u }) => {
      if (u.user) setEmail(u.user.email ?? "");
    });
  }, []);

  useEffect(() => {
    if (profile && !initialized.current) {
      initialized.current = true;
      setName(profile.full_name ?? "");
      setBio(profile.bio ?? "");
      setLocale(profile.locale ?? "pt-BR");
      setTimezone(profile.timezone ?? "America/Sao_Paulo");
      setCountry(profile.country ?? "BR");
      setFavoriteCategories((profile.favorite_categories as string[]) ?? []);
      if (profile.notifications && typeof profile.notifications === "object") {
        setNotif((n) => ({ ...n, ...(profile.notifications as typeof n) }));
      }
    }
  }, [profile]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfileFn({
        data: {
          full_name: name.trim(),
          bio: bio.trim() || null,
          locale,
          timezone,
          country,
          favorite_categories: favoriteCategories,
        },
      });
      const { data: u } = await supabase.auth.getUser();
      if (u.user) {
        await supabase.from("profiles").upsert({
          id: u.user.id,
          notifications: notif,
        });
        await supabase.from("user_preferences").upsert({
          user_id: u.user.id,
          theme_mode: mode,
        });
      }
      toast.success("Perfil atualizado!");
    } catch {
      toast.error("Não foi possível salvar");
    }
    setSaving(false);
  }

  async function handleAvatarSelect(
    avatarId: string,
    type: "library" | "upload",
    photoUrl?: string,
  ) {
    try {
      await updateAvatarFn({
        data: {
          avatar_type: type,
          avatar_id: type === "library" ? avatarId : null,
          photo_url: type === "upload" ? (photoUrl ?? null) : null,
        },
      });
      toast.success("Avatar atualizado!");
    } catch {
      toast.error("Erro ao atualizar avatar");
    }
  }

  async function handleAvatarRemove() {
    try {
      await updateAvatarFn({
        data: { avatar_type: "none", avatar_id: null, photo_url: null },
      });
      toast.success("Avatar removido");
    } catch {
      toast.error("Erro ao remover avatar");
    }
  }

  if (profileLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72" />
        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Perfil
        </h1>
        <p className="text-muted-foreground">
          Ajuste suas informações e preferências.
        </p>
      </div>

      <Tabs defaultValue="perfil">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="avatar">Avatar</TabsTrigger>
          <TabsTrigger value="preferencias">Preferências</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
          <TabsTrigger value="conta">Conta</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card className="p-6">
            <form onSubmit={onSave} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={email} disabled />
              </div>
              <div className="space-y-2">
                <Label>Idioma</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (BR)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fuso horário</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/Sao_Paulo">
                      America/Sao_Paulo (BRT)
                    </SelectItem>
                    <SelectItem value="America/New_York">
                      America/New_York (EST)
                    </SelectItem>
                    <SelectItem value="America/Los_Angeles">
                      America/Los_Angeles (PST)
                    </SelectItem>
                    <SelectItem value="Europe/Lisbon">
                      Europe/Lisbon (WET)
                    </SelectItem>
                    <SelectItem value="Europe/London">
                      Europe/London (GMT)
                    </SelectItem>
                    <SelectItem value="Europe/Madrid">
                      Europe/Madrid (CET)
                    </SelectItem>
                    <SelectItem value="UTC">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BR">Brasil</SelectItem>
                    <SelectItem value="PT">Portugal</SelectItem>
                    <SelectItem value="US">Estados Unidos</SelectItem>
                    <SelectItem value="ES">Espanha</SelectItem>
                    <SelectItem value="AR">Argentina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-brand text-primary-foreground shadow-elegant"
                >
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar alterações
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="avatar">
          <Card className="p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <AvatarDisplay
                avatarType={profile?.avatar_type ?? undefined}
                avatarId={profile?.avatar_id ?? null}
                avatarSlug={profile?.avatar?.slug ?? null}
                photoUrl={profile?.photo_url ?? null}
                fullName={profile?.full_name ?? null}
                size="xl"
              />
              <div className="space-y-3 text-center sm:text-left">
                <h3 className="text-lg font-semibold">Avatar</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha um avatar da biblioteca ou faça upload de uma foto.
                </p>
                <div className="flex justify-center gap-2 sm:justify-start">
                  <AvatarPicker
                    currentAvatarId={profile?.avatar_id ?? null}
                    currentAvatarType={profile?.avatar_type ?? "none"}
                    currentPhotoUrl={profile?.photo_url ?? null}
                    onSelect={handleAvatarSelect}
                    onRemove={handleAvatarRemove}
                  >
                    <Button variant="outline">Alterar</Button>
                  </AvatarPicker>
                  {profile?.avatar_type &&
                  profile?.avatar_type !== "none" ? (
                    <Button variant="ghost" onClick={handleAvatarRemove}>
                      Remover
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preferencias">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-sm font-semibold">
                  Categorias favoritas
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORIES.map((cat) => {
                    const checked = favoriteCategories.includes(cat.value);
                    return (
                      <label
                        key={cat.value}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors",
                          checked
                            ? "border-primary bg-primary/5"
                            : "border-border/60 hover:bg-accent/50",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => {
                            setFavoriteCategories((prev) =>
                              checked
                                ? prev.filter((c) => c !== cat.value)
                                : [...prev, cat.value],
                            );
                          }}
                        />
                        <span className="text-sm">{cat.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Tema</h3>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as ThemeMode)}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <h3 className="mb-3 text-sm font-semibold">Notificações</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(
                    [
                      ["in_app", "No aplicativo"],
                      ["email", "Por e-mail"],
                      ["reminders", "Lembretes de eventos"],
                      ["invites", "Convites recebidos"],
                      ["shares", "Compartilhamentos"],
                    ] as const
                  ).map(([key, label]) => (
                    <label
                      key={key}
                      className="flex items-center justify-between rounded-md border border-border/60 p-3"
                    >
                      <span className="text-sm">{label}</span>
                      <Switch
                        checked={notif[key]}
                        onCheckedChange={(v) =>
                          setNotif((n) => ({ ...n, [key]: v }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
              <Separator />
              <Button
                onClick={onSave}
                disabled={saving}
                className="bg-gradient-brand text-primary-foreground shadow-elegant"
              >
                {saving && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar preferências
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="ia">
          <Card className="p-6">
            {aiLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Brain className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Configurações da IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Seu assistente inteligente
                    </p>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Modelo</p>
                    <p className="text-sm font-medium">
                      {aiSettings?.model ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">
                      Temperatura
                    </p>
                    <p className="text-sm font-medium">
                      {aiSettings?.temperature ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Idioma</p>
                    <p className="text-sm font-medium">
                      {aiSettings?.language ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Memória</p>
                    <p className="text-sm font-medium">
                      {aiSettings?.memory_enabled ? "Ativada" : "Desativada"}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <Link to="/app/ai-settings">
                    Configurar IA
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="conta">
          <Card className="border-destructive/30 p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-destructive">
                  Zona de Perigo
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ações irreversíveis relacionadas à sua conta.
                </p>
              </div>
            </div>
            <Separator className="my-4" />
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium">Excluir conta</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ao excluir sua conta, todos os seus dados serão
                    permanentemente removidos. Esta ação não pode ser desfeita.
                  </p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-3"
                    disabled
                  >
                    Excluir minha conta
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
