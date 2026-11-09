import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { useRecentSpecs, useToggleFavorite } from "@/hooks/data";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function RecentSpecs() {
  const { data, isLoading } = useRecentSpecs(8);
  const toggle = useToggleFavorite();

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recently updated</h3>
        <Link to="/projects" className="text-xs text-muted-foreground hover:text-foreground">
          View all
        </Link>
      </div>
      {isLoading ? (
        <ListSkeleton rows={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No specifications yet" />
      ) : (
        <ul className="divide-y divide-border/60">
          {data.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-2.5">
              <button
                onClick={() => toggle.mutate(s.id)}
                className="text-muted-foreground hover:text-yellow-500"
                aria-label="Toggle favorite"
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    s.favorite && "fill-yellow-400 text-yellow-500",
                  )}
                />
              </button>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{s.title}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {formatDistanceToNow(s.updatedAt, { addSuffix: true })}
                </div>
              </div>
              <Badge variant="secondary" className="text-[10px] uppercase">
                {s.type}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
