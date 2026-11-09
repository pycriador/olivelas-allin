import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchService } from "@/services/search.service";

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const { data = [], isFetching } = useQuery({
    queryKey: ["search", term],
    queryFn: () => searchService.search(term),
    enabled: open && term.trim().length >= 2,
    staleTime: 10_000,
  });

  const users = data.filter((item) => item.entity === "user");
  const files = data.filter((item) => item.entity === "file");

  const go = (href: string) => {
    setOpen(false);
    setTerm("");
    void navigate({ to: href });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="hidden h-9 gap-2 px-3 text-muted-foreground md:inline-flex"
        onClick={() => setOpen(true)}
        aria-label="Abrir busca global"
      >
        <Search aria-hidden="true" className="size-4" />
        <span className="text-xs">Buscar…</span>
        <kbd className="ml-2 rounded border border-border px-1 text-[10px]">⌘K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir busca global"
      >
        <Search aria-hidden="true" className="size-4" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Buscar usuários e arquivos…"
          value={term}
          onValueChange={setTerm}
        />
        <CommandList>
          <CommandEmpty>
            {term.trim().length < 2
              ? "Digite ao menos 2 caracteres."
              : isFetching
                ? "Buscando…"
                : "Nenhum resultado encontrado."}
          </CommandEmpty>
          {users.length > 0 ? (
            <CommandGroup heading="Usuários">
              {users.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`user-${item.id}-${item.title}`}
                  onSelect={() => go(item.href)}
                >
                  <User aria-hidden="true" className="size-4" />
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {files.length > 0 ? (
            <CommandGroup heading="Arquivos">
              {files.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`file-${item.id}-${item.title}`}
                  onSelect={() => go(item.href)}
                >
                  <FileText aria-hidden="true" className="size-4" />
                  <span className="truncate">{item.title}</span>
                  <span className="ml-auto truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </CommandDialog>
    </>
  );
}
