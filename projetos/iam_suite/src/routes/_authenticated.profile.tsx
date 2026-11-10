import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({ component: ProfilePage });

function ProfilePage() {
  const { t } = useTranslation();
  const { profile, user, refresh } = useAuth();
  const [name, setName] = useState(profile?.full_name ?? "");
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles")
      .update({ full_name: name, avatar_url: avatar || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("✓"); refresh(); }
  };

  const initials = (name || user?.email || "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="space-y-8">
      <PageHeader title={t("profile.title")} subtitle={t("profile.subtitle")} />
      <Card className="max-w-2xl border-border/60 p-6 shadow-soft">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatar || undefined} />
            <AvatarFallback className="bg-brand text-primary-foreground text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display text-lg font-semibold">{name || user?.email}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("auth.fullName")}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="avatar">Avatar URL</Label>
            <Input id="avatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <Button onClick={save} disabled={saving} className="bg-brand shadow-glow">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t("common.save")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
