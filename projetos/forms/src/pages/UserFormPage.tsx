import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User as UserIcon, Mail, Lock, Shield, CheckCircle2, Save } from 'lucide-react';
import { api } from '../lib/api';
import { User, Group, UserRole, UserStatus } from '../types';
import { toast } from 'sonner';

export const UserFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('creator');
  const [status, setStatus] = useState<UserStatus>('active');
  const [department, setDepartment] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const groupsData = await api.getGroups();
      setGroups(groupsData || []);

      if (isEditing) {
        const user: User = await api.getUserById(id!);
        setFullName(user.full_name || '');
        setEmail(user.email || '');
        setRole(user.role || 'viewer');
        setStatus(user.status || 'active');
        setDepartment(user.department || '');
        setSelectedGroupIds((user.groups || []).map((g: any) => g.id || g));
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados do usuário.');
      navigate('/app/users', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    if (selectedGroupIds.includes(groupId)) {
      setSelectedGroupIds(selectedGroupIds.filter((g) => g !== groupId));
    } else {
      setSelectedGroupIds([...selectedGroupIds, groupId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Nome e E-mail são obrigatórios.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.updateUser(id!, {
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          status,
          department: department.trim(),
          password: password ? password.trim() : undefined,
          group_ids: selectedGroupIds,
        });
        toast.success('Usuário atualizado com sucesso!');
      } else {
        await api.createUser({
          full_name: fullName.trim(),
          email: email.trim(),
          role,
          status,
          department: department.trim(),
          password: password.trim() || 'Olivelas@2026',
          group_ids: selectedGroupIds,
        });
        toast.success('Novo usuário criado com sucesso!');
      }
      navigate('/app/users');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Carregando informações do usuário...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/app/users"
            className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {isEditing ? 'Editar Usuário' : 'Novo Usuário do Sistema'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? `Atualize permissões, grupos e dados cadastrais de ${fullName || email}`
                : 'Cadastre um novo membro com atribuição de grupos e controle de acesso HBAC'}
            </p>
          </div>
        </div>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal & Auth Data Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5 glass">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary" /> Dados Principais & Credenciais
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Nome Completo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos Eduardo Silveira"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Endereço de E-mail *</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="carlos@olivelas.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                {isEditing ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha de Acesso *'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <input
                  type="password"
                  placeholder={isEditing ? '••••••••' : 'Mínimo de 6 caracteres'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Departamento / Setor</label>
              <input
                type="text"
                placeholder="Ex: Operações, TI, Comercial"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Roles & Permissions Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5 glass">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Perfil de Acesso & Status (HBAC)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Perfil de Acesso (Role) *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                <option value="admin">Administrador Global (Acesso Total)</option>
                <option value="creator">Criador (Cria e Edita Formulários e Dashboards)</option>
                <option value="viewer">Visualizador (Somente Leitura e Preenchimento)</option>
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Administradores gerenciam usuários, grupos e credenciais Google de todos os setores.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Status da Conta *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              >
                <option value="active">Ativo (Pode fazer login normalmente)</option>
                <option value="inactive">Inativo (Login temporariamente pausado)</option>
                <option value="suspended">Suspenso (Bloqueado por segurança)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Group Membership Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Grupos de Pertencimento</h2>
            <span className="text-xs text-muted-foreground font-semibold">
              {selectedGroupIds.length} grupo(s) selecionado(s)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            O usuário herdará automaticamente as credenciais Google, formulários e permissões configuradas em cada grupo selecionado.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {groups.map((group) => {
              const isSelected = selectedGroupIds.includes(group.id);
              return (
                <div
                  key={group.id}
                  onClick={() => handleToggleGroup(group.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background hover:bg-surface-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: group.color || '#4f46e5' }}
                    />
                    <div className="truncate">
                      <span className="text-xs font-bold text-foreground block truncate">
                        {group.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate block">
                        {group.description || 'Grupo IAM'}
                      </span>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            to="/app/users"
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-border bg-surface text-foreground hover:bg-surface-hover transition-all"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg shadow-primary/25 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </div>
  );
};
