import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertCircle, UserPlus, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  useCreateCustomer,
  useUpdateCustomer,
  useFindByPhone,
} from "@/features/customers/hooks/use-customers";
import { useDebounce } from "@/hooks/use-debounce";
import type { Customer } from "@/types/customer";

export interface QuickCustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues: Partial<Customer>;
  onSave: (customer: Customer) => void;
  onUseExisting?: (customer: Customer) => void;
}

export function QuickCustomerForm({
  open,
  onOpenChange,
  mode,
  initialValues,
  onSave,
  onUseExisting,
}: QuickCustomerFormProps) {
  const [name, setName] = useState(initialValues?.full_name ?? "");
  const [phone, setPhone] = useState(initialValues?.phone ?? "");
  const [email, setEmail] = useState(initialValues?.email ?? "");
  const [city, setCity] = useState(initialValues?.city ?? "");
  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const debouncedPhone = useDebounce(phone, 500);
  const duplicateQuery = useFindByPhone(debouncedPhone);
  const duplicate =
    duplicateQuery.data && (!initialValues?.id || duplicateQuery.data.id !== initialValues.id)
      ? duplicateQuery.data
      : null;

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.full_name ?? "");
    setPhone(initialValues?.phone ?? "");
    setEmail(initialValues?.email ?? "");
    setCity(initialValues?.city ?? "");
    setNotes(initialValues?.notes ?? "");
  }, [open, initialValues]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (duplicate && onUseExisting) {
      onUseExisting(duplicate);
      return;
    }
    if (mode === "create") {
      createMutation.mutate(
        {
          full_name: name,
          phone,
          email: email || undefined,
          city: city || undefined,
          notes: notes || undefined,
        },
        {
          onSuccess: (created) => {
            toast.success("Cliente criado");
            onSave(created);
          },
          onError: (error) => toast.error(error.message),
        },
      );
    } else if (initialValues?.id) {
      updateMutation.mutate(
        {
          customerId: initialValues.id,
          data: {
            full_name: name,
            phone,
            email: email || undefined,
            city: city || undefined,
            notes: notes || undefined,
          },
        },
        {
          onSuccess: (updated) => {
            toast.success("Cliente atualizado");
            onSave(updated);
          },
          onError: (error) => toast.error(error.message),
        },
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <UserPlus aria-hidden="true" className="size-5" />
            ) : (
              <Pencil aria-hidden="true" className="size-5" />
            )}
            {mode === "create" ? "Novo cliente" : "Editar cliente"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Preencha os dados do comprador para prosseguir com a venda."
              : "Atualize os dados cadastrais do cliente."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="qcf-name">Nome completo *</Label>
            <Input
              id="qcf-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Maria Silva"
              required
              minLength={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qcf-phone">Telefone (com DDD) *</Label>
            <Input
              id="qcf-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="(11) 99999-9999"
              required
              minLength={8}
            />
          </div>

          {duplicate ? (
            <div className="space-y-2">
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>
                  Este telefone já está cadastrado para <strong>{duplicate.full_name}</strong>.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2">
                {onUseExisting ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onUseExisting(duplicate)}
                  >
                    Selecionar {duplicate.full_name}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="qcf-email">E-mail</Label>
            <Input
              id="qcf-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="maria@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qcf-city">Cidade</Label>
            <Input
              id="qcf-city"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="São Paulo - SP"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qcf-notes">Observações</Label>
            <Textarea
              id="qcf-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anotações internas..."
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Criando..."
                : "Salvando..."
              : mode === "create"
                ? "Criar cliente"
                : "Salvar alterações"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
