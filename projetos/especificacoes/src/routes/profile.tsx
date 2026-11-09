import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useCurrentUser, useRoles, useSession, useUpdateUser } from "@/hooks/iam";
import { ListSkeleton } from "@/components/common/skeletons";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — SpecForge" },
      { name: "description", content: "Manage your SpecForge account and role." },
      { property: "og:title", content: "Profile — SpecForge" },
      { property: "og:description", content: "Manage your SpecForge account and role." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const session = useSession();
  const me = useCurrentUser();
  const roles = useRoles();
  const update = useUpdateUser();
  const [name, setName] = useState<string | null>(null);

  if (me.isLoading) return <div className="mx-auto max-w-3xl p-6"><ListSkeleton rows={4} /></div>;
  const user = me.data;
  if (!user || !session) return <div className="p-6 text-sm text-muted-foreground">No active session.</div>;

  const role = (roles.data ?? []).find((r) => r.id === user.roleId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
        <Badge variant="outline" className="ml-auto">{role?.name ?? user.roleId}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Account</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>Display name</Label>
            <Input value={name ?? user.name} onChange={(e) => setName(e.target.value)} />
          </div>
          <Button
            size="sm"
            disabled={update.isPending || !name || name === user.name}
            onClick={() =>
              update.mutate(
                { id: user.id, patch: { name: (name ?? user.name).trim() } },
                {
                  onSuccess: () => toast.success("Profile updated"),
                  onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to update"),
                },
              )
            }
          >
            Save
          </Button>
          <p className="text-xs text-muted-foreground">
            Sessão expira {new Date(session.expiresAt).toLocaleTimeString()} · last login{" "}
            {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}
          </p>
        </CardContent>
      </Card>

    </div>
  );
}
