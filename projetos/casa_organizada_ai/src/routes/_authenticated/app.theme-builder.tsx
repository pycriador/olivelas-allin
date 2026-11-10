import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Monitor,
  Tablet,
  Smartphone,
  Upload,
  Save,
  RotateCcw,
  Loader2,
  Sparkles,
  Bell,
  Search,
  CheckSquare,
  Home,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/theme-builder")({
  component: ThemeBuilder,
});

type ThemeConfig = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text: string;
  border: string;
  fontFamily: string;
  baseSize: number;
  radius: number;
  sidebar: "compact" | "expanded" | "floating" | "top";
  menus: "vertical" | "horizontal";
  iconSize: "small" | "large";
  bannerType: "gradient" | "color" | "image";
  bannerValue: string;
  logoDataUrl?: string;
  headerDataUrl?: string;
  footerDataUrl?: string;
};

const DEFAULTS: ThemeConfig = {
  primary: "#7c3aed",
  secondary: "#f5f3ff",
  accent: "#ec4899",
  background: "#ffffff",
  card: "#ffffff",
  text: "#0f172a",
  border: "#e5e7eb",
  fontFamily: "Inter",
  baseSize: 16,
  radius: 12,
  sidebar: "expanded",
  menus: "vertical",
  iconSize: "small",
  bannerType: "gradient",
  bannerValue: "linear-gradient(135deg,#7c3aed,#ec4899)",
};

const FONTS = ["Inter", "Space Grotesk", "Roboto", "Poppins", "Nunito", "System"];

