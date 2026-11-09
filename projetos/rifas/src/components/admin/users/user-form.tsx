import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminUser } from "@/lib/admin-user-store";
import type { RoleCode, UserStatus } from "@/types/profile";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<AdminUser, "id" | "createdAt" | "updatedAt">) => void;
  existingEmails: string[];
  user?: AdminUser | null;
  isSubmitting?: boolean;
}

const ROLES: { value: RoleCode; label: string }[] = [
  { value: "GLOBAL_ADMIN", label: "Global Admin" },
  { value: "ADMIN", label: "Administrador" },
  { value: "PUBLISHER", label: "Criador" },
];

const STATUSES: { value: UserStatus; label: string }[] = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
  { value: "PENDING", label: "Pendente" },
];

const DEPARTMENTS = [
  "Tecnologia",
  "Operacoes",
  "Marketing",
  "Vendas",
  "Financeiro",
  "RH",
  "Design",
  "Suporte",
];

export function UserForm({
  open,
  onOpenChange,
  onSubmit,
  existingEmails,
  user,
  isSubmitting,
}: UserFormProps) {
  const isEditing = Boolean(user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleCode>("PUBLISHER");
  const [status, setStatus] = useState<UserStatus>("ACTIVE");
  const [department, setDepartment] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; role?: string }>({});

  useEffect(() => {
    if (open) {
      setName(user?.name ?? "");
      setEmail(user?.email ?? "");
      setRole(user?.role ?? "PUBLISHER");
      setStatus(user?.status ?? "ACTIVE");
      setDepartment(user?.department ?? "");
      setErrors({});
    }
  }, [open, user]);

  function validate(): boolean {
    const errs: { name?: string; email?: string; role?: string } = {};
    if (!name.trim()) errs.name = "Nome e obrigatorio.";
    if (!email.trim()) errs.email = "E-mail e obrigatorio.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      errs.email = "Formato de e-mail invalido.";
    else {
      const normalized = email.trim().toLowerCase();
      if (existingEmails.some((e) => e.toLowerCase() === normalized && e !== user?.email)) {
        errs.email = "Ja existe um usuario com este e-mail.";
      }
    }
    if (!role) errs.role = "Role e obrigatoria.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const dept = department.trim();
    onSubmit({
      name: name.trim(),
      email: email.trim(),
      role,
      status,
      ...(dept ? { department: dept } : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar usuario" : "Novo usuario"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do usuario."
              : "Preencha os dados para criar um novo usuario."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="uf-name">Nome</Label>
            <Input
              id="uf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              placeholder="Nome completo"
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-email">E-mail</Label>
            <Input
              id="uf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="email@exemplo.com"
            />
            {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as RoleCode)}
                disabled={isSubmitting ?? false}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.role ? <p className="text-xs text-destructive">{errors.role}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as UserStatus)}
                disabled={isSubmitting ?? false}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="uf-dept">Departamento</Label>
            <Select
              value={department}
              onValueChange={setDepartment}
              disabled={isSubmitting ?? false}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecionar..." />
              </SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : null}
              {isEditing ? "Salvar alteracoes" : "Criar usuario"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
