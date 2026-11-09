import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Save, Star, Trash2, History } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VersionHistory } from "@/components/specs/version-history";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useSpec, useSpecDocument, useSaveDocument, useToggleFavorite, useSoftDelete, useUpdateSpec } from "@/hooks/data";
import { BlockEditor } from "@/components/specs/block-editor";
import { ListSkeleton } from "@/components/common/skeletons";
import type { Block } from "@/types/domain";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/specs/$specId")({
  component: SpecDetailPage,
});

function SpecDetailPage() {
  const { specId } = Route.useParams();
  const navigate = useNavigate();
  const spec = useSpec(specId);
  const doc = useSpecDocument(specId);
  const save = useSaveDocument();
  const toggleFav = useToggleFavorite();
  const trash = useSoftDelete();
  const updateSpec = useUpdateSpec();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [title, setTitle] = useState("");
  const [dirty, setDirty] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (doc.data) setBlocks(doc.data.blocks);
  }, [doc.data]);
  useEffect(() => {
    if (spec.data) setTitle(spec.data.title);
  }, [spec.data]);

  if (spec.isLoading || doc.isLoading) {
    return <div className="mx-auto max-w-4xl p-6"><ListSkeleton rows={6} /></div>;
  }
  if (!spec.data) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-sm text-muted-foreground">Specification not found.</p>
        <Link to="/" className="text-sm text-primary underline">Back to dashboard</Link>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await save.mutateAsync({ specId, blocks });
      if (title !== spec.data!.title) {
        await updateSpec.mutateAsync({ id: specId, patch: { title } });
      }
      setDirty(false);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const handleDelete = async () => {
    await trash.mutateAsync(specId);
    toast.success("Moved to trash");
    navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => toggleFav.mutate(specId)} aria-label="Favorite">
            <Star className={cn("h-4 w-4", spec.data.favorite && "fill-yellow-400 text-yellow-500")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button onClick={handleSave} disabled={save.isPending} className="gap-1">
            <Save className="h-4 w-4" /> Save{dirty && " *"}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
          className="h-auto border-none px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
        />
        {spec.data.description && (
          <p className="text-sm text-muted-foreground">{spec.data.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] uppercase">{spec.data.type}</Badge>
          <Badge variant="outline" className="text-[10px] uppercase">{spec.data.status}</Badge>
          <Badge variant="outline" className="text-[10px]">v{spec.data.version}</Badge>
          {spec.data.tags.map((t) => (
            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
          ))}
        </div>
      </div>

      <Tabs defaultValue="editor">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="versions" className="gap-1">
            <History className="h-3.5 w-3.5" /> Versions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="editor" className="mt-4">
          <BlockEditor value={blocks} onChange={(b) => { setBlocks(b); setDirty(true); }} />
        </TabsContent>
        <TabsContent value="versions" className="mt-4">
          <VersionHistory specId={specId} />
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move spec to trash?</AlertDialogTitle>
            <AlertDialogDescription>You can restore it later from the Trash page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
