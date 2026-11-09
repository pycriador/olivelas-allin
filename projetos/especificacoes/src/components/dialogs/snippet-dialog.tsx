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
import { useCreateSnippet, useUpdateSnippet } from "@/hooks/data";
import type { Snippet } from "@/types/domain";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(300).optional(),
  language: z.string().min(1),
  content: z.string().trim().min(1).max(20000),
  tags: z.string().max(200).optional(),
});
type FormValues = z.infer<typeof schema>;

const LANGS = ["typescript", "javascript", "python", "sql", "bash", "markdown", "json", "yaml", "prompt", "text"];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  snippet?: Snippet;
}

export function SnippetDialog({ open, onOpenChange, snippet }: Props) {
  const create = useCreateSnippet();
  const update = useUpdateSnippet();
  const isEdit = !!snippet;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", language: "typescript", content: "", tags: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: snippet?.name ?? "",
        description: snippet?.description ?? "",
        language: snippet?.language ?? "typescript",
        content: snippet?.content ?? "",
        tags: snippet?.tags.join(", ") ?? "",
      });
    }
  }, [open, snippet, form]);

  const onSubmit = async (v: FormValues) => {
    try {
      const payload = {
        name: v.name,
        description: v.description,
        language: v.language,
        content: v.content,
        tags: v.tags ? v.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      if (isEdit) {
        await update.mutateAsync({ id: snippet!.id, patch: payload });
        toast.success("Snippet updated");
      } else {
        await create.mutateAsync(payload);
        toast.success("Snippet created");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>{isEdit ? "Edit snippet" : "New snippet"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label htmlFor="sn-name">Name</Label>
              <Input id="sn-name" {...form.register("name")} />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label>Language</Label>
              <Select value={form.watch("language")} onValueChange={(v) => form.setValue("language", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="sn-desc">Description</Label>
            <Input id="sn-desc" {...form.register("description")} />
          </div>
          <div>
            <Label htmlFor="sn-content">Content</Label>
            <Textarea id="sn-content" rows={8} className="font-mono text-xs" {...form.register("content")} />
            {form.formState.errors.content && (
              <p className="mt-1 text-xs text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sn-tags">Tags (comma-separated)</Label>
            <Input id="sn-tags" {...form.register("tags")} placeholder="prompt, lovable" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{isEdit ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
