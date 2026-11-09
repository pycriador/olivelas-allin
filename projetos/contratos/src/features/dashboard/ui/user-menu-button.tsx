import { useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Settings, Sun, User, ChevronsUpDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface UserMenuButtonProps {
  variant?: "topbar" | "sidebar";
}

export function UserMenuButton({ variant = "topbar" }: UserMenuButtonProps) {
  const user = useAuthStore((s) => s.session?.user ?? null);
  const profile = useAuthStore((s) => s.profile);
  const isGlobalAdmin = useAuthStore((s) => s.isGlobalAdmin);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { isMobile } = useSidebar();
  const setTheme = useThemeStore((s) => s.setTheme);

  const name = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Você saiu da sua conta");
    navigate({ to: "/login" });
  };

  const triggerContent = (
    <>
      <Avatar className="size-8 shrink-0 rounded-lg">
        <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      </Avatar>
      {variant === "sidebar" && (
        <>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{name}</span>
            <span className="truncate text-xs text-muted-foreground">
              {isGlobalAdmin ? "Super Admin" : profile?.job_title || user?.email}
            </span>
          </div>
          <ChevronsUpDown className="ml-auto size-4" />
        </>
      )}
    </>
  );

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
            {triggerContent}
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <UserMenuContent
            name={name}
            email={user?.email ?? ""}
            onSignOut={handleSignOut}
            setTheme={setTheme}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
          aria-label="Menu do usuário"
        >
          {triggerContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <UserMenuContent
          name={name}
          email={user?.email ?? ""}
          onSignOut={handleSignOut}
          setTheme={setTheme}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface UserMenuContentProps {
  name: string;
  email: string;
  onSignOut: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
}

function UserMenuContent({ name, email, onSignOut, setTheme }: UserMenuContentProps) {
  return (
    <>
      <DropdownMenuLabel className="p-0 font-normal">
        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
          <Avatar className="size-8 rounded-full">
            <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold">{name}</span>
            <span className="truncate text-xs text-muted-foreground">{email}</span>
          </div>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem>
          <User />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings />
          Configurações
          <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun />
          Tema claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon />
          Tema escuro
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onSignOut} className="text-destructive focus:text-destructive">
        <LogOut />
        Sair
      </DropdownMenuItem>
    </>
  );
}
