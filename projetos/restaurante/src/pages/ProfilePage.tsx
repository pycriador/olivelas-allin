import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Globe, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage, AppLanguage } from '@/contexts/LanguageContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (user && isSupabaseConfigured) {
      supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (isMounted && data) {
            if (data.phone) setPhone(data.phone);
            if (data.full_name) setName(data.full_name);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe seu nome.');
      return;
    }

    setIsSaving(true);
    try {
      if (isSupabaseConfigured && user) {
        await supabase
          .from('profiles')
          .update({
            full_name: name.trim(),
            phone: phone.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
      toast.success('Perfil atualizado com sucesso!');
    } catch {
      toast.error('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="pb-2 border-b border-border/60">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Meu Perfil</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gerencie suas preferências individuais e dados de identificação na plataforma.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span>Dados Pessoais</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Informações associadas à sua conta de operador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 pb-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase shrink-0">
                {name.slice(0, 2) || user?.email?.slice(0, 2) || 'OP'}
              </div>
              <div className="space-y-0.5">
                <p className="font-semibold text-sm text-foreground">{name || 'Operador'}</p>
                <p className="text-xs text-muted-foreground font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="prof-email">E-mail de acesso (somente leitura)</Label>
              <div className="relative">
                <Input
                  id="prof-email"
                  value={user?.email || ''}
                  disabled
                  className="bg-muted/50 font-mono text-xs pl-8"
                />
                <Mail className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="prof-name" required>
                Nome completo
              </Label>
              <Input
                id="prof-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSaving}
              />
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="prof-phone">Telefone / Celular</Label>
              <div className="relative">
                <Input
                  id="prof-phone"
                  placeholder="(11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSaving}
                  className="pl-8"
                />
                <Phone className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferências de interface */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              <span>Aparência e Idioma</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tema visual</Label>
              <div className="grid grid-cols-3 gap-2">
                {(['system', 'light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`p-2.5 rounded-lg border text-xs font-medium capitalize transition-colors ${
                      theme === t
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    {t === 'system' ? 'Sistema' : t === 'light' ? 'Claro' : 'Escuro'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prof-lang">Idioma da interface</Label>
              <div className="relative">
                <select
                  id="prof-lang"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 pl-8 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="pt-BR">Português (Brasil)</option>
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                </select>
                <Globe className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSaving} loadingText="Salvando...">
            <Save className="h-4 w-4 mr-2" />
            Salvar perfil
          </Button>
        </div>
      </form>
    </div>
  );
}
