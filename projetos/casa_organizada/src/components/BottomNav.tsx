import { Home, CalendarDays, Shirt, Settings, Dog, Baby } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useRoutine } from '@/hooks/useRoutine';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const location = useLocation();
  const { settings } = useRoutine();

  const navItems = [
    { path: '/', icon: Home, label: 'Hoje', show: true },
    { path: '/weekly', icon: CalendarDays, label: 'Semana', show: true },
    { path: '/laundry', icon: Shirt, label: 'Lavanderia', show: true },
    { path: '/pets', icon: Dog, label: 'Pets', show: settings.petMode },
    { path: '/baby', icon: Baby, label: 'Bebê', show: settings.babyMode },
    { path: '/settings', icon: Settings, label: 'Config', show: true },
  ].filter((i) => i.show);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-t border-border/80 safe-area-bottom">
      <div className="flex items-center justify-around max-w-lg mx-auto px-1 py-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "text-primary bg-primary/8"
                  : "text-muted-foreground/70 hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full" />
              )}
              <item.icon className={cn("w-5 h-5 transition-transform duration-200", isActive && "scale-110")} />
              <span className="text-[10px] font-semibold tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
