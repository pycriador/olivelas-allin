import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ChevronDown, Check, Plus, Layers, ShieldCheck, Search, ExternalLink } from 'lucide-react';
import { useRestaurant } from '@/hooks/useRestaurant';
import { cn } from '@/utils/cn';

export function RestaurantSwitcher() {
  const { currentRestaurant, restaurants, setCurrentRestaurant, isGlobalAdmin } = useRestaurant();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentRestaurant) {
    return null;
  }

  const filteredRestaurants = searchTerm.trim()
    ? restaurants.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.city && r.city.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : restaurants;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all',
          isGlobalAdmin
            ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60'
            : 'border-border/70 bg-card hover:bg-accent hover:border-primary/30'
        )}
        aria-expanded={isOpen}
      >
        <div
          className={cn(
            'h-5 w-5 rounded flex items-center justify-center shrink-0',
            isGlobalAdmin ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'
          )}
        >
          {isGlobalAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <Store className="h-3 w-3" />}
        </div>
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate max-w-[130px] sm:max-w-[190px]">
              {currentRestaurant.name}
            </span>
            {isGlobalAdmin && (
              <span className="text-[9px] font-bold uppercase tracking-wider px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Suporte
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-lg border border-border bg-card p-1.5 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 border-b border-border/60 mb-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isGlobalAdmin ? 'Todos os Restaurantes' : 'Restaurantes Disponíveis'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {restaurants.length}
              </span>
            </div>
            {isGlobalAdmin && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                👑 Global Admin: Acesso total como suporte
              </p>
            )}
          </div>

          {/* Search if more than 3 restaurants */}
          {restaurants.length > 3 && (
            <div className="px-1.5 py-1 mb-1">
              <div className="relative">
                <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar restaurante..."
                  className="w-full pl-7 pr-2 py-1 text-xs rounded-md bg-muted/50 border border-border/60 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1">
            {filteredRestaurants.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                Nenhum restaurante encontrado.
              </div>
            ) : (
              filteredRestaurants.map((restaurant) => {
                const isSelected = restaurant.id === currentRestaurant.id;
                return (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => {
                      setCurrentRestaurant(restaurant);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between px-2.5 py-2 text-xs rounded-md transition-colors text-left',
                      isSelected
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground hover:bg-accent'
                    )}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-medium">{restaurant.name}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                        {restaurant.city && <span>{restaurant.city}, {restaurant.state || 'BR'}</span>}
                        {restaurant.status !== 'active' && (
                          <span className="text-amber-500 font-semibold">({restaurant.status})</span>
                        )}
                      </div>
                    </div>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-primary" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-1.5 mt-1 border-t border-border/60 space-y-1">
            {isGlobalAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/admin');
                }}
                className="flex w-full items-center justify-between px-2.5 py-2 text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-md transition-colors border border-amber-500/30"
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Painel Global Admin (SaaS)</span>
                </span>
                <ExternalLink className="h-3 w-3 text-amber-600/80" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/app/setup/restaurant');
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Criar novo restaurante</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/app/select-restaurant');
              }}
              className="flex w-full items-center gap-2 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Alternar / Ver todas as unidades</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
