import { useMemo } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useUIStore } from "@/stores/ui.store";
import { useProjects, useSpecs, useTags } from "@/hooks/data";
import { Star, Folder, Hash, FileText, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function GlobalSearch() {
  const open = useUIStore((s) => s.searchOpen);
  const setOpen = useUIStore((s) => s.setSearchOpen);
  const navigate = useNavigate();
  const { data: specs = [] } = useSpecs();
  const { data: projects = [] } = useProjects();
  const { data: tags = [] } = useTags();

  const topSpecs = useMemo(() => specs.slice(0, 8), [specs]);

  const go = (fn: () => void) => { setOpen(false); fn(); };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search specs, projects, tags…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Quick actions">
          <CommandItem onSelect={() => go(() => navigate({ to: "/search" }))}>
            <Search className="mr-2 h-4 w-4" /> Advanced search…
          </CommandItem>
        </CommandGroup>

        {projects.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => go(() => navigate({ to: "/projects/$projectId", params: { projectId: p.id } }))}
                >
                  <Folder className="mr-2 h-4 w-4" style={{ color: p.color }} />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {topSpecs.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Specifications">
              {topSpecs.map((s) => (
                <CommandItem
                  key={s.id}
                  onSelect={() => go(() => navigate({ to: "/specs/$specId", params: { specId: s.id } }))}
                >
                  {s.favorite ? (
                    <Star className="mr-2 h-4 w-4 text-yellow-500" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  <span className="truncate">{s.title}</span>
                  <span className="ml-auto text-[10px] uppercase text-muted-foreground">{s.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {tags.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Tags">
              {tags.map((t) => (
                <CommandItem
                  key={t.id}
                  onSelect={() => go(() => navigate({ to: "/search", search: { q: "", type: "", status: "", tag: t.name, project: "" } }))}
                >
                  <Hash className="mr-2 h-4 w-4" style={{ color: t.color }} />
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
