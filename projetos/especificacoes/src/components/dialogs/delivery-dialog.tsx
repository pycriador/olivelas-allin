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
import { useCreateDelivery } from "@/hooks/data";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  status: z.enum(["todo", "doing", "done", "blocked"]),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sprintId: string;
}

export function DeliveryDialog({ open, onOpenChange, sprintId }: Props) {
  const create = useCreateDelivery();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { title: "", status: "todo" } });

  useEffect(() => { if (open) form.reset({ title: "", status: "todo" }); }, [open, form]);

  const onSubmit = async (v: FormValues) => {
    try {
      await create.mutateAsync({ sprintId, title: v.title, status: v.status });
      toast.success("Delivery created");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>New delivery</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="d-title">Title</Label>
            <Input id="d-title" {...form.register("title")} placeholder="Implement feature X" />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as FormValues["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">To do</SelectItem>
                <SelectItem value="doing">Doing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
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
