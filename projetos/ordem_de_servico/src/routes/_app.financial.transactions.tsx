import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "@/core/i18n/I18nProvider";
import { financialService } from "@/modules/financial/service";
import type { FinancialTransaction } from "@/modules/financial/types";

export const Route = createFileRoute("/_app/financial/transactions")({
  head: () => ({ meta: [{ title: "Transactions — ServiceForge" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);

  useEffect(() => { financialService.listTransactions().then(setTransactions); }, []);

  const typeColors: Record<string, string> = { income: "bg-green-100 text-green-700", expense: "bg-red-100 text-red-700", transfer: "bg-blue-100 text-blue-700", adjustment: "bg-amber-100 text-amber-700" };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("fin.transactions.title")}</h2>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3">{t("fin.transactions.type")}</th>
              <th className="text-left p-3">{t("fin.transactions.description")}</th>
              <th className="text-left p-3">{t("fin.transactions.category")}</th>
              <th className="text-left p-3">{t("fin.transactions.value")}</th>
              <th className="text-left p-3">{t("fin.transactions.account")}</th>
              <th className="text-left p-3">{t("fin.transactions.date")}</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t">
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[tx.type] || ""}`}>
                    {t(`fin.transactions.type.${tx.type}` as any)}
                  </span>
                </td>
                <td className="p-3">{tx.description}</td>
                <td className="p-3 text-muted-foreground">{tx.category}</td>
                <td className="p-3 font-semibold">R$ {tx.value.toFixed(2)}</td>
                <td className="p-3 text-xs">{tx.financialAccountName}</td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(tx.transactionDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
