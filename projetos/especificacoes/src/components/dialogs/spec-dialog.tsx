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
import { useCreateSpec, useDeliveries } from "@/hooks/data";
import { SpecType, SpecStatus } from "@/types/domain";

const schema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional(),
  deliveryId: z.string().min(1),
  type: z.string().min(1),
  status: z.string().min(1),
  tags: z.string().max(200).optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDeliveryId?: string;
}

export function SpecDialog({ open, onOpenChange, defaultDeliveryId }: Props) {
  const { data: deliveries = [] } = useDeliveries();
  const create = useCreateSpec();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      deliveryId: defaultDeliveryId ?? "",
      type: SpecType.Backend,
      status: SpecStatus.Draft,
      tags: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        title: "",
        description: "",
        deliveryId: defaultDeliveryId ?? deliveries[0]?.id ?? "",
        type: SpecType.Backend,
        status: SpecStatus.Draft,
        tags: "",
      });
    }
  }, [open, defaultDeliveryId, deliveries, form]);

  const onSubmit = async (v: FormValues) => {
    try {
      await create.mutateAsync({
        title: v.title,
        description: v.description,
        deliveryId: v.deliveryId,
        type: v.type as SpecType,
        status: v.status as SpecStatus,
        tags: v.tags ? v.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      });
      toast.success("Spec created");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>New specification</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="sp-title">Title</Label>
            <Input id="sp-title" {...form.register("title")} placeholder="API authentication spec" />
            {form.formState.errors.title && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sp-desc">Description</Label>
            <Textarea id="sp-desc" rows={2} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Delivery</Label>
              <Select value={form.watch("deliveryId")} onValueChange={(v) => form.setValue("deliveryId", v, { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>
                  {deliveries.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.deliveryId && (
                <p className="mt-1 text-xs text-destructive">Choose a delivery</p>
              )}
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(SpecType).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.values(SpecStatus).map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="sp-tags">Tags (comma-separated)</Label>
              <Input id="sp-tags" {...form.register("tags")} placeholder="api, backend" />
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
