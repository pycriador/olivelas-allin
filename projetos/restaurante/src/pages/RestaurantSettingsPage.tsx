import { useState, useRef } from 'react';
import {
  Store,
  Upload,
  Trash2,
  Save,
  Building,
  Phone,
  MapPin,
  Globe,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/hooks/useRestaurant';
import { restaurantService } from '@/services/restaurantService';

export function RestaurantSettingsPage() {
  const { currentRestaurant, updateCurrentRestaurant, can } = useRestaurant();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(() => ({
    name: currentRestaurant?.name || '',
    legal_name: currentRestaurant?.legal_name || '',
    document: currentRestaurant?.document || '',
    email: currentRestaurant?.email || '',
    phone: currentRestaurant?.phone || '',
    whatsapp: currentRestaurant?.whatsapp || '',
    address: currentRestaurant?.address || '',
    city: currentRestaurant?.city || '',
    state: currentRestaurant?.state || '',
    zip_code: currentRestaurant?.zip_code || '',
    country: currentRestaurant?.country || 'BR',
    timezone: currentRestaurant?.timezone || 'America/Sao_Paulo',
    currency: currentRestaurant?.currency || 'BRL',
  }));

  const [logoUrl, setLogoUrl] = useState<string | null>(() => currentRestaurant?.logo_url || null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const canEdit = can('restaurant.update');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('Você não possui permissão para editar dados do restaurante.');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('O nome do restaurante é obrigatório.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateCurrentRestaurant({
        name: formData.name.trim(),
        legal_name: formData.legal_name || null,
        document: formData.document || null,
        email: formData.email || null,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        country: formData.country,
        timezone: formData.timezone,
        currency: formData.currency,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Configurações do restaurante salvas com sucesso!');
      }
    } catch {
      toast.error('Erro ao atualizar informações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) {
      toast.error('Você não tem permissão para alterar a logo.');
      return;
    }

    const file = e.target.files?.[0];
    if (!file || !currentRestaurant) return;

    setIsUploadingLogo(true);
    try {
      const res = await restaurantService.uploadRestaurantLogo(currentRestaurant.id, file);
      if (res.error) {
        toast.error(res.error);
      } else if (res.url) {
        setLogoUrl(res.url);
        toast.success('Logo atualizada com sucesso!');
      }
    } catch {
      toast.error('Erro ao fazer upload da logo.');
    } finally {
      setIsUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!canEdit) return;
    if (!currentRestaurant) return;

    setIsUploadingLogo(true);
    try {
      await updateCurrentRestaurant({ logo_url: null });
      setLogoUrl(null);
      toast.success('Logo removida.');
    } catch {
      toast.error('Erro ao remover logo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  if (!currentRestaurant) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Configuração do Restaurante
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie os dados cadastrais, endereço e identidade visual desta unidade.
          </p>
        </div>

        {!canEdit && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-3 py-1.5 rounded-md border border-amber-500/20">
            <AlertCircle className="h-4 w-4" />
            <span>Modo somente leitura para o seu papel</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Identidade Visual (Logo) */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span>Identidade Visual</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Logo que representará seu estabelecimento nas comandas, cardápio e telas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="relative flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo do restaurante" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-8 w-8 text-muted-foreground/50" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  className="hidden"
                  disabled={!canEdit || isUploadingLogo}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!canEdit || isUploadingLogo}
                    className="text-xs"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                    {logoUrl ? 'Substituir logo' : 'Enviar logo'}
                  </Button>

                  {logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveLogo}
                      disabled={!canEdit || isUploadingLogo}
                      className="text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Remover
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Formatos aceitos: PNG, JPG, WebP ou SVG. Tamanho máximo: 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Básicas */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building className="h-4 w-4 text-primary" />
              <span>Informações Cadastrais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="name" required>
                  Nome do restaurante
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!canEdit || isSaving}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="legal_name">Razão social</Label>
                <Input
                  id="legal_name"
                  value={formData.legal_name}
                  onChange={(e) => setFormData({ ...formData, legal_name: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="document">CNPJ / CPF</Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span>Canais de Contato</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span>Endereço</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-1 space-y-1.5">
                <Label htmlFor="zip_code">CEP</Label>
                <Input
                  id="zip_code"
                  value={formData.zip_code}
                  onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="address">Logradouro / Bairro</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  disabled={!canEdit || isSaving}
                />
              </div>

              <div className="sm:col-span-1 space-y-1.5">
                <Label htmlFor="state">Estado (UF)</Label>
                <Input
                  id="state"
                  maxLength={2}
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  disabled={!canEdit || isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configurações Regionais */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <span>Configurações Regionais</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="currency">Moeda</Label>
                <Input id="currency" value={formData.currency} disabled className="bg-muted/50 font-mono" />
                <p className="text-[11px] text-muted-foreground">Padrão Real Brasileiro (R$)</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Input id="timezone" value={formData.timezone} disabled className="bg-muted/50 font-mono" />
                <p className="text-[11px] text-muted-foreground">Horário de Brasília (America/Sao_Paulo)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {canEdit && (
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="px-6 font-semibold"
              isLoading={isSaving}
              loadingText="Salvando alterações..."
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar alterações
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
