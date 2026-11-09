import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Shield, User as UserIcon } from "lucide-react";

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
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { useAuth } from "@/contexts/auth-context";
import { ROLE_LABELS, type RoleCode } from "@/types/profile";

function initials(name: string, email: string): string {
  const source = name.trim() || email;
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminHeader() {
  const { currentUser, profile, user, signOut, role } = useAuth();
  const navigate = useNavigate();

  const displayName = currentUser?.name ?? profile?.name ?? user?.email ?? "Conta";
  const email = currentUser?.email ?? profile?.email ?? user?.email ?? "";

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
      <SidebarTrigger aria-label="Alternar menu lateral" />
      <div className="hidden min-w-0 sm:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-1 h-9 gap-2 px-1.5" aria-label="Menu da conta">
              <Avatar className="size-7 ring-2 ring-amber-500/30 dark:ring-amber-600/30">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                {currentUser?.avatarUrl && !profile?.avatar_url ? (
                  <AvatarImage src={currentUser.avatarUrl} alt="" />
                ) : null}
                <AvatarFallback className="text-xs">{initials(displayName, email)}</AvatarFallback>
              </Avatar>
              <span className="hidden max-w-32 truncate text-sm md:inline">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="space-y-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
              <div className="mt-1.5 flex gap-1.5">
                <Badge
                  variant={role === "GLOBAL_ADMIN" ? "default" : "secondary"}
                  className="gap-1"
                >
                  <Shield className="size-3" />
                  {role ? (ROLE_LABELS[role as RoleCode] ?? role) : "—"}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/perfil" className="flex items-center gap-2">
                <UserIcon aria-hidden="true" className="size-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/dashboard" className="flex items-center gap-2">
                <Shield aria-hidden="true" className="size-4" />
                Area do Publicador
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