function ThemeBuilder() {
  const [cfg, setCfg] = useState<ThemeConfig>(DEFAULTS);
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("user_preferences")
        .select("theme_config")
        .eq("user_id", u.user.id)
        .maybeSingle();
      const stored = (data?.theme_config ?? {}) as Partial<ThemeConfig>;
      setCfg({ ...DEFAULTS, ...stored });
      setLoading(false);
    })();
  }, []);

  const set = <K extends keyof ThemeConfig>(k: K, v: ThemeConfig[K]) =>
    setCfg((c) => ({ ...c, [k]: v }));

  async function onSave() {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: u.user.id, theme_config: cfg });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar");
    toast.success("Tema salvo!");
  }

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[380px_1fr]">
      {/* Controls */}
      <aside className="overflow-y-auto border-b lg:border-b-0 lg:border-r border-border bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-semibold">Theme Builder</h1>
            <p className="text-xs text-muted-foreground">Personalize sua plataforma em tempo real.</p>
          </div>
        </div>

        <Tabs defaultValue="colors">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="colors">Cores</TabsTrigger>
            <TabsTrigger value="type">Tipo</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
            <TabsTrigger value="banner">Banner</TabsTrigger>
            <TabsTrigger value="brand">Logo</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="mt-4 space-y-3">
            {(
              [
                ["primary", "Primária"],
                ["secondary", "Secundária"],
                ["accent", "Accent"],
                ["background", "Background"],
                ["card", "Cards"],
                ["text", "Texto"],
                ["border", "Bordas"],
              ] as const
            ).map(([k, label]) => (
              <ColorRow key={k} label={label} value={cfg[k] as string} onChange={(v) => set(k, v)} />
            ))}
          </TabsContent>

          <TabsContent value="type" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Fonte</Label>
              <Select value={cfg.fontFamily} onValueChange={(v) => set("fontFamily", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamanho base ({cfg.baseSize}px)</Label>
              <Slider min={12} max={20} step={1} value={[cfg.baseSize]} onValueChange={(v) => set("baseSize", v[0])} />
            </div>
            <div className="space-y-2">
              <Label>Raio ({cfg.radius}px)</Label>
              <Slider min={0} max={28} step={1} value={[cfg.radius]} onValueChange={(v) => set("radius", v[0])} />
            </div>
          </TabsContent>

          <TabsContent value="layout" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Sidebar</Label>
              <Select value={cfg.sidebar} onValueChange={(v) => set("sidebar", v as ThemeConfig["sidebar"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compacta</SelectItem>
                  <SelectItem value="expanded">Expandida</SelectItem>
                  <SelectItem value="floating">Flutuante</SelectItem>
                  <SelectItem value="top">Superior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Menus</Label>
              <Select value={cfg.menus} onValueChange={(v) => set("menus", v as ThemeConfig["menus"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">Vertical</SelectItem>
                  <SelectItem value="horizontal">Horizontal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ícones</Label>
              <Select value={cfg.iconSize} onValueChange={(v) => set("iconSize", v as ThemeConfig["iconSize"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequenos</SelectItem>
                  <SelectItem value="large">Grandes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="banner" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={cfg.bannerType} onValueChange={(v) => {
                const t = v as ThemeConfig["bannerType"];
                set("bannerType", t);
                if (t === "gradient") set("bannerValue", `linear-gradient(135deg, ${cfg.primary}, ${cfg.accent})`);
                else if (t === "color") set("bannerValue", cfg.primary);
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gradient">Gradiente</SelectItem>
                  <SelectItem value="color">Cor sólida</SelectItem>
                  <SelectItem value="image">Imagem</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {cfg.bannerType === "image" ? (
              <ImagePicker label="Imagem do banner" value={cfg.bannerValue?.startsWith("url(") ? cfg.bannerValue : undefined} onChange={(dataUrl) => set("bannerValue", `url(${dataUrl}) center/cover`)} onClear={() => set("bannerValue", "linear-gradient(135deg, #7c3aed, #ec4899)")} />
            ) : cfg.bannerType === "color" ? (
              <ColorRow label="Cor" value={cfg.bannerValue} onChange={(v) => set("bannerValue", v)} />
            ) : (
              <p className="text-xs text-muted-foreground">O gradiente usa as cores primária e accent.</p>
            )}
          </TabsContent>

          <TabsContent value="brand" className="mt-4 space-y-4">
            <ImagePicker label="Logo" value={cfg.logoDataUrl} onChange={(v) => set("logoDataUrl", v)} onClear={() => set("logoDataUrl", undefined)} />
            <ImagePicker label="Cabeçalho" value={cfg.headerDataUrl} onChange={(v) => set("headerDataUrl", v)} onClear={() => set("headerDataUrl", undefined)} />
            <ImagePicker label="Rodapé" value={cfg.footerDataUrl} onChange={(v) => set("footerDataUrl", v)} onClear={() => set("footerDataUrl", undefined)} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex gap-2">
          <Button onClick={onSave} disabled={saving || loading} className="flex-1 bg-gradient-brand text-primary-foreground shadow-elegant">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
          <Button variant="outline" onClick={() => setCfg(DEFAULTS)} title="Restaurar padrões">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Preview */}
      <section className="flex min-w-0 flex-col overflow-hidden bg-muted/30">
        <div className="flex items-center justify-between border-b border-border bg-background/70 p-3 backdrop-blur">
          <span className="text-xs text-muted-foreground">Preview em tempo real</span>
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {([
              ["desktop", Monitor],
              ["tablet", Tablet],
              ["mobile", Smartphone],
            ] as const).map(([d, Icon]) => (
              <button
                key={d}
                onClick={() => setDevice(d)}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
                  device === d ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                aria-label={d}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-auto p-6">
          <Preview cfg={cfg} device={device} />
        </div>
      </section>
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          aria-label={label}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded-md border border-border bg-transparent"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-28 font-mono text-xs" />
      </div>
    </div>
  );
}

function ImagePicker({
  label,
  value,
  onChange,
  onClear,
}: {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 overflow-hidden">
          {value ? (
            <img
              src={value.startsWith("url(") ? value.slice(4, -14) : value}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={ref}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 1_500_000) return toast.error("Imagem muito grande (máx 1.5MB)");
              const reader = new FileReader();
              reader.onload = () => onChange(String(reader.result));
              reader.readAsDataURL(f);
            }}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => ref.current?.click()}>
            <Upload className="mr-2 h-3 w-3" /> Enviar
          </Button>
          {value && (
            <Button type="button" size="sm" variant="ghost" onClick={onClear}>
              <Trash2 className="mr-2 h-3 w-3" /> Remover
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Preview({ cfg, device }: { cfg: ThemeConfig; device: "desktop" | "tablet" | "mobile" }) {
  const width = device === "desktop" ? "100%" : device === "tablet" ? "820px" : "390px";
  const style = useMemo(
    () =>
      ({
        "--pv-primary": cfg.primary,
        "--pv-secondary": cfg.secondary,
        "--pv-accent": cfg.accent,
        "--pv-bg": cfg.background,
        "--pv-card": cfg.card,
        "--pv-text": cfg.text,
        "--pv-border": cfg.border,
        "--pv-radius": `${cfg.radius}px`,
        "--pv-base": `${cfg.baseSize}px`,
        "--pv-banner": cfg.bannerValue,
        fontFamily: cfg.fontFamily === "System" ? "system-ui" : `"${cfg.fontFamily}", ui-sans-serif`,
      }) as React.CSSProperties,
    [cfg],
  );
  const iconSize = cfg.iconSize === "large" ? 20 : 16;
  const showSidebar = cfg.sidebar !== "top";
  const isCompact = cfg.sidebar === "compact";

  return (
    <div className="mx-auto transition-all" style={{ maxWidth: width }}>
      <div
        className="overflow-hidden border shadow-2xl"
        style={{
          background: "var(--pv-bg)",
          color: "var(--pv-text)",
          borderColor: "var(--pv-border)",
          borderRadius: "var(--pv-radius)",
          fontSize: "var(--pv-base)",
          ...style,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: "var(--pv-border)", background: cfg.headerDataUrl ? `url(${cfg.headerDataUrl}) center/cover` : "transparent" }}
        >
          <div className="flex items-center gap-2">
            {cfg.logoDataUrl ? (
              <img src={cfg.logoDataUrl} alt="Logo" className="h-6" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold text-white" style={{ background: "var(--pv-primary)" }}>H</span>
                <span className="font-semibold">HomeFlow</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-md border px-2 py-1 sm:flex" style={{ borderColor: "var(--pv-border)" }}>
              <Search size={iconSize - 2} /> <span className="text-xs opacity-60">Buscar...</span>
            </div>
            <Bell size={iconSize} />
          </div>
        </div>

        {/* Banner */}
        <div
          className="flex items-end px-6 py-8"
          style={{ background: cfg.bannerValue, borderBottom: `1px solid var(--pv-border)` }}
        >
          <div>
            <div className="text-xs opacity-80 text-white">Meu planejamento</div>
            <div className="text-2xl font-semibold text-white">Semana atual</div>
          </div>
        </div>

        <div className={`flex ${cfg.menus === "horizontal" ? "flex-col" : ""}`}>
          {showSidebar && cfg.menus === "vertical" && (
            <aside
              className={`shrink-0 border-r p-3 ${isCompact ? "w-14" : "w-40"} ${
                cfg.sidebar === "floating" ? "m-3 rounded-lg" : ""
              }`}
              style={{ borderColor: "var(--pv-border)", background: "var(--pv-secondary)" }}
            >
              <nav className="space-y-1 text-xs">
                {[
                  { icon: Home, label: "Home" },
                  { icon: CheckSquare, label: "Tarefas" },
                  { icon: Sparkles, label: "Templates" },
                ].map((n, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5"
                    style={{
                      background: i === 0 ? "var(--pv-primary)" : "transparent",
                      color: i === 0 ? "#fff" : "inherit",
                    }}
                  >
                    <n.icon size={iconSize} />
                    {!isCompact && <span>{n.label}</span>}
                  </div>
                ))}
              </nav>
            </aside>
          )}

          {cfg.menus === "horizontal" && (
            <nav className="flex gap-1 border-b px-4 py-2 text-xs" style={{ borderColor: "var(--pv-border)" }}>
              {["Home", "Tarefas", "Templates"].map((l, i) => (
                <span
                  key={l}
                  className="rounded-md px-3 py-1.5"
                  style={{ background: i === 0 ? "var(--pv-primary)" : "transparent", color: i === 0 ? "#fff" : "inherit" }}
                >
                  {l}
                </span>
              ))}
            </nav>
          )}

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="mt-3 flex justify-end">
              <button
                className="rounded-md px-3 py-1.5 text-xs text-white"
                style={{ background: "var(--pv-primary)", borderRadius: "var(--pv-radius)" }}
              >
                Nova tarefa
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        {cfg.footerDataUrl ? (
          <div className="border-t" style={{ borderColor: "var(--pv-border)" }}>
            <img src={cfg.footerDataUrl} alt="Rodapé" className="w-full object-cover" />
          </div>
        ) : (
          <div className="border-t px-4 py-3 text-center text-[11px] opacity-60" style={{ borderColor: "var(--pv-border)" }}>
            © HomeFlow — feito para você
          </div>
        )}
      </div>
    </div>
  );
}