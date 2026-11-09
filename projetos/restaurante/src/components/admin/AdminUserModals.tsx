import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Edit2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { iamService } from '@/services/iamService';
import { useAuth } from '@/hooks/useAuth';
import type { PlatformUser, PlatformRoleId, UserStatus } from '@/types/iam';

// ==========================================
// 1. CREATE USER MODAL
// ==========================================
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [platformRole, setPlatformRole] = useState<PlatformRoleId | 'none'>('none');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setPlatformRole('none');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    if (!name.trim()) {
      toast.error('Informe o nome completo.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await iamService.createUser(
        {
          full_name: name.trim(),
          email: cleanEmail,
          password: password.trim() || undefined,
          phone: phone.trim() || undefined,
          platform_role: platformRole !== 'none' ? platformRole : undefined,
        },
        currentUser?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Usuário ${name} cadastrado com sucesso!`);
        onCreated();
        onClose();
      }
    } catch {
      toast.error('Falha ao criar usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Novo Usuário da Plataforma</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1.5">
            <Label htmlFor="create-name" required>
              Nome Completo
            </Label>
            <Input
              id="create-name"
              placeholder="Ex: João da Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-email" required>
              E-mail
            </Label>
            <Input
              id="create-email"
              type="email"
              placeholder="joao@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-password">
              Senha Inicial (Opcional)
            </Label>
            <Input
              id="create-password"
              type="password"
              placeholder="Deixe em branco para gerar aleatória"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-[11px] text-muted-foreground">
              Se deixar em branco, o sistema gerará uma senha segura inicial.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-phone">Telefone / WhatsApp (Opcional)</Label>
            <Input
              id="create-phone"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="create-platform-role">Papel de Plataforma</Label>
            <select
              id="create-platform-role"
              value={platformRole}
              onChange={(e) => setPlatformRole(e.target.value as any)}
              disabled={isSubmitting}
              className="w-full h-9 text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="none">Usuário Comum (Membro de Restaurante)</option>
              <option value="global_admin">👑 Administrador Global (Acesso Total ao SaaS)</option>
              <option value="platform_support">🎧 Suporte da Plataforma (Agente)</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
              )}
              Criar Usuário
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. EDIT USER MODAL
// ==========================================
interface EditUserModalProps {
  user: PlatformUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditUserModal({ user, isOpen, onClose, onUpdated }: EditUserModalProps) {
  const { user: currentUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<UserStatus>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setName(user.full_name || '');
      setPhone(user.phone || '');
      setStatus(user.status || 'active');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Informe o nome do usuário.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await iamService.updateUser(
        user.id,
        {
          full_name: name.trim(),
          phone: phone.trim() || undefined,
          status,
        },
        currentUser?.id
      );

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Dados do usuário atualizados com sucesso!');
        onUpdated();
        onClose();
      }
    } catch {
      toast.error('Falha ao atualizar dados.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-2">
            <Edit2 className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Editar Usuário</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">E-mail (Identificador Auth):</span>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border font-mono text-xs text-foreground">
              {user.email}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name" required>
              Nome Completo
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Telefone / WhatsApp</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-status">Status da Conta</Label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              disabled={isSubmitting}
              className="w-full h-9 text-xs rounded-md border border-border bg-background px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="active">Ativo (Acesso Liberado)</option>
              <option value="suspended">Suspenso (Bloqueado Temporariamente)</option>
              <option value="deactivated">Desativado</option>
            </select>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} className="text-xs">
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Edit2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. ROLE PROMOTION / DEMOTION MODAL
// ==========================================
interface RoleConfirmModalProps {
  user: PlatformUser | null;
  targetRole: PlatformRoleId;
  action: 'assign' | 'remove';
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
}

export function RoleConfirmModal({
  user,
  targetRole,
  action,
  isOpen,
  onClose,
  onConfirmed,
}: RoleConfirmModalProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const isGlobalAdminRole = targetRole === 'global_admin';
  const isAssigning = action === 'assign';

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = isAssigning
        ? await iamService.assignPlatformRole(user.id, targetRole, currentUser?.id)
        : await iamService.removePlatformRole(user.id, targetRole, currentUser?.id);

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(
          isAssigning
            ? `Usuário promovido a ${isGlobalAdminRole ? 'Administrador Global' : 'Suporte da Plataforma'} com sucesso!`
            : `Papel de ${isGlobalAdminRole ? 'Administrador Global' : 'Suporte'} removido.`
        );
        onConfirmed();
        onClose();
      }
    } catch {
      toast.error('Erro ao alterar privilégios do usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-full ${
              isAssigning
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {isAssigning ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">
              {isAssigning
                ? `Promover a ${isGlobalAdminRole ? 'Global Admin' : 'Suporte'}?`
                : `Remover ${isGlobalAdminRole ? 'Global Admin' : 'Suporte'}?`}
            </h3>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[200px]">
              {user.email}
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-2 leading-relaxed bg-muted/30 p-3 rounded-lg border border-border/60">
          {isAssigning && isGlobalAdminRole ? (
            <p>
              <strong className="text-foreground">Atenção:</strong> O papel de{' '}
              <strong className="text-amber-600 dark:text-amber-400">Global Admin</strong> concede controle irrestrito
              a todos os restaurantes da plataforma, dados de auditoria e configurações multi-tenant.
            </p>
          ) : isAssigning ? (
            <p>
              O usuário poderá iniciar sessões de atendimento e prestar suporte aos restaurantes parceiros.
            </p>
          ) : (
            <p>
              O usuário deixará de possuir privilégios administrativos globais e retornará ao escopo padrão de membro.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`text-xs ${
              isAssigning && isGlobalAdminRole
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : ''
            }`}
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Confirmar {isAssigning ? 'Promoção' : 'Alteração'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. DELETE USER MODAL
// ==========================================
interface DeleteUserModalProps {
  user: PlatformUser | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteUserModal({ user, isOpen, onClose, onDeleted }: DeleteUserModalProps) {
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const res = await iamService.deleteUser(user.id, currentUser?.id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Usuário ${user.email} excluído com sucesso.`);
        onDeleted();
        onClose();
      }
    } catch {
      toast.error('Erro ao excluir usuário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-sm rounded-xl border border-destructive/30 bg-card p-5 shadow-2xl space-y-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-sm font-bold">Excluir Conta de Usuário?</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tem certeza que deseja excluir o usuário{' '}
          <strong className="text-foreground">{user.full_name || user.email}</strong> (
          <span className="font-mono text-[11px]">{user.email}</span>)?
        </p>
        <p className="text-[11px] text-destructive leading-relaxed">
          Esta ação removerá os vínculos de membros de todos os restaurantes e revogará todos os papéis de plataforma.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="text-xs"
          >
            {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
            Excluir Usuário
          </Button>
        </div>
      </div>
    </div>
  );
}
