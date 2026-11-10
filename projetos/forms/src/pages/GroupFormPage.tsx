import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Shield, Save, CheckCircle2, Cloud, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { Group, User } from '../types';
import { toast } from 'sonner';

export const GroupFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const PRESET_COLORS = [
    '#4f46e5', '#06b6d4', '#10b981', '#f59e0b',
    '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'
  ];

  useEffect(() => {
    loadInitialData();
  }, [id]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const usersData = await api.getUsers();
      setAllUsers(usersData || []);

      if (isEditing) {
        const group: Group = await api.getGroupById(id!);
        setName(group.name || '');
        setDescription(group.description || '');
        setColor(group.color || '#4f46e5');

        // Extract user IDs belonging to this group
        const groupUserIds = usersData
          .filter((u: any) => (u.groups || []).some((g: any) => (g.id || g) === id))
          .map((u: any) => u.id);
        setSelectedUserIds(groupUserIds);
      }
    } catch (err: any) {
      toast.error('Erro ao carregar dados do grupo.');
      navigate('/app/groups', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((u) => u !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nome do grupo é obrigatório.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        await api.updateGroup(id!, {
          name: name.trim(),
          description: description.trim(),
          color,
          user_ids: selectedUserIds,
        });
        toast.success('Grupo atualizado com sucesso!');
      } else {
        await api.createGroup({
          name: name.trim(),
          description: description.trim(),
          color,
          user_ids: selectedUserIds,
        });
        toast.success('Novo grupo criado com sucesso!');
      }
      navigate('/app/groups');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar grupo.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground">Carregando informações do grupo...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/app/groups"
            className="p-2 rounded-xl hover:bg-surface-hover text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">
              {isEditing ? `Editar Grupo: ${name}` : 'Novo Grupo Corporativo (IAM)'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isEditing
                ? 'Configure permissões, membros e credenciais Google exclusivas para este setor'
                : 'Crie uma unidade organizacional para isolar formulários e contas Google'}
            </p>
          </div>
        </div>

        {isEditing && (
          <Link
            to={`/app/groups/${id}/google`}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 shadow-sm transition-all"
          >
            <Cloud className="w-4 h-4" />
            Configurar Google do Grupo
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-5 glass">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Informações Básicas do Grupo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Nome do Grupo *</label>
              <input
                type="text"
                required
                placeholder="Ex: Operações & Eventos"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">Cor de Identificação</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-background p-1"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-primary ring-offset-2' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-foreground block mb-1.5">Descrição do Propósito</label>
              <textarea
                rows={3}
                placeholder="Ex: Grupo responsável pela coordenação de pesquisas e integração de planilhas do setor."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
              />
            </div>
          </div>
        </div>

        {/* Member Management Card */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-4 glass">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Membros do Grupo
            </h2>
            <span className="text-xs text-muted-foreground font-semibold">
              {selectedUserIds.length} membro(s) alocado(s)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Os membros deste grupo terão acesso aos formulários colaborativos e usarão automaticamente as credenciais Google configuradas para este setor.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
            {allUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => handleToggleUser(user.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-background hover:bg-surface-hover'
                  }`}
                >
                  <div className="truncate min-w-0 pr-2">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {user.full_name}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate block font-mono">
                      {user.email}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-primary/80 mt-0.5 block">
                      {user.role}
                    </span>
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
            to="/app/groups"
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
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Grupo'}
          </button>
        </div>
      </form>
    </div>
  );
};
