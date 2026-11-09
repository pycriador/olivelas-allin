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
import { useCreateFromTemplate, useDeliveries } from "@/hooks/data";
import type { Template } from "@/types/domain";
import { useNavigate } from "@tanstack/react-router";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  deliveryId: z.string().min(1),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: Template | null;
}

export function UseTemplateDialog({ open, onOpenChange, template }: Props) {
  const { data: deliveries = [] } = useDeliveries();
  const create = useCreateFromTemplate();
  const navigate = useNavigate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", deliveryId: "" },
  });

  useEffect(() => {
    if (open && template) {
      form.reset({ title: `${template.name} draft`, deliveryId: deliveries[0]?.id ?? "" });
    }
  }, [open, template, deliveries, form]);

  const onSubmit = async (v: FormValues) => {
    if (!template) return;
    try {
      const spec = await create.mutateAsync({ templateId: template.id, deliveryId: v.deliveryId, title: v.title });
      toast.success("Spec created from template");
      onOpenChange(false);
      navigate({ to: "/specs/$specId", params: { specId: spec.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Use template: {template?.name}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="ut-title">Spec title</Label>
            <Input id="ut-title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label>Delivery</Label>
            <Select value={form.watch("deliveryId")} onValueChange={(v) => form.setValue("deliveryId", v, { shouldValidate: true })}>
              <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
              <SelectContent>
                {deliveries.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.formState.errors.deliveryId && (
              <p className="mt-1 text-xs text-destructive">Choose a delivery</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create spec</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
