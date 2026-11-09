import { Building2, Check, ChevronDown, CircleDot, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkspaceStore } from "@/stores/workspace";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  variant?: "topbar" | "sidebar";
}

export function WorkspaceSwitcher({ variant = "topbar" }: WorkspaceSwitcherProps) {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const isLoading = useWorkspaceStore((s) => s.isLoading);

  if (isLoading) {
    return <Skeleton className="h-8 w-40" />;
  }

  if (!workspace) return null;

  if (variant === "sidebar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate">{workspace.name}</span>
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <WorkspaceMenu />
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground md:inline-flex"
        >
          <Building2 className="size-4 text-muted-foreground" />
          {workspace.name}
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <WorkspaceMenu />
    </DropdownMenu>
  );
}

function WorkspaceMenu() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const roleLabel = useWorkspaceStore((s) => s.roles[0]?.role) ?? "membro";

  return (
    <DropdownMenuContent className="w-64" align="end" alignOffset={-8}>
      <DropdownMenuLabel className="text-xs uppercase text-muted-foreground">
        Workspace
      </DropdownMenuLabel>
      <DropdownMenuItem className="cursor-default" disabled>
        <Building2 className="mr-2 size-4" />
        <span className="flex-1">{workspace?.name}</span>
        <Check className="size-4 text-primary" />
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-default" disabled>
        <Layers className="mr-2 size-4" />
        <span className="flex-1">Plano</span>
        <span className="text-xs text-muted-foreground capitalize">{workspace?.plan}</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-default" disabled>
        <CircleDot
          className={cn(
            "mr-2 size-4",
            workspace?.status === "active" ? "text-emerald-500" : "text-muted-foreground",
          )}
        />
        <span className="flex-1">Status</span>
        <span className="text-xs text-muted-foreground capitalize">{workspace?.status}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">
        Seu papel: <span className="capitalize">{roleLabel.replace("_", " ")}</span>
      </DropdownMenuLabel>
    </DropdownMenuContent>
  );
}
