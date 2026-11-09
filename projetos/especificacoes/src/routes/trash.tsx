import { createFileRoute } from "@tanstack/react-router";
import { useTrashed } from "@/hooks/data";
import { SpecList } from "@/components/specs/spec-list";

export const Route = createFileRoute("/trash")({
  component: TrashPage,
});

function TrashPage() {
  const { data, isLoading } = useTrashed();
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground">
          Deleted specifications. Restore or purge from here.
        </p>
      </div>
      <SpecList specs={data} isLoading={isLoading} emptyTitle="Trash is empty" />
    </div>
  );
}
