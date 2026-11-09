import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { FinancialAccount } from "@/modules/financial/types";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/_app/financial/accounts")({
  head: () => ({ meta: [{ title: "Financial Accounts — ServiceForge" }] }),
  component: AccountsPage,
});

function AccountsPage() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "checking" as const, bank: "", agency: "", accountNumber: "", initialBalance: 0, active: true });

  useEffect(() => { financialService.listAccounts().then(setAccounts); }, []);

  async function handleCreate() {
    await financialService.createAccount({ ...form, currentBalance: form.initialBalance });
    setShowNew(false);
    setForm({ name: "", code: "", type: "checking", bank: "", agency: "", accountNumber: "", initialBalance: 0, active: true });
    setAccounts(await financialService.listAccounts());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t("fin.accounts.title")}</h2>
        <button onClick={() => setShowNew(!showNew)} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm">
          <Plus className="w-4 h-4" /> {t("fin.accounts.new")}
        </button>
      </div>

      {showNew && (
        <div className="border rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("fin.accounts.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("fin.accounts.code")} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("fin.accounts.bank")} value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
          <input className="border rounded px-3 py-1.5 text-sm" placeholder={t("fin.accounts.initialBalance")} type="number" value={form.initialBalance} onChange={(e) => setForm({ ...form, initialBalance: Number(e.target.value) })} />
          <button onClick={handleCreate} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm w-fit">{t("common.save")}</button>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("fin.accounts.name")}</th>
              <th className="text-left p-3">{t("fin.accounts.code")}</th>
              <th className="text-left p-3">{t("fin.accounts.type")}</th>
              <th className="text-left p-3">{t("fin.accounts.bank")}</th>
              <th className="text-left p-3">{t("fin.accounts.initialBalance")}</th>
              <th className="text-left p-3">{t("fin.accounts.currentBalance")}</th>
              <th className="text-left p-3">{t("fin.accounts.active")}</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="p-3 font-medium">{a.name}</td>
                <td className="p-3 font-mono text-xs">{a.code}</td>
                <td className="p-3">{t(`fin.accounts.type.${a.type}`)}</td>
                <td className="p-3">{a.bank || "-"}</td>
                <td className="p-3">R$ {Number(a.initialBalance ?? 0).toFixed(2)}</td>
                <td className="p-3 font-semibold">R$ {Number(a.currentBalance ?? 0).toFixed(2)}</td>
                <td className="p-3">{a.active ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
