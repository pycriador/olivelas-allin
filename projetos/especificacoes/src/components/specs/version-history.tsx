import { useMemo, useState } from "react";
import { toast } from "sonner";
import { History, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSpecVersions, useRestoreVersion } from "@/hooks/iam";
import { blocksToText, diffLines } from "@/services/version.service";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { cn } from "@/lib/utils";

export function VersionHistory({ specId }: { specId: string }) {
  const versions = useSpecVersions(specId);
  const restore = useRestoreVersion();
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);

  const list = versions.data ?? [];
  const left = list.find((v) => v.id === leftId) ?? list[1];
  const right = list.find((v) => v.id === rightId) ?? list[0];

  const diff = useMemo(() => {
    if (!left || !right) return [];
    return diffLines(blocksToText(left.blocks), blocksToText(right.blocks));
  }, [left, right]);

  if (versions.isLoading) return <ListSkeleton rows={4} />;
  if (list.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="No versions yet"
        description="Every save creates a snapshot you can compare and restore."
      />
    );
  }

  const stats = {
    added: diff.filter((d) => d.type === "added").length,
    removed: diff.filter((d) => d.type === "removed").length,
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-1">
        {list.map((v) => (
          <div
            key={v.id}
            className={cn(
              "rounded-md border border-border p-3 text-sm",
              (left?.id === v.id || right?.id === v.id) && "border-primary bg-primary/5",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium">v{v.version}</span>
              <Badge variant="outline" className="text-[10px]">{new Date(v.createdAt).toLocaleDateString()}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{v.authorName}</p>
            {v.comment && <p className="mt-1 text-xs text-muted-foreground">{v.comment}</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setLeftId(v.id)}>Base</Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRightId(v.id)}>Compare</Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 gap-1 px-2 text-xs"
                disabled={restore.isPending}
                onClick={() =>
                  restore.mutate(v.id, {
                    onSuccess: () => toast.success(`Restored v${v.version}`),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "Restore failed"),
                  })
                }
              >
                <RotateCcw className="h-3 w-3" /> Restore
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            Comparing v{left?.version ?? "—"} → v{right?.version ?? "—"}
          </span>
          <span>
            <span className="text-emerald-500">+{stats.added}</span>{" "}
            <span className="text-destructive">-{stats.removed}</span>
          </span>
        </div>
        <div className="max-h-[520px] overflow-auto font-mono text-xs">
          {diff.length === 0 && <p className="p-4 text-muted-foreground">Select two versions to compare.</p>}
          {diff.map((d, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 px-3 py-0.5",
                d.type === "added" && "bg-emerald-500/10",
                d.type === "removed" && "bg-destructive/10",
              )}
            >
              <span className="w-10 shrink-0 text-right text-muted-foreground">{d.leftNo ?? ""}</span>
              <span className="w-10 shrink-0 text-right text-muted-foreground">{d.rightNo ?? ""}</span>
              <span className="w-3 shrink-0">{d.type === "added" ? "+" : d.type === "removed" ? "-" : " "}</span>
              <span className="whitespace-pre-wrap break-all">{d.right ?? d.left}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
