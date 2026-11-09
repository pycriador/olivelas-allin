import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaymentStatusBadge } from "./PaymentStatusBadge";
import { PAYMENT_GATEWAY_PROVIDER_LABEL, PAYMENT_METHOD_ONLINE_LABEL, formatDateTime, formatMoney } from "@/services/types";
import type { Payment } from "@/services/types";

interface PaymentHistoryTableProps {
  payments: Payment[];
  currency?: string;
}

export function PaymentHistoryTable({ payments, currency = "BRL" }: PaymentHistoryTableProps) {
  if (payments.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Nenhum pagamento registrado.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Comprador</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Gateway</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.buyer_name ?? "—"}</TableCell>
              <TableCell>{PAYMENT_METHOD_ONLINE_LABEL[p.method]}</TableCell>
              <TableCell>{PAYMENT_GATEWAY_PROVIDER_LABEL[p.provider]}</TableCell>
              <TableCell>{formatMoney(p.amount, currency)}</TableCell>
              <TableCell><PaymentStatusBadge status={p.status} /></TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDateTime(p.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
