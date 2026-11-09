import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useTenant } from "@/hooks/useTenant";
import { ROLE_LABEL } from "@/services/types";

export function OrganizationSwitcher() {
  const { memberships, organization, role, isPending, switchOrganization } = useTenant();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (isPending) return <Skeleton className="h-9 w-52" />;
  if (!organization) return null;

  async function handleSwitch(id: string) {
    if (id === organization?.id) return;
    switchOrganization(id);
    // Drop every tenant-scoped cache so no data leaks across organizations.
    await queryClient.cancelQueries();
    queryClient.removeQueries({ queryKey: ["plan-context"] });
    queryClient.removeQueries({ queryKey: ["members"] });
    queryClient.removeQueries({ queryKey: ["invitations"] });
    queryClient.removeQueries({ queryKey: ["audit"] });
    queryClient.removeQueries({ queryKey: ["organization"] });
    queryClient.removeQueries({ queryKey: ["dashboard"] });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="max-w-[16rem] justify-between gap-2">
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{organization.name}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
          Suas organizações
        </DropdownMenuLabel>
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.organization_id}
            onSelect={() => void handleSwitch(membership.organization_id)}
            className="flex items-start gap-2 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{membership.organization.name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_LABEL[membership.role]}</p>
            </div>
            {membership.organization.status !== "ACTIVE" ? (
              <Badge variant="destructive" className="text-[0.6rem]">
                {membership.organization.status === "SUSPENDED" ? "suspensa" : "inativa"}
              </Badge>
            ) : null}
            {membership.organization_id === organization.id ? (
              <Check className="mt-0.5 size-4 text-primary" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate({ to: "/onboarding" })}>
          <Plus className="mr-2 size-4" /> Criar organização
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ActiveRoleBadge() {
  const { role } = useTenant();
  if (!role) return null;
  return <Badge variant="secondary">{ROLE_LABEL[role]}</Badge>;
}
