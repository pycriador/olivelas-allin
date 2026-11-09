import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, type LucideIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogTitle } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/ui";
import { APP_NAV } from "@/constants/navigation";
import { useWorkspaceStore } from "@/stores/workspace";
import { useAuthStore } from "@/stores/auth";

interface CommandItemData {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}

export function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const navigate = useNavigate();
  const workspace = useWorkspaceStore((s) => s.workspace);
  const profile = useAuthStore((s) => s.profile);
  const permissionMap = useWorkspaceStore((s) => s.permissionMap);
  const isGlobalAdmin = useAuthStore((s) => s.isGlobalAdmin);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUIStore.getState().commandPaletteOpen);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  const go = (href: string) => {
    setOpen(false);
    navigate({ to: href as never });
  };

  const findNavIcon = (title: string) =>
    APP_NAV.sections.flatMap((s) => s.items).find((i) => i.title === title)?.icon ?? Search;

  const items: CommandItemData[] = [
    {
      label: "Configurações globais",
      icon: findNavIcon("Configurações"),
      onSelect: () => go("/settings"),
    },
  ];

  if (isGlobalAdmin) {
    items.push({
      label: "Auditoria global",
      icon: findNavIcon("Auditoria"),
      onSelect: () => go("/audit"),
    });
  }

  const canSee = (permission?: string) => {
    if (!permission) return true;
    if (isGlobalAdmin) return true;
    return permissionMap.has(permission);
  };

  const navItems = APP_NAV.sections.flatMap((s) => s.items).filter((i) => canSee(i.permission));

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <DialogTitle className="sr-only">Pesquisa global</DialogTitle>
      <CommandInput placeholder="Pesquisar projetos, usuários, configurações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {navItems.map((item) => (
            <CommandItem
              key={item.href}
              value={item.title}
              keywords={[item.title]}
              onSelect={() => go(item.href)}
            >
              <item.icon className="mr-2 size-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Workspace">
          <CommandItem value={workspace?.name ?? ""} onSelect={() => go("/settings")}>
            <Search className="mr-2 size-4" />
            {workspace?.name ?? "Workspace"}
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações">
          {items.map((item) => (
            <CommandItem key={item.label} value={item.label} onSelect={item.onSelect}>
              <item.icon className="mr-2 size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Perfil">
          <CommandItem
            value={`${profile?.full_name ?? ""} ${profile?.email ?? ""}`}
            onSelect={() => go("/settings")}
          >
            <Search className="mr-2 size-4" />
            {profile?.full_name ?? "Perfil"}
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
