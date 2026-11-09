import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Headphones, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { restaurantService } from '@/services/restaurantService';
import { iamService } from '@/services/iamService';
import type { Restaurant } from '@/types/restaurant';

export function AdminRestaurantSupportPage() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setCurrentRestaurant } = useRestaurant();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantService.getUserRestaurants('all', true).then((res) => {
      const matched = (res.data || []).find((r) => r.id === restaurantId);
      if (matched) setRestaurant(matched);
      setIsLoading(false);
    });
  }, [restaurantId]);

  const handleStartSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurant) return;

    if (!reason.trim()) {
      toast.error('Informe o motivo do acesso de suporte.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await iamService.startSupportSession(restaurant.id, reason.trim(), user?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Sessão de suporte iniciada para ${restaurant.name}!`);
        // Set as active restaurant in RestaurantContext
        setCurrentRestaurant(restaurant);
        // Redirect into restaurant context with support banner
        navigate('/app');
      }
    } catch {
      toast.error('Falha ao iniciar sessão de suporte.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-muted-foreground">Carregando dados da unidade...</div>;
  }

  if (!restaurant) {
    return (
      <div className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">Restaurante não encontrado</h2>
        <Button asChild variant="outline">
          <Link to="/admin/restaurants">Voltar para Restaurantes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <Button variant="ghost" size="sm" asChild className="h-8 px-2">
        <Link to={`/admin/restaurants/${restaurant.id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar para {restaurant.name}
        </Link>
      </Button>

      <Card className="border-border shadow-sm">
        <CardHeader className="text-center pb-2">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
            <Headphones className="h-7 w-7" />
          </div>
          <CardTitle className="text-xl font-bold">Iniciar Sessão de Suporte</CardTitle>
          <CardDescription className="text-xs">
            Você terá acesso administrativo ao contexto do restaurante <strong>{restaurant.name}</strong> para diagnóstico e suporte.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-4">
          <div className="p-3.5 rounded-lg bg-muted/40 border border-border/70 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Princípios de Auditoria e Segurança</span>
            </div>
            <ul className="text-muted-foreground list-disc list-inside space-y-1 text-[11px]">
              <li>Sua identidade real ({user?.email}) permanecerá vinculada a todas as ações.</li>
              <li>Não há falsificação de identidade (no impersonation).</li>
              <li>O início e o encerramento do acesso serão auditados permanentemente.</li>
            </ul>
          </div>

          <form onSubmit={handleStartSupport} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="support-reason" className="text-xs font-semibold">
                Motivo do Acesso de Suporte <span className="text-destructive">*</span>
              </Label>
              <Input
                id="support-reason"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex: Auxílio na configuração da equipe / diagnóstico de cardápio"
                className="text-xs"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Este motivo será gravado permanentemente no log de auditoria do sistema.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link to={`/admin/restaurants/${restaurant.id}`}>Cancelar</Link>
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting || !reason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
              >
                {isSubmitting ? 'Iniciando...' : 'Iniciar Suporte e Entrar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
