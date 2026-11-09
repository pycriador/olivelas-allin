import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Check,
  ChevronsUpDown,
  Edit3,
  Mail,
  MapPin,
  Phone,
  UserPlus,
  Users,
  User,
  Zap,
} from "lucide-react";

import { useCustomerSearch } from "@/features/customers/hooks/use-customers";
import { QuickCustomerForm } from "@/features/customers/components/quick-customer-form";
import { CustomerHistoryCard } from "@/features/customers/components/customer-history-card";
import { useDebounce } from "@/hooks/use-debounce";
import type { Customer } from "@/types/customer";

export interface CustomerPickerProps {
  value: Customer | null;
  onSelect: (customer: Customer) => void;
  disabled?: boolean;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function CustomerPicker({ value, onSelect, disabled }: CustomerPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data: customers } = useCustomerSearch(debouncedSearch, open);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [formInitial, setFormInitial] = useState<Partial<Customer> | undefined>();

  function handleSelect(customer: Customer) {
    onSelect(customer);
    setOpen(false);
    setSearch("");
  }

  function openCreateForm(mode: "create", initial?: Partial<Customer>) {
    setFormMode(mode);
    setFormInitial(initial ?? {});
    setFormOpen(true);
  }

  function openEditForm() {
    if (!value) return;
    setFormMode("edit");
    setFormInitial(value);
    setFormOpen(true);
  }

  return (
    <>
      <div className="space-y-2">
        {value ? (
          <div className="rounded-md border bg-card p-3">
            <div className="flex items-start gap-3">
              <Avatar className="size-10">
                <AvatarFallback>{initials(value.full_name) || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{value.full_name}</p>
                {value.phone ? (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Phone aria-hidden="true" className="size-3" />
                    {value.phone}
                  </p>
                ) : null}
                {value.email ? (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Mail aria-hidden="true" className="size-3" />
                    {value.email}
                  </p>
                ) : null}
                {value.city ? (
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <MapPin aria-hidden="true" className="size-3" />
                    {value.city}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-2 py-1 text-xs"
                onClick={openEditForm}
                disabled={disabled}
              >
                <Edit3 aria-hidden="true" className="size-3" />
                Editar
              </Button>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-auto px-2 py-1 text-xs"
                    disabled={disabled}
                  >
                    <Users aria-hidden="true" className="size-3" />
                    Trocar cliente
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Buscar por nome, telefone, e-mail ou cidade..."
                      value={search}
                      onValueChange={setSearch}
                    />
                    <CommandList>
                      <CommandEmpty>
                        <div className="py-6 text-center text-sm">
                          <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setOpen(false);
                              openCreateForm("create", {
                                full_name: search,
                              });
                            }}
                          >
                            <UserPlus aria-hidden="true" />
                            Criar novo cliente
                          </Button>
                        </div>
                      </CommandEmpty>
                      <CommandGroup>
                        {(customers ?? []).map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.id}
                            onSelect={() => handleSelect(customer)}
                            className="flex items-center gap-2 py-2"
                          >
                            <Avatar className="size-8">
                              <AvatarFallback className="text-xs">
                                {initials(customer.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1 text-left">
                              <p className="truncate text-sm font-medium">{customer.full_name}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {customer.phone}
                                {customer.email ? ` · ${customer.email}` : ""}
                              </p>
                            </div>
                            {value?.id === customer.id ? (
                              <Check className="size-4 shrink-0" />
                            ) : null}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    <div className="border-t p-1">
                      <CommandItem
                        value="__create__"
                        onSelect={() => {
                          setOpen(false);
                          openCreateForm("create", { full_name: search });
                        }}
                      >
                        <UserPlus aria-hidden="true" />
                        Criar novo cliente
                      </CommandItem>
                      <CommandItem
                        value="__avulso__"
                        onSelect={() => {
                          setOpen(false);
                          openCreateForm("create", { full_name: search });
                        }}
                      >
                        <Zap aria-hidden="true" />
                        Cliente avulso (apenas nome e telefone)
                      </CommandItem>
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <CustomerHistoryCard customerId={value.id} />
          </div>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                disabled={disabled}
                className="w-full justify-between font-normal"
              >
                <User aria-hidden="true" className="size-4 text-muted-foreground" />
                <span className="flex-1 text-left text-muted-foreground">
                  {search || "Pesquisar cliente..."}
                </span>
                <ChevronsUpDown aria-hidden="true" className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Buscar por nome, telefone, e-mail ou cidade..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="py-6 text-center text-sm">
                      <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setOpen(false);
                          openCreateForm("create", {
                            full_name: search,
                          });
                        }}
                      >
                        <UserPlus aria-hidden="true" />
                        Criar novo cliente
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup>
                    {(customers ?? []).map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.id}
                        onSelect={() => handleSelect(customer)}
                        className="flex items-center gap-2 py-2"
                      >
                        <Avatar className="size-8">
                          <AvatarFallback className="text-xs">
                            {initials(customer.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium">{customer.full_name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {customer.phone}
                            {customer.city ? ` · ${customer.city}` : ""}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
                <div className="border-t p-1">
                  <CommandItem
                    value="__create__"
                    onSelect={() => {
                      setOpen(false);
                      openCreateForm("create", { full_name: search });
                    }}
                  >
                    <UserPlus aria-hidden="true" />+ Novo cliente
                  </CommandItem>
                  <CommandItem
                    value="__avulso__"
                    onSelect={() => {
                      setOpen(false);
                      openCreateForm("create", { full_name: search });
                    }}
                  >
                    <Zap aria-hidden="true" />
                    Cliente avulso
                  </CommandItem>
                </div>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <QuickCustomerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialValues={formInitial ?? {}}
        onSave={(customer) => {
          setFormOpen(false);
          handleSelect(customer);
        }}
        onUseExisting={(customer) => {
          setFormOpen(false);
          handleSelect(customer);
        }}
      />
    </>
  );
}
