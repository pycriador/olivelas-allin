import { Link } from "@tanstack/react-router";
import { Folder } from "lucide-react";
import { useProjects } from "@/hooks/data";
import { ListSkeleton } from "@/components/common/skeletons";
import { EmptyState } from "@/components/common/empty-state";

export function RecentProjects() {
  const { data, isLoading } = useProjects();
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Recent projects</h3>
      </div>
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="No projects" />
      ) : (
        <ul className="divide-y divide-border/60">
          {data.map((p) => (
            <li key={p.id}>
              <Link
                to="/projects/$projectId"
                params={{ projectId: p.id }}
                className="flex items-center gap-3 py-2.5 text-sm hover:text-primary"
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md text-white"
                  style={{ backgroundColor: p.color ?? "var(--color-primary)" }}
                >
                  <Folder className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-foreground">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.description}</div>
                </div>
                <span className="text-[10px] uppercase text-muted-foreground">{p.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
