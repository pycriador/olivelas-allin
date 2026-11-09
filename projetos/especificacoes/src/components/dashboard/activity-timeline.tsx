import { formatDistanceToNow } from "date-fns";
import { Activity } from "lucide-react";
import { useActivities } from "@/hooks/data";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";

export function ActivityTimeline() {
  const { data, isLoading } = useActivities();

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Recent activity</h3>
      </div>
      {isLoading ? (
        <ListSkeleton rows={5} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No activity yet" description="Actions will appear here as you work." />
      ) : (
        <ol className="relative space-y-4 border-l border-border/70 pl-4">
          {data.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-background" />
              <p className="text-sm text-foreground">{a.summary}</p>
              <p className="text-[11px] text-muted-foreground">
                {formatDistanceToNow(a.at, { addSuffix: true })} · {a.actor}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
