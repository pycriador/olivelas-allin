import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Perfil — IAM Pro Forms" }] }),
  component: ProfilePage,
});

const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});
const passwordSchema = z
  .object({
    current: z.string().min(6),
    next: z.string().min(6),
    confirm: z.string().min(6),
  })
  .refine((d) => d.next === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem",
  });

function ProfilePage() {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuthStore();
  const [savingP, setSavingP] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const profile = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", email: user?.email ?? "" },
  });
  const password = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current: "", next: "", confirm: "" },
  });

  if (!user) return null;
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const onProfile = async (data: z.infer<typeof profileSchema>) => {
    setSavingP(true);
    await new Promise((r) => setTimeout(r, 400));
    updateProfile(data);
    toast.success(t("profile.saved"));
    setSavingP(false);
  };

  const onPassword = async () => {
    setSavingPw(true);
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Senha atualizada");
    password.reset();
    setSavingPw(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("profile.subtitle")}</p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback
              className="text-lg font-semibold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {user.role}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Informações pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profile.handleSubmit(onProfile)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">{t("common.name")}</Label>
              <Input id="p-name" {...profile.register("name")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-email">{t("common.email")}</Label>
              <Input id="p-email" type="email" {...profile.register("email")} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingP}>
                {savingP && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">{t("profile.changePassword")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={password.handleSubmit(onPassword)} className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="pw-cur">{t("profile.currentPassword")}</Label>
              <Input id="pw-cur" type="password" {...password.register("current")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-new">{t("profile.newPassword")}</Label>
              <Input id="pw-new" type="password" {...password.register("next")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pw-conf">Confirmar</Label>
              <Input id="pw-conf" type="password" {...password.register("confirm")} />
              {password.formState.errors.confirm && (
                <p className="text-xs text-destructive">
                  {password.formState.errors.confirm.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-3">
              <Button type="submit" disabled={savingPw}>
                {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
