import { Construction } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-8">
      <PageHeader title={title} description={description} />
      <EmptyState
        icon={Construction}
        title="Em desenvolvimento"
        description="Este módulo será entregue em uma das próximas sprints do RaffleHub."
      />
    </div>
  );
}
