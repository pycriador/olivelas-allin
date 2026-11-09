import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Globe, Palette, Save, UserCog } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PageHeader } from "@/features/dashboard/ui/page-header";
import { useWorkspaceStore } from "@/stores/workspace";
import { workspaceService } from "@/services/workspace";
import { auditService } from "@/services/audit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ThemeSetting } from "@/features/settings/ui/theme-setting";
import { toast } from "sonner";

const workspaceSchema = z.object({
  name: z.string().min(2, "Informe o nome do workspace"),
  domain: z.string().optional().or(z.literal("")),
  locale: z.string(),
  timezone: z.string(),
  branding: z.object({
    primaryColor: z.string().optional().or(z.literal("")),
    accentColor: z.string().optional().or(z.literal("")),
    tagline: z.string().optional().or(z.literal("")),
  }),
});

type WorkspaceFormValues = z.infer<typeof workspaceSchema>;

export function SettingsPage() {
  const workspace = useWorkspaceStore((s) => s.workspace);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const form = useForm<WorkspaceFormValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: workspace?.name ?? "",
      domain: workspace?.domain ?? "",
      locale: workspace?.locale ?? "pt-BR",
      timezone: workspace?.timezone ?? "America/Sao_Paulo",
      branding: {
        primaryColor: (workspace?.branding as { primaryColor?: string } | null)?.primaryColor ?? "",
        accentColor: (workspace?.branding as { accentColor?: string } | null)?.accentColor ?? "",
        tagline: (workspace?.branding as { tagline?: string } | null)?.tagline ?? "",
      },
    },
  });

  const onSubmit = async (values: WorkspaceFormValues) => {
    if (!workspace) return;
    setSaving(true);
    try {
      const updated = await workspaceService.update(workspace.id, {
        name: values.name,
        domain: values.domain || null,
        locale: values.locale,
        timezone: values.timezone,
        branding: values.branding,
      });
      useWorkspaceStore
        .getState()
        .setWorkspace(
          updated,
          useWorkspaceStore.getState().membership,
          useWorkspaceStore.getState().roles,
          useWorkspaceStore.getState().permissions,
        );
      await auditService.record({
        workspaceId: workspace.id,
        action: "update",
        entity: "workspaces",
        entityId: workspace.id,
        metadata: { fields: Object.keys(values) },
      });
      await queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("Configurações salvas com sucesso");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie empresa, branding, tema e idioma do seu workspace."
      />

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">
            <Building2 className="mr-2 size-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="mr-2 size-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="tema">
            <UserCog className="mr-2 size-4" />
            Tema
          </TabsTrigger>
          <TabsTrigger value="idioma">
            <Globe className="mr-2 size-4" />
            Idioma
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Informações da empresa</CardTitle>
                  <CardDescription>Dados exibidos em relatórios e auditoria.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do workspace</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domínio</FormLabel>
                        <FormControl>
                          <Input placeholder="demo.clauseforge.app" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Região e localidade</CardTitle>
                  <CardDescription>Configurações de idioma e fuso horário padrão.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="locale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idioma</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pt-BR">Português (BR)</SelectItem>
                            <SelectItem value="en-US">English (US)</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuso horário</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="America/Sao_Paulo">America/Sao_Paulo</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Europe/Lisbon">Europe/Lisbon</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 size-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="branding" className="mt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Branding</CardTitle>
                  <CardDescription>Personalize a identidade visual do workspace.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <FormField
                    control={form.control}
                    name="branding.tagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Automação documental para a sua operação"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Exibida em documentos e convites.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="branding.primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor primária</FormLabel>
                          <FormControl>
                            <Input placeholder="#4f46e5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="branding.accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor de destaque</FormLabel>
                          <FormControl>
                            <Input placeholder="#8b5cf6" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 size-4" />
                  {saving ? "Salvando..." : "Salvar branding"}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="tema" className="mt-6">
          <ThemeSetting />
        </TabsContent>

        <TabsContent value="idioma" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Idioma da interface</CardTitle>
              <CardDescription>
                A interface do workspace acompanha o idioma configurado na aba Empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Atualmente suportamos Português (BR) com preparação para inglês e espanhol.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
