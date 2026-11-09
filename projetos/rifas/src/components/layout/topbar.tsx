import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, User as UserIcon } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { EmptyState } from "@/components/common/empty-state";
import { GlobalSearch } from "@/components/layout/global-search";
import { useAuth } from "@/contexts/auth-context";

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Topbar() {
  const { profile, user, signOut, isGlobalAdmin } = useAuth();
  const navigate = useNavigate();

  const displayName = profile?.name ?? user?.email ?? "Conta";
  const email = profile?.email ?? user?.email ?? "";

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 min-w-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-md sm:gap-3 sm:px-4">
      <SidebarTrigger className="shrink-0" aria-label="Alternar menu lateral" />
      <div className="hidden min-w-0 sm:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1">
        <GlobalSearch />
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notificações">
              <Bell aria-hidden="true" className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium">Notificações</p>
            </div>
            <EmptyState
              title="Tudo em dia"
              description="Você não possui notificações no momento."
              className="border-0"
            />
          </PopoverContent>
        </Popover>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 h-9 gap-2 px-1.5" aria-label="Menu da conta">
              <Avatar className="size-7">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="text-xs">{initials(displayName, email)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm md:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="space-y-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
              <Badge variant={isGlobalAdmin ? "default" : "secondary"} className="mt-1">
                {isGlobalAdmin ? "Global Admin" : "Usuário"}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="flex items-center gap-2">
                <UserIcon aria-hidden="true" className="size-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleSignOut()}>
              <LogOut aria-hidden="true" className="size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
