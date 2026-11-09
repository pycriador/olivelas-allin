import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, ShieldCheck, MapPin, Building, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/hooks/useRestaurant';

export function SetupRestaurantPage() {
  const navigate = useNavigate();
  const { createRestaurant, restaurants, isGlobalAdmin } = useRestaurant();

  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    document: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'O nome do restaurante é obrigatório.';
    }

    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Insira um e-mail válido.';
    }

    if (formData.document.trim()) {
      const cleanDoc = formData.document.replace(/\D/g, '');
      if (cleanDoc.length !== 14 && cleanDoc.length !== 11) {
        newErrors.document = 'Insira um CNPJ válido (14 dígitos) ou CPF.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await createRestaurant({
        name: formData.name,
        legal_name: formData.legal_name || undefined,
        document: formData.document || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        whatsapp: formData.whatsapp || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip_code: formData.zip_code || undefined,
        currency: 'BRL',
        timezone: 'America/Sao_Paulo',
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Restaurante criado com sucesso!');
        navigate('/app');
      }
    } catch {
      toast.error('Ocorreu um erro ao criar o restaurante.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="w-full flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto border-b border-border/50">
        <Logo to="/app" />
        <div className="flex items-center gap-3">
          {isGlobalAdmin && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/admin')}
              className="text-xs border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Painel Global Admin (SaaS)
            </Button>
          )}
          {restaurants.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app')}
              className="text-xs"
            >
              Voltar ao painel
            </Button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Store className="h-3.5 w-3.5" />
              <span>Configuração Inicial</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Vamos configurar seu restaurante
            </h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Preencha os dados do seu estabelecimento para começar a operar. Você se tornará o administrador desta unidade.
            </p>
          </div>

          <Card className="border-border shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Dados do Estabelecimento</CardTitle>
              <CardDescription className="text-xs">
                As informações poderão ser editadas a qualquer momento nas configurações.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Basic info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                    <Building className="h-3.5 w-3.5" />
                    <span>Identificação Principal</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label htmlFor="name" required>
                        Nome do restaurante
                      </Label>
                      <Input
                        id="name"
                        placeholder="Ex: Olivelas Restaurante &amp; Bar"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        error={Boolean(errors.name)}
                        required
                        disabled={isLoading}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive font-medium">{errors.name}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="legal_name">Razão social</Label>
                      <Input
                        id="legal_name"
                        placeholder="Ex: Olivelas Gastronomia LTDA"
                        value={formData.legal_name}
                        onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="document">CNPJ / CPF</Label>
                      <Input
                        id="document"
                        placeholder="00.000.000/0000-00"
                        value={formData.document}
                        onChange={(e) => {
                          setFormData({ ...formData, document: e.target.value });
                          if (errors.document) setErrors((prev) => ({ ...prev, document: '' }));
                        }}
                        error={Boolean(errors.document)}
                        disabled={isLoading}
                      />
                      {errors.document && (
                        <p className="text-xs text-destructive font-medium">{errors.document}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Contato &amp; Atendimento</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-mail de contato</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contato@restaurante.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        error={Boolean(errors.email)}
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive font-medium">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        placeholder="(11) 3456-7890"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        placeholder="(11) 98765-4321"
                        value={formData.whatsapp}
                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Address info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/60 pb-1">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Endereço da Unidade</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1 space-y-1.5">
                      <Label htmlFor="zip_code">CEP</Label>
                      <Input
                        id="zip_code"
                        placeholder="00000-000"
                        value={formData.zip_code}
                        onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <Label htmlFor="address">Logradouro / Endereço</Label>
                      <Input
                        id="address"
                        placeholder="Rua, Avenida, Número e Bairro"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="sm:col-span-3 space-y-1.5">
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        placeholder="São Paulo"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="sm:col-span-1 space-y-1.5">
                      <Label htmlFor="state">Estado (UF)</Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        maxLength={2}
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Preconfigured Regional settings notice */}
                <div className="rounded-lg border border-border/70 bg-muted/30 p-3.5 text-xs text-muted-foreground flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>Moeda: <strong>BRL (R$)</strong> • Fuso Horário: <strong>America/Sao_Paulo</strong></span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/60">Padrão Brasil</span>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full font-semibold flex items-center justify-center gap-2"
                  isLoading={isLoading}
                  loadingText="Criando restaurante..."
                >
                  <span>Criar restaurante</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
