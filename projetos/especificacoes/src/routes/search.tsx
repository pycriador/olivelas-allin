import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { useNavigate } from "@tanstack/react-router";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { useSpecs, useProjects, useTags } from "@/hooks/data";
import { specsByProject } from "@/services/project.service";
import { SpecList } from "@/components/specs/spec-list";
import { SpecType, SpecStatus } from "@/types/domain";
import { useQuery } from "@tanstack/react-query";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  status: fallback(z.string(), "").default(""),
  tag: fallback(z.string(), "").default(""),
  project: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/search")({
  validateSearch: zodValidator(searchSchema),
  component: SearchPage,
});

function SearchPage() {
  const { q, type, status, tag, project } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const { data: specs = [], isLoading } = useSpecs();
  const { data: projects = [] } = useProjects();
  const { data: tags = [] } = useTags();

  const projectSpecs = useQuery({
    queryKey: ["searchProjectSpecs", project],
    queryFn: async () => (project ? (await specsByProject(project)).specs : []),
    enabled: !!project,
  });

  const filtered = useMemo(() => {
    let list = specs;
    if (project) {
      const ids = new Set((projectSpecs.data ?? []).map((s) => s.id));
      list = list.filter((s) => ids.has(s.id));
    }
    if (type) list = list.filter((s) => s.type === type);
    if (status) list = list.filter((s) => s.status === status);
    if (tag) list = list.filter((s) => s.tags.includes(tag));
    if (q.trim()) {
      const term = q.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(term) ||
          s.description?.toLowerCase().includes(term) ||
          s.type.toLowerCase().includes(term) ||
          s.tags.some((t) => t.toLowerCase().includes(term)),
      );
    }
    return list;
  }, [specs, projectSpecs.data, q, type, status, tag, project]);

  const update = (patch: Partial<{ q: string; type: string; status: string; tag: string; project: string }>) =>
    navigate({ search: (prev: Record<string, string>) => ({ ...prev, ...patch }) });

  const hasFilters = q || type || status || tag || project;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Search</h1>
        <p className="text-sm text-muted-foreground">Filter specifications by title, tag, type, status or project.</p>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Type to search…"
          value={q}
          onChange={(e) => update({ q: e.target.value })}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={type || "__all"} onValueChange={(v) => update({ type: v === "__all" ? "" : v })}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All types</SelectItem>
              {Object.values(SpecType).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status || "__all"} onValueChange={(v) => update({ status: v === "__all" ? "" : v })}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All statuses</SelectItem>
              {Object.values(SpecStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tag || "__all"} onValueChange={(v) => update({ tag: v === "__all" ? "" : v })}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Tag" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All tags</SelectItem>
              {tags.map((t) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={project || "__all"} onValueChange={(v) => update({ project: v === "__all" ? "" : v })}>
            <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Project" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all">All projects</SelectItem>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs" onClick={() => navigate({ search: { q: "", type: "", status: "", tag: "", project: "" } })}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {filtered.length} result{filtered.length === 1 ? "" : "s"}
          {(type || status || tag || project) && (
            <span className="ml-2 inline-flex flex-wrap gap-1">
              {type && <Badge variant="outline" className="text-[10px]">type: {type}</Badge>}
              {status && <Badge variant="outline" className="text-[10px]">status: {status}</Badge>}
              {tag && <Badge variant="outline" className="text-[10px]">tag: {tag}</Badge>}
              {project && <Badge variant="outline" className="text-[10px]">project: {projects.find((p) => p.id === project)?.name}</Badge>}
            </span>
          )}
        </div>
      </div>

      <SpecList specs={filtered} isLoading={isLoading} emptyTitle="No matches" />
    </div>
  );
}
