import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, useTenant } from "@/hooks/useTenant";

export function UserMenu() {
  const { user } = useCurrentUser();
  const { isGlobalAdmin } = useTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!user) return null;

  const name = (user.user_metadata?.["full_name"] as string | undefined) ?? user.email ?? "Conta";
  const avatar = user.user_metadata?.["avatar_url"] as string | undefined;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Abrir menu da conta">
          <Avatar className="size-8">
            {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        {isGlobalAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void navigate({ to: "/platform" })}>
              <ShieldCheck className="mr-2 size-4" /> Administração da plataforma
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate({ to: "/onboarding" })}>
          <UserRound className="mr-2 size-4" /> Minhas organizações
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="mr-2 size-4" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
