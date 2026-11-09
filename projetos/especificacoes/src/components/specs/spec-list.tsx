import { Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { ListSkeleton } from "@/components/common/skeletons";
import { useToggleFavorite } from "@/hooks/data";
import { cn } from "@/lib/utils";
import type { Specification } from "@/types/domain";
import { formatDistanceToNow } from "date-fns";

interface SpecListProps {
  specs: Specification[] | undefined;
  isLoading?: boolean;
  emptyTitle?: string;
}

export function SpecList({ specs, isLoading, emptyTitle = "No specifications" }: SpecListProps) {
  const toggle = useToggleFavorite();
  if (isLoading) return <ListSkeleton rows={8} />;
  if (!specs || specs.length === 0) return <EmptyState title={emptyTitle} />;

  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
          <tr>
            <th className="w-10 p-3"></th>
            <th className="p-3 text-left font-medium">Title</th>
            <th className="p-3 text-left font-medium">Type</th>
            <th className="p-3 text-left font-medium">Status</th>
            <th className="p-3 text-left font-medium">Tags</th>
            <th className="p-3 text-left font-medium">Updated</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {specs.map((s) => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="p-3">
                <button
                  onClick={() => toggle.mutate(s.id)}
                  className="text-muted-foreground hover:text-yellow-500"
                >
                  <Star className={cn("h-4 w-4", s.favorite && "fill-yellow-400 text-yellow-500")} />
                </button>
              </td>
              <td className="p-3 font-medium text-foreground">
                <Link to="/specs/$specId" params={{ specId: s.id }} className="hover:text-primary hover:underline">
                  {s.title}
                </Link>
              </td>
              <td className="p-3">
                <Badge variant="outline" className="text-[10px] uppercase">
                  {s.type}
                </Badge>
              </td>
              <td className="p-3 text-xs text-muted-foreground">{s.status}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-1">
                  {s.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {formatDistanceToNow(s.updatedAt, { addSuffix: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
