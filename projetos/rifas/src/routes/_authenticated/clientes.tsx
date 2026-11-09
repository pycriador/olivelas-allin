import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Eye, Edit2, Plus, Search, Trash2, UserCheck, Phone, Mail, MapPin } from "lucide-react";

import { PageHeader } from "@/components/common/page-header";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CustomerCard } from "@/features/customers/components/customer-card";
import { CustomerHistory } from "@/features/customers/components/customer-history";
import { usePermissions } from "@/hooks/use-permissions";
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from "@/features/customers/hooks/use-customers";
import type { Customer } from "@/types/customer";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes (CRM) — RaffleHub" },
      { name: "description", content: "Gestão completa de clientes e compradores no RaffleHub." },
    ],
  }),
  component: ClientesPage,
});

function ClientesPage() {
  const { can } = usePermissions();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 10;

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);
  const [viewTarget, setViewTarget] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const { data, isLoading, isError, refetch } = useCustomers({ page, pageSize, search });
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const deleteMutation = useDeleteCustomer();

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "full_name",
      header: "Cliente",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted font-medium text-xs">
            {row.full_name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{row.full_name}</p>
            {row.city ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" />
                {row.city}
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      id: "phone",
      header: "Telefone",
      cell: (row) => (
        <span className="text-xs font-mono flex items-center gap-1">
          <Phone className="size-3 text-muted-foreground" />
          {row.phone}
        </span>
      ),
    },
    {
      id: "email",
      header: "E-mail",
      cell: (row) =>
        row.email ? (
          <span className="text-xs text-muted-foreground flex items-center gap-1 truncate max-w-40">
            <Mail className="size-3" />
            {row.email}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: "created_at",
      header: "Cadastrado em",
      cell: (row) => <span className="text-xs">{formatDate(row.created_at)}</span>,
    },
    {
      id: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Ver histórico de ${row.full_name}`}
            onClick={() => setViewTarget(row)}
          >
            <Eye className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar ${row.full_name}`}
            onClick={() => setEditTarget(row)}
            disabled={!can("customers.edit")}
          >
            <Edit2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            aria-label={`Excluir ${row.full_name}`}
            onClick={() => setDeleteTarget(row)}
            disabled={!can("customers.delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PermissionGuard permission="customers.view">
      <div className="space-y-6">
        <PageHeader
          title="Clientes (CRM)"
          description="Consulte compradores, histórico de compras e cadastre novos clientes."
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Novo cliente
            </Button>
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          page={page}
          pageSize={pageSize}
          total={data?.total ?? 0}
          onPageChange={setPage}
          emptyTitle="Nenhum cliente encontrado"
          emptyDescription="Cadastre um novo cliente ou ajuste os termos de busca."
          caption="Lista de clientes"
        />

        {/* Modal Criar Cliente */}
        <CustomerFormModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          title="Novo cliente"
          isPending={createMutation.isPending}
          onSubmit={(values) => {
            createMutation.mutate(values, {
              onSuccess: () => {
                toast.success("Cliente cadastrado com sucesso!");
                setCreateOpen(false);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
        />

        {/* Modal Editar Cliente */}
        {editTarget ? (
          <CustomerFormModal
            open={Boolean(editTarget)}
            onOpenChange={(open) => !open && setEditTarget(null)}
            title="Editar cliente"
            initialValues={editTarget}
            isPending={updateMutation.isPending}
            onSubmit={(values) => {
              updateMutation.mutate(
                { customerId: editTarget.id, data: values },
                {
                  onSuccess: () => {
                    toast.success("Cliente atualizado com sucesso!");
                    setEditTarget(null);
                  },
                  onError: (err) => toast.error(err.message),
                },
              );
            }}
          />
        ) : null}

        {/* Modal Detalhes / Histórico do Cliente */}
        {viewTarget ? (
          <Dialog open={Boolean(viewTarget)} onOpenChange={(open) => !open && setViewTarget(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="size-5" />
                  Ficha do cliente
                </DialogTitle>
                <DialogDescription>{viewTarget.full_name}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <CustomerCard customer={viewTarget} />

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold">Histórico de Pedidos</h3>
                  <CustomerHistory customerId={viewTarget.id} />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : null}

        {/* Modal Confirmar Exclusão */}
        <ConfirmDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Excluir cliente"
          description={`Tem certeza que deseja excluir "${deleteTarget?.full_name}"? Esta ação realiza soft-delete e preserva o histórico de pedidos.`}
          confirmLabel="Excluir"
          onConfirm={() => {
            if (!deleteTarget) return;
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => {
                toast.success("Cliente removido com sucesso!");
                setDeleteTarget(null);
              },
              onError: (err) => toast.error(err.message),
            });
          }}
        />
      </div>
    </PermissionGuard>
  );
}

interface CustomerFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initialValues?: Partial<Customer>;
  isPending: boolean;
  onSubmit: (values: {
    full_name: string;
    phone: string;
    email?: string | undefined;
    city?: string | undefined;
    notes?: string | undefined;
  }) => void;
}

function CustomerFormModal({
  open,
  onOpenChange,
  title,
  initialValues,
  isPending,
  onSubmit,
}: CustomerFormModalProps) {
  const [fullName, setFullName] = useState(initialValues?.full_name ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              full_name: fullName,
              phone,
              ...(email ? { email } : {}),
              ...(city ? { city } : {}),
              ...(notes ? { notes } : {}),
            });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="cust-name">Nome completo *</Label>
            <Input
              id="cust-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: João da Silva"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-phone">Telefone (WhatsApp) *</Label>
            <Input
              id="cust-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-email">E-mail</Label>
            <Input
              id="cust-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-city">Cidade</Label>
            <Input
              id="cust-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="São Paulo - SP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cust-notes">Observações</Label>
            <Textarea
              id="cust-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações internas sobre o cliente..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar cliente"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
