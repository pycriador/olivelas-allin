import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { conferenceService } from "@/modules/ai/conference";
import { DocButton } from "@/components/doc-button";
import type { ConferenceSession, ConferenceMapping } from "@/modules/ai/types";
import { TableProperties, CheckCircle2, XCircle, Edit3, EyeOff, Check, Save } from "lucide-react";

export const Route = createFileRoute("/_app/ai/conference")({
  head: () => ({ meta: [{ title: "OCR Conference — ServiceForge" }] }),
  component: AIConferencePage,
});

function AIConferencePage() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ConferenceSession[]>([]);
  const [selected, setSelected] = useState<ConferenceSession | null>(null);
  const [editingMap, setEditingMap] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => { conferenceService.list().then(setSessions); }, []);

  async function handleNew() {
    const session = await conferenceService.createFromOCR(`demo-${Date.now()}`, "OS Demo");
    setSessions(await conferenceService.list());
    setSelected(session);
  }

  async function handleAccept(mappingId: string) {
    if (!selected) return;
    const updated = await conferenceService.acceptField(selected.id, mappingId);
    setSelected(updated);
  }

  async function handleReject(mappingId: string) {
    if (!selected) return;
    const updated = await conferenceService.rejectField(selected.id, mappingId);
    setSelected(updated);
  }

  async function handleEdit(mappingId: string, value: string) {
    if (!selected) return;
    const updated = await conferenceService.editField(selected.id, mappingId, value);
    setSelected(updated);
    setEditingMap(null);
  }

  async function handleIgnore(mappingId: string) {
    if (!selected) return;
    const updated = await conferenceService.ignoreField(selected.id, mappingId);
    setSelected(updated);
  }

  async function handleConfirm() {
    if (!selected) return;
    const updated = await conferenceService.confirm(selected.id);
    setSelected(updated);
    setSessions(await conferenceService.list());
  }

  const statusColor: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    edited: "bg-blue-100 text-blue-700",
    rejected: "bg-red-100 text-red-700",
    ignored: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("ai.conference.title")}</h2>
          <DocButton module="ai" page="conference" />
        <button onClick={handleNew} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <TableProperties className="w-4 h-4" /> {t("ai.ocr.process")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="border rounded-lg overflow-hidden lg:col-span-1">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">{t("ai.source") || "Source"}</th>
                <th className="text-left p-2">{t("ai.ocr.status")}</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id} className="border-t cursor-pointer hover:bg-muted/50" onClick={() => setSelected(s)}>
                  <td className="p-2">{s.sourceName}</td>
                  <td className="p-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === "confirmed" ? "bg-green-100 text-green-700" : s.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                      {t(`ai.status.${s.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selected && (
          <div className="lg:col-span-2 border rounded-lg p-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selected.sourceName}</h3>
              <div className="flex gap-2">
                {selected.status === "reviewing" && (
                  <button onClick={handleConfirm} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-md text-xs">
                    <Check className="w-3 h-3" /> {t("ai.conference.confirm")}
                  </button>
                )}
              </div>
            </div>

            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">{t("ai.conference.ocrFields")}</th>
                    <th className="text-left p-2">{t("ai.ocr.confidence")}</th>
                    <th className="text-left p-2">{t("ai.conference.mappedFields")}</th>
                    <th className="text-left p-2">Valor</th>
                    <th className="text-left p-2">{t("ui") || "Status"}</th>
                    <th className="text-left p-2">{t("common.actions") || "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.mapping.map((m) => (
                    <tr key={m.id} className={`border-t ${m.critical ? "bg-red-50" : ""} ${m.ocrConfidence < 0.6 ? "bg-amber-50" : ""}`}>
                      <td className="p-2 font-medium">{m.ocrField}</td>
                      <td className="p-2">
                        <span className={`text-xs ${m.ocrConfidence >= 0.7 ? "text-green-500" : "text-amber-500"}`}>
                          {(m.ocrConfidence * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{m.mappedField}</td>
                      <td className="p-2">
                        {editingMap === m.id ? (
                          <div className="flex gap-1">
                            <input className="border rounded px-1 py-0.5 text-xs w-24" value={editValue} onChange={(e) => setEditValue(e.target.value)} />
                            <button onClick={() => handleEdit(m.id, editValue)} className="text-xs text-green-500"><Check className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <span className={m.critical && m.ocrConfidence < 0.6 ? "text-red-500 font-medium" : ""}>{m.mappedValue}</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusColor[m.status] || ""}`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <div className="flex gap-1">
                          <button onClick={() => handleAccept(m.id)} title={t("ai.conference.accept")}><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /></button>
                          <button onClick={() => handleReject(m.id)} title={t("ai.conference.reject")}><XCircle className="w-3.5 h-3.5 text-red-500" /></button>
                          <button onClick={() => { setEditingMap(m.id); setEditValue(m.mappedValue); }} title={t("ai.conference.edit")}><Edit3 className="w-3.5 h-3.5 text-blue-500" /></button>
                          <button onClick={() => handleIgnore(m.id)} title={t("ai.conference.ignore")}><EyeOff className="w-3.5 h-3.5 text-gray-400" /></button>
                          {m.critical && <span className="text-xs text-red-500">*{t("ai.conference.critical")}</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{t("ai.fields.total")}: {selected.mapping.length}</span>
              <span>{t("ai.fields.accepted")}: {selected.mapping.filter((m) => m.status === "accepted" || m.status === "edited").length}</span>
              <span>{t("ai.fields.rejected")}: {selected.mapping.filter((m) => m.status === "rejected").length}</span>
              <span>{t("ai.fields.ignored")}: {selected.mapping.filter((m) => m.status === "ignored").length}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
