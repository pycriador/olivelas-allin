import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useCreateSprint } from "@/hooks/data";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  status: z.enum(["planned", "active", "completed"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  projectId: string;
}

export function SprintDialog({ open, onOpenChange, projectId }: Props) {
  const create = useCreateSprint();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", status: "planned" },
  });

  useEffect(() => {
    if (open) form.reset({ title: "", status: "planned", startDate: "", endDate: "" });
  }, [open, form]);

  const onSubmit = async (v: FormValues) => {
    try {
      await create.mutateAsync({
        projectId,
        title: v.title,
        status: v.status,
        startDate: v.startDate ? new Date(v.startDate).getTime() : undefined,
        endDate: v.endDate ? new Date(v.endDate).getTime() : undefined,
      });
      toast.success("Sprint created");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New sprint</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="s-title">Title</Label>
            <Input id="s-title" {...form.register("title")} placeholder="Sprint 1" />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="s-start">Start date</Label>
              <Input id="s-start" type="date" {...form.register("startDate")} />
            </div>
            <div>
              <Label htmlFor="s-end">End date</Label>
              <Input id="s-end" type="date" {...form.register("endDate")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
