import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { groupsApi, usersApi } from "@/services/iam-service";
import { ALL_PERMISSIONS, type Group, type Permission } from "@/types/auth";

const schema = z.object({
  name: z.string().min(2, "Informe ao menos 2 caracteres"),
  description: z.string().min(3, "Descreva o grupo"),
  status: z.enum(["active", "inactive"]),
  permissions: z.array(z.string()),
  memberIds: z.array(z.string()),
});

type FormValues = z.infer<typeof schema>;

interface GroupFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group | null;
}

export function GroupFormDialog({ open, onOpenChange, group }: GroupFormDialogProps) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const isEdit = Boolean(group);
  const usersQ = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      status: "active",
      permissions: [],
      memberIds: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: group?.name ?? "",
      description: group?.description ?? "",
      status: group?.status ?? "active",
      permissions: group?.permissions ?? [],
      memberIds: group?.memberIds ?? [],
    });
  }, [open, group, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        permissions: values.permissions as Permission[],
      };
      if (group) return groupsApi.update(group.id, payload);
      return groupsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["groups"] });
      qc.invalidateQueries({ queryKey: ["users"] });
      toast.success(isEdit ? t("groups.updated") : t("groups.created"));
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? t("groups.editTitle") : t("groups.new")}</DialogTitle>
          <DialogDescription>{t("groups.formSubtitle")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            className="space-y-4"
          >
            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  {t("groups.tabs.details")}
                </TabsTrigger>
                <TabsTrigger value="permissions" className="flex-1">
                  {t("groups.tabs.permissions")}
                </TabsTrigger>
                <TabsTrigger value="members" className="flex-1">
                  {t("groups.tabs.members")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.name")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Gestores" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("groups.description")}</FormLabel>
                      <FormControl>
                        <Textarea rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("users.columns.status")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="sm:w-56">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">
                            {t("users.status.active")}
                          </SelectItem>
                          <SelectItem value="inactive">
                            {t("users.status.inactive")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="permissions" className="pt-4">
                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {ALL_PERMISSIONS.map((p) => {
                          const checked = field.value.includes(p);
                          return (
                            <label
                              key={p}
                              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition hover:bg-accent/50"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) =>
                                  field.onChange(
                                    v
                                      ? [...field.value, p]
                                      : field.value.filter((x) => x !== p),
                                  )
                                }
                              />
                              <span className="text-sm font-medium">
                                {t(`permissionLabels.${p}`)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="members" className="pt-4">
                <FormField
                  control={form.control}
                  name="memberIds"
                  render={({ field }) => (
                    <FormItem>
                      <ScrollArea className="h-64 rounded-lg border">
                        <div className="space-y-1 p-2">
                          {usersQ.data?.map((u) => {
                            const checked = field.value.includes(u.id);
                            return (
                              <label
                                key={u.id}
                                className="flex cursor-pointer items-center gap-3 rounded-md p-2 transition hover:bg-accent/50"
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(v) =>
                                    field.onChange(
                                      v
                                        ? [...field.value, u.id]
                                        : field.value.filter((x) => x !== u.id),
                                    )
                                  }
                                />
                                <span className="flex-1">
                                  <span className="block text-sm font-medium">
                                    {u.name}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {u.email}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </ScrollArea>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? t("common.loading") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
