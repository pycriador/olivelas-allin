import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Library, Plus, Copy, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { SnippetDialog } from "@/components/dialogs/snippet-dialog";
import { useSnippets, useDeleteSnippet } from "@/hooks/data";
import type { Snippet } from "@/types/domain";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
});

function LibraryPage() {
  const { data, isLoading } = useSnippets();
  const del = useDeleteSnippet();
  const [q, setQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Snippet | undefined>(undefined);

  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!q.trim()) return list;
    const term = q.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.description?.toLowerCase().includes(term) ||
        s.language.toLowerCase().includes(term) ||
        s.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [data, q]);

  const openNew = () => { setEditing(undefined); setDialogOpen(true); };
  const openEdit = (s: Snippet) => { setEditing(s); setDialogOpen(true); };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Library</h1>
          <p className="text-sm text-muted-foreground">Reusable snippets, prompts and code fragments.</p>
        </div>
        <Button onClick={openNew} className="gap-1"><Plus className="h-4 w-4" /> New snippet</Button>
      </div>

      <Input placeholder="Search snippets…" value={q} onChange={(e) => setQ(e.target.value)} />

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !filtered.length ? (
        <EmptyState
          icon={<Library className="h-6 w-6" />}
          title={q ? "No matches" : "No snippets yet"}
          description={q ? "Try a different search term." : "Create your first snippet to build the library."}
          action={!q ? <Button onClick={openNew}><Plus className="mr-1 h-4 w-4" />New snippet</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-col rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground">{s.name}</div>
                  <div className="line-clamp-1 text-xs text-muted-foreground">{s.description}</div>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase">{s.language}</Badge>
              </div>
              <pre className="mt-3 max-h-32 overflow-hidden rounded-md border border-border/60 bg-muted/40 p-2 text-[11px]">
                <code className="line-clamp-6">{s.content}</code>
              </pre>
              <div className="mt-3 flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{t}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Updated {formatDistanceToNow(s.updatedAt, { addSuffix: true })}</span>
                <div className="flex items-center gap-0.5">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                    navigator.clipboard.writeText(s.content).then(() => toast.success("Copied"));
                  }} aria-label="Copy">
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEdit(s)} aria-label="Edit">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => del.mutate(s.id)} aria-label="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SnippetDialog open={dialogOpen} onOpenChange={setDialogOpen} snippet={editing} />
    </div>
  );
}
