import { createFileRoute } from "@tanstack/react-router";
import { Folder, FileText, Rocket, Users, BookMarked, RefreshCcw } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityChart, TypeDistribution } from "@/components/dashboard/charts";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { RecentSpecs } from "@/components/dashboard/recent-specs";
import {
  useProjects,
  useSpecs,
  useSprints,
  useTemplates,
  useLastSync,
} from "@/hooks/data";
import { useT } from "@/stores/i18n.store";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const t = useT();
  const projects = useProjects();
  const specs = useSpecs();
  const sprints = useSprints();
  const templates = useTemplates();
  const lastSync = useLastSync();

  const lastSyncLabel = lastSync.data?.value
    ? formatDistanceToNow(Number(lastSync.data.value), { addSuffix: true })
    : "—";

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("cards.projects")} value={projects.data?.length ?? 0} icon={Folder} hint="Active" />
        <StatCard label={t("cards.specs")} value={specs.data?.length ?? 0} icon={FileText} hint="Total" />
        <StatCard label={t("cards.sprints")} value={sprints.data?.length ?? 0} icon={Rocket} hint="Planned & active" />
        <StatCard label={t("cards.users")} value={12} icon={Users} hint="Team members" />
        <StatCard label={t("cards.templates")} value={templates.data?.length ?? 0} icon={BookMarked} hint="Reusable" />
        <StatCard label={t("cards.lastSync")} value={lastSyncLabel} icon={RefreshCcw} hint="Local storage" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div>
          <TypeDistribution />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentSpecs />
        </div>
        <div className="space-y-4">
          <RecentProjects />
        </div>
      </div>

      <ActivityTimeline />
    </div>
  );
}
