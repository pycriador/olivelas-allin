import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { promptManager } from "@/modules/ai/prompt-manager";
import { PROMPT_LIBRARY } from "@/modules/ai/prompt-library";
import type { Prompt, PromptCategory, PromptStatus } from "@/modules/ai/types";
import { Plus, BookOpen, Archive, Copy, Send, Search } from "lucide-react";

export const Route = createFileRoute("/_app/ai/prompts")({
  head: () => ({ meta: [{ title: "Prompt Library — ServiceForge" }] }),
  component: AIPromptsPage,
});

const CATEGORIES: PromptCategory[] = ["ocr", "service-order", "customer", "device", "financial", "document", "communication", "summary", "classification", "extraction", "validation"];

function AIPromptsPage() {
  const { t } = useTranslation();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [filter, setFilter] = useState<PromptCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<PromptStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Prompt | null>(null);

  useEffect(() => { load(); }, [filter, statusFilter]);

  async function load() {
    const all = await promptManager.list(filter === "all" ? undefined : filter, statusFilter === "all" ? undefined : statusFilter);
    setPrompts(all);
  }

  const filtered = prompts.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()));

  async function handleDuplicate(id: string) {
    await promptManager.duplicate(id);
    load();
  }

  async function handlePublish(id: string) {
    await promptManager.publish(id);
    load();
  }

  async function handleArchive(id: string) {
    const p = await promptManager.get(id);
    if (p?.status === "archived") await promptManager.restore(id);
    else await promptManager.archive(id);
    load();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 border rounded px-2 py-1">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input className="text-sm outline-none w-48" placeholder={t("common.search")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="border rounded px-2 py-1 text-sm" value={filter} onChange={(e) => setFilter(e.target.value as PromptCategory | "all")}>
          <option value="all">{t("common.all") || "All"}</option>
          {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{t(`ai.category.${cat}`)}</option>))}
        </select>
        <select className="border rounded px-2 py-1 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PromptStatus | "all")}>
          <option value="all">{t("common.all") || "All"} Status</option>
          <option value="draft">{t("ai.prompts.draft")}</option>
          <option value="published">{t("ai.prompts.published")}</option>
          <option value="archived">{t("ai.prompts.archived")}</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">{t("ai.prompts.name")}</th>
                <th className="text-left p-2">{t("ai.prompts.category")}</th>
                <th className="text-left p-2">{t("ai.prompts.status")}</th>
                <th className="text-left p-2">{t("ai.prompts.version")}</th>
                <th className="text-left p-2">{t("common.actions") || "Actions"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t cursor-pointer hover:bg-muted/50" onClick={() => setSelected(selected?.id === p.id ? null : p)}>
                  <td className="p-2 font-medium">{p.name}</td>
                  <td className="p-2">{t(`ai.category.${p.category}`)}</td>
                  <td className="p-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.status === "published" ? "bg-green-100 text-green-700" : p.status === "archived" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"}`}>
                      {t(`ai.prompts.${p.status}`)}
                    </span>
                  </td>
                  <td className="p-2">v{p.version}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); handleDuplicate(p.id); }} title={t("ai.prompts.duplicate")}><Copy className="w-3.5 h-3.5" /></button>
                      {p.status !== "published" && <button onClick={(e) => { e.stopPropagation(); handlePublish(p.id); }} title={t("ai.prompts.publish")}><Send className="w-3.5 h-3.5" /></button>}
                      <button onClick={(e) => { e.stopPropagation(); handleArchive(p.id); }} title={p.status === "archived" ? t("ai.prompts.restore") : t("ai.prompts.archive")}><Archive className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h3 className="font-semibold">{selected.name}</h3>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <div className="flex gap-2 text-xs">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{t(`ai.category.${selected.category}`)}</span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">v{selected.version}</span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">T: {selected.temperature}</span>
            </div>
            <div className="border rounded p-3 bg-muted/30">
              <pre className="text-xs whitespace-pre-wrap">{selected.template}</pre>
            </div>
            {selected.variables.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">{t("ai.prompts.variables")}</p>
                <div className="flex flex-wrap gap-1">
                  {selected.variables.map((v, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">{v.name}{v.required ? "*" : ""}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-1">
              {selected.tags.map((tag) => (
                <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
