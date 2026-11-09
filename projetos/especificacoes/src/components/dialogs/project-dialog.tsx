import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateProject, useUpdateProject, useWorkspaces } from "@/hooks/data";
import { useCurrentWorkspace } from "@/stores/workspace.store";
import { ProjectStatus, type Project } from "@/types/domain";

const schema = z.object({
  name: z.string().trim().min(2, "Name must have at least 2 characters").max(80),
  description: z.string().trim().max(500).optional(),
  workspaceId: z.string().min(1, "Workspace is required"),
  color: z.string().regex(/^#([0-9a-f]{6})$/i, "Invalid hex color"),
  status: z.enum(["active", "paused", "completed", "archived"]),
});

type FormValues = z.infer<typeof schema>;

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#06b6d4"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project;
}

export function ProjectDialog({ open, onOpenChange, project }: Props) {
  const { data: workspaces = [] } = useWorkspaces();
  const currentWs = useCurrentWorkspace();
  const create = useCreateProject();
  const update = useUpdateProject();
  const isEdit = !!project;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      workspaceId: currentWs?.id ?? workspaces[0]?.id ?? "",
      color: "#3b82f6",
      status: ProjectStatus.Active,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: project?.name ?? "",
        description: project?.description ?? "",
        workspaceId: project?.workspaceId ?? currentWs?.id ?? workspaces[0]?.id ?? "",
        color: project?.color ?? "#3b82f6",
        status: project?.status ?? ProjectStatus.Active,
      });
    }
  }, [open, project, workspaces, currentWs, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: project!.id, patch: values });
        toast.success("Project updated");
      } else {
        await create.mutateAsync(values);
        toast.success("Project created");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save project");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit project" : "New project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="p-name">Name</Label>
            <Input id="p-name" {...form.register("name")} placeholder="Platform Core" />
            {form.formState.errors.name && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" rows={3} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Workspace</Label>
              <Select
                value={form.watch("workspaceId")}
                onValueChange={(v) => form.setValue("workspaceId", v, { shouldValidate: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {workspaces.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Color</Label>
            <div className="mt-1 flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => form.setValue("color", c)}
                  className={`h-7 w-7 rounded-full border-2 transition ${
                    form.watch("color") === c ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
