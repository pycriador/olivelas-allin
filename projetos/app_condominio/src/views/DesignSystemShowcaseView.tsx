import React, { useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, StatCard, ActionCard, InteractiveCard } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { SearchInput } from '../components/ui/SearchInput';
import { PasswordInput } from '../components/ui/PasswordInput';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { MultiSelect } from '../components/ui/MultiSelect';
import { DatePicker } from '../components/ui/DatePicker';
import { TimePicker } from '../components/ui/TimePicker';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { Checkbox } from '../components/ui/Checkbox';
import { Radio } from '../components/ui/Radio';
import { Switch } from '../components/ui/Switch';
import { FileInput } from '../components/ui/FileInput';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton, TableSkeleton, CardSkeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { PermissionDeniedState } from '../components/ui/PermissionDeniedState';
import { DataTable, ColumnDef } from '../components/ui/DataTable';
import { Calendar } from '../components/calendar/Calendar';
import { useApp } from '../context/AppContext';
import {
  Palette,
  Sparkles,
  Layers,
  Component,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar as CalendarIcon,
  CreditCard,
  FileText,
  User,
  ShieldCheck,
  RefreshCw,
  Plus,
  Send,
  Trash2,
  Search,
} from 'lucide-react';

interface MockDemoRow {
  id: string;
  name: string;
  unit: string;
  role: string;
  status: 'active' | 'pending' | 'blocked';
  email: string;
  date: string;
}

export const DesignSystemShowcaseView: React.FC = () => {
  const { addToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');

  // Form interactive demo states
  const [textValue, setTextValue] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('Secret123!');
  const [selectValue, setSelectValue] = useState('option2');
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>(['opt1', 'opt3']);
  const [dateValue, setDateValue] = useState('2026-08-28');
  const [timeValue, setTimeValue] = useState('14:30');
  const [dateRange, setDateRange] = useState({ start: '2026-08-28', end: '2026-09-04' });
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [radioValue, setRadioValue] = useState('opt1');
  const [switchValue, setSwitchValue] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [selectedTableRowIds, setSelectedTableRowIds] = useState<string[]>([]);
  const [cardSelected, setCardSelected] = useState(false);

  // Mock Table Data
  const mockTableData: MockDemoRow[] = [
    {
      id: 'usr-1',
      name: 'Carlos Drummond de Andrade',
      unit: 'Bloco A - Apt 101',
      role: 'Morador Proprietário',
      status: 'active',
      email: 'carlos.drummond@email.com',
      date: '2026-08-15',
    },
    {
      id: 'usr-2',
      name: 'Clarice Lispector',
      unit: 'Bloco B - Apt 204',
      role: 'Síndica Eleita',
      status: 'active',
      email: 'clarice.lispector@email.com',
      date: '2026-08-10',
    },
    {
      id: 'usr-3',
      name: 'Machado de Assis',
      unit: 'Bloco A - Apt 302',
      role: 'Conselheiro Fiscal',
      status: 'pending',
      email: 'machado.assis@email.com',
      date: '2026-08-22',
    },
    {
      id: 'usr-4',
      name: 'Guimarães Rosa',
      unit: 'Bloco C - Apt 401',
      role: 'Morador Inquilino',
      status: 'blocked',
      email: 'guimaraes.rosa@email.com',
      date: '2026-08-01',
    },
    {
      id: 'usr-5',
      name: 'Cecília Meireles',
      unit: 'Bloco B - Apt 102',
      role: 'Moradora Proprietária',
      status: 'active',
      email: 'cecilia.meireles@email.com',
      date: '2026-08-25',
    },
  ];

  const tableColumns: ColumnDef<MockDemoRow>[] = [
    {
      id: 'name',
      header: 'Nome Completo',
      accessorKey: 'name',
      sortable: true,
      mobilePrimary: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0">
            {row.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 dark:text-white truncate">{row.name}</p>
            <p className="text-xs text-slate-400 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'unit',
      header: 'Unidade',
      accessorKey: 'unit',
      sortable: true,
      mobileSecondary: true,
    },
    {
      id: 'role',
      header: 'Perfil / Função',
      accessorKey: 'role',
      sortable: true,
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      mobileBadge: true,
      cell: (row) => {
        switch (row.status) {
          case 'active':
            return (
              <Badge variant="success" size="sm" dot>
                Ativo
              </Badge>
            );
          case 'pending':
            return (
              <Badge variant="warning" size="sm" dot>
                Pendente
              </Badge>
            );
          case 'blocked':
            return (
              <Badge variant="error" size="sm" dot>
                Bloqueado
              </Badge>
            );
        }
      },
    },
    {
      id: 'date',
      header: 'Cadastro',
      accessorKey: 'date',
      sortable: true,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-150 pb-16">
      {/* Header */}
      <PageHeader
        title="Design System & Experience Foundation"
        description="Catálogo oficial de design tokens, componentes fundamentais, formulários, feedback, tabelas e diretrizes de experiência da plataforma Condominium."
        badge={
          <Badge variant="primary" size="md">
            v0.1 (Beta)
          </Badge>
        }
        breadcrumbs={[
          { label: 'Condominium Platform' },
          { label: 'Design System', active: true },
        ]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
            onClick={() => {
              addToast({
                type: 'info',
                title: 'Design System Ativo',
                message: 'Todos os tokens e componentes seguem as especificações WCAG 2.2 AA.',
              });
            }}
          >
            Auditoria WCAG 2.2 AA
          </Button>
        }
        tabs={
          <Tabs
            variant="underline"
            activeTab={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'overview', label: 'Visão Geral & Tokens', icon: <Layers className="w-4 h-4" /> },
              { id: 'forms', label: 'Formulários & Inputs', icon: <Component className="w-4 h-4" /> },
              { id: 'cards_feedback', label: 'Cards & Feedback', icon: <Sparkles className="w-4 h-4" /> },
              { id: 'tables', label: 'Data Table Enterprise', icon: <Palette className="w-4 h-4" /> },
              { id: 'calendar', label: 'Calendário Integrado', icon: <CalendarIcon className="w-4 h-4" /> },
            ]}
          />
        }
      />

      {/* TAB 1: OVERVIEW & DESIGN TOKENS */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Principles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card variant="subtle" padding="md">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Mobile-First & Responsivo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Cada componente é projetado primeiro para 320px com alvos de toque mínimos de 44px, adaptando-se com riqueza funcional e densidade para telas ultrawide.
              </p>
            </Card>

            <Card variant="subtle" padding="md">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Anti-Slop Enterprise
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Sem gradientes roxo-azul genéricos ou sombras pesadas. Uso rigoroso de superfícies neutras, bordas sutis (1px) e contraste visual matemático.
              </p>
            </Card>

            <Card variant="subtle" padding="md">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                Acessibilidade WCAG 2.2 AA
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande e componentes interativos. Ícones e rótulos semânticos garantem clareza.
              </p>
            </Card>
          </div>

          {/* Color Tokens Palette */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Paleta Semântica de Cores (Design Tokens)
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-12 rounded-lg bg-blue-600" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Primary Blue</p>
                <p className="text-[10px] text-slate-400 font-mono">#2563EB</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-12 rounded-lg bg-emerald-600" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Success Emerald</p>
                <p className="text-[10px] text-slate-400 font-mono">#059669</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-12 rounded-lg bg-amber-500" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Warning Amber</p>
                <p className="text-[10px] text-slate-400 font-mono">#D97706</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-12 rounded-lg bg-rose-600" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Error Rose</p>
                <p className="text-[10px] text-slate-400 font-mono">#E11D48</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-12 rounded-lg bg-cyan-600" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Info Cyan</p>
                <p className="text-[10px] text-slate-400 font-mono">#0891B2</p>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="h-12 rounded-lg bg-purple-600" />
                <p className="text-xs font-bold text-slate-900 dark:text-white">Purple Governance</p>
                <p className="text-[10px] text-slate-400 font-mono">#7C3AED</p>
              </div>
            </div>
          </Card>

          {/* Typography Scale */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Escala Tipográfica & Hierarquia
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                  Heading 1 (24px - 30px)
                </span>
                <span className="text-xs text-slate-400 font-mono">font-extrabold / tracking-tight</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Heading 2 (20px - 24px)
                </span>
                <span className="text-xs text-slate-400 font-mono">font-bold / tracking-tight</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Heading 3 (16px - 18px)
                </span>
                <span className="text-xs text-slate-400 font-mono">font-bold</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Body Large / Subtitle (14px - 16px)
                </span>
                <span className="text-xs text-slate-400 font-mono">font-semibold / text-slate-800</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Body Regular / Meta (12px - 13px)
                </span>
                <span className="text-xs text-slate-400 font-mono">font-normal / text-slate-600</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Caption / Overline (10px - 11px)
                </span>
                <span className="text-xs text-slate-400 font-mono">uppercase / tracking-wider</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: FORMS & INPUTS */}
      {activeTab === 'forms' && (
        <div className="space-y-8">
          {/* Button Variants & Sizes */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Botões (Button Component)
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Variantes semânticas com suporte nativo a ícones à esquerda/direita, estados de carregamento (spinner) e desabilitado.
            </p>

            <div className="space-y-4">
              {/* Variants */}
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tertiary">Tertiary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link Style</Button>
              </div>

              {/* Sizes */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button variant="primary" size="sm">
                  Small (sm)
                </Button>
                <Button variant="primary" size="md">
                  Medium (md)
                </Button>
                <Button variant="primary" size="lg">
                  Large (lg)
                </Button>
              </div>

              {/* States & Icons */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="primary"
                  loading={buttonLoading}
                  onClick={() => {
                    setButtonLoading(true);
                    setTimeout(() => setButtonLoading(false), 2000);
                  }}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  {buttonLoading ? 'Carregando...' : 'Clique para Carregar'}
                </Button>

                <Button variant="secondary" leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Com Ícone Esquerda
                </Button>

                <Button variant="secondary" rightIcon={<Send className="w-3.5 h-3.5" />}>
                  Com Ícone Direita
                </Button>

                <Button variant="secondary" disabled>
                  Desabilitado
                </Button>
              </div>
            </div>
          </Card>

          {/* Form Fields Grid */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Campos de Formulário & Entradas de Dados
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Inputs acessíveis com rótulos, mensagens de ajuda, validação de erro e suporte touch otimizado.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              <Input
                label="Texto Padrão (Input)"
                placeholder="Digite seu nome completo"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                hint="Informe o nome registrado no contrato."
                required
              />

              <SearchInput
                label="Campo de Busca (SearchInput)"
                placeholder="Pesquisar por condomínio, unidade..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onClear={() => setSearchValue('')}
              />

              <PasswordInput
                label="Senha Segura (PasswordInput)"
                value={passwordValue}
                onChange={(e) => setPasswordValue(e.target.value)}
                required
              />

              <Select
                label="Seleção Única (Select)"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                options={[
                  { value: 'option1', label: 'Salão de Festas Principal' },
                  { value: 'option2', label: 'Churrasqueira Gourmet 01' },
                  { value: 'option3', label: 'Quadra Poliesportiva' },
                ]}
              />

              <MultiSelect
                label="Seleção Múltipla (MultiSelect)"
                selectedValues={multiSelectValue}
                onChange={setMultiSelectValue}
                options={[
                  { value: 'opt1', label: 'Notificação por E-mail' },
                  { value: 'opt2', label: 'Notificação por WhatsApp' },
                  { value: 'opt3', label: 'Notificação Push no App' },
                ]}
              />

              <DatePicker
                label="Data (DatePicker)"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
              />

              <TimePicker
                label="Horário (TimePicker)"
                value={timeValue}
                onChange={(e) => setTimeValue(e.target.value)}
              />

              <DateRangePicker
                label="Período (DateRangePicker)"
                startDate={dateRange.start}
                endDate={dateRange.end}
                onStartDateChange={(d) => setDateRange({ ...dateRange, start: d })}
                onEndDateChange={(d) => setDateRange({ ...dateRange, end: d })}
              />

              <FileInput
                label="Upload de Arquivos (FileInput)"
                helperText="Arraste ou selecione comprovantes em PDF ou PNG (máx 10MB)"
                onChange={(files) => {
                  if (files.length > 0) {
                    addToast({
                      type: 'success',
                      title: 'Arquivo Selecionado',
                      message: `${files[0].name} pronto para envio.`,
                    });
                  }
                }}
              />
            </div>

            <div className="mt-5">
              <Textarea
                label="Observações / Mensagem (Textarea)"
                placeholder="Descreva detalhes adicionais ou solicitações para a administração..."
                rows={3}
                hint="Máximo de 500 caracteres."
              />
            </div>

            {/* Checkboxes, Radios, Switches */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3">
                  Checkboxes
                </span>
                <div className="space-y-2.5">
                  <Checkbox
                    label="Li e concordo com o regimento"
                    checked={checkboxChecked}
                    onChange={(e) => setCheckboxChecked(e.target.checked)}
                  />
                  <Checkbox label="Opção desabilitada" disabled />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3">
                  Radio Buttons
                </span>
                <div className="space-y-2.5">
                  <Radio
                    name="demoRadio"
                    label="Votação Favorável (Sim)"
                    checked={radioValue === 'opt1'}
                    onChange={() => setRadioValue('opt1')}
                  />
                  <Radio
                    name="demoRadio"
                    label="Votação Contrária (Não)"
                    checked={radioValue === 'opt2'}
                    onChange={() => setRadioValue('opt2')}
                  />
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3">
                  Switches de Configuração
                </span>
                <div className="space-y-3">
                  <Switch
                    label="Notificações Push"
                    description="Receba avisos instantâneos de novos comunicados"
                    checked={switchValue}
                    onChange={(e) => setSwitchValue(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: CARDS & FEEDBACK */}
      {activeTab === 'cards_feedback' && (
        <div className="space-y-8">
          {/* Stat & Action Cards */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Cards de Métricas (StatCard) & Ações (ActionCard)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Receita Condominial"
                value="R$ 148.500"
                subtitle="Mês de Agosto / 2026"
                change={{ value: '+4.2%', trend: 'up', label: 'vs. mês anterior' }}
                icon={<CreditCard className="w-5 h-5" />}
              />
              <StatCard
                title="Inadimplência"
                value="2.4%"
                subtitle="3 unidades com pendência"
                change={{ value: '-0.8%', trend: 'down', label: 'redução' }}
                icon={<AlertTriangle className="w-5 h-5" />}
                iconBgColor="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400"
              />
              <StatCard
                title="Reservas Ativas"
                value="14"
                subtitle="Neste final de semana"
                icon={<CalendarIcon className="w-5 h-5" />}
                iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
              />
              <StatCard
                title="Chamados em Aberto"
                value="2"
                subtitle="Tempo médio: 4.2h"
                icon={<ShieldCheck className="w-5 h-5" />}
                iconBgColor="bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard
              title="Nova Reserva de Espaço"
              description="Agende o salão de festas, churrasqueira ou quadra poliesportiva"
              icon={<CalendarIcon className="w-5 h-5" />}
              badge={<Badge variant="success" size="sm">Disponível</Badge>}
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Ação Acionada',
                  message: 'Redirecionando para o formulário de reserva...',
                });
              }}
            />
            <ActionCard
              title="Registrar Ocorrência / Chamado"
              description="Notifique barulho, manutenção ou solicite 2ª via para a administração"
              icon={<AlertTriangle className="w-5 h-5" />}
              iconBg="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
              onClick={() => {
                addToast({
                  type: 'info',
                  title: 'Ação Acionada',
                  message: 'Abrindo formulário de nova ocorrência...',
                });
              }}
            />
          </div>

          {/* Interactive Card Selection */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Cards Interativos com Seleção (InteractiveCard)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InteractiveCard
                selected={cardSelected}
                onClick={() => setCardSelected(!cardSelected)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Boleto via PIX Instantâneo
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Liquidação imediata e baixa automática no sistema do condomínio.
                    </p>
                  </div>
                  <Badge variant={cardSelected ? 'primary' : 'secondary'} size="sm">
                    {cardSelected ? 'Selecionado' : 'Opção 1'}
                  </Badge>
                </div>
              </InteractiveCard>

              <InteractiveCard
                selected={!cardSelected}
                onClick={() => setCardSelected(!cardSelected)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Boleto Bancário Tradicional
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Linha digitável com compensação em até 1 dia útil.
                    </p>
                  </div>
                  <Badge variant={!cardSelected ? 'primary' : 'secondary'} size="sm">
                    {!cardSelected ? 'Selecionado' : 'Opção 2'}
                  </Badge>
                </div>
              </InteractiveCard>
            </div>
          </Card>

          {/* Status Badges */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Badges de Status Semânticos
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Pílulas de status sem quebra de texto, com ou sem indicador circular.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary" dot>Primary</Badge>
              <Badge variant="success" dot>Confirmado</Badge>
              <Badge variant="warning" dot>Pendente</Badge>
              <Badge variant="error" dot>Atrasado</Badge>
              <Badge variant="info" dot>Em Análise</Badge>
              <Badge variant="purple" dot>Assembleia</Badge>
              <Badge variant="secondary">Neutro</Badge>
              <Badge variant="outline">Contorno</Badge>
            </div>
          </Card>

          {/* Toast Notification Triggers */}
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Sistema de Feedback Instantâneo (Toasts)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Dispare notificações globais acessíveis de sucesso, erro, aviso ou informação.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'success',
                    title: 'Reserva Confirmada',
                    message: 'Sua solicitação foi aprovada com sucesso.',
                  })
                }
              >
                Toast Sucesso
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'error',
                    title: 'Falha na Operação',
                    message: 'Não foi possível processar a requisição.',
                  })
                }
              >
                Toast Erro
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'warning',
                    title: 'Atenção Necessária',
                    message: 'O prazo para envio do voto encerra em 2 horas.',
                  })
                }
              >
                Toast Aviso
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'Novo Comunicado',
                    message: 'A administração publicou um novo aviso no mural.',
                  })
                }
              >
                Toast Info
              </Button>
            </div>
          </Card>

          {/* Skeletons & Error States */}
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Estados de Carregamento (Skeleton) & Erro
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card padding="md">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Skeleton Cards</p>
                <CardSkeleton count={2} />
              </Card>

              <Card padding="md">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Empty State</p>
                <EmptyState
                  icon={<FileText className="w-6 h-6" />}
                  title="Nenhum documento encontrado"
                  description="Não há arquivos correspondentes aos filtros selecionados."
                  primaryAction={{
                    label: 'Novo Upload',
                    onClick: () => {},
                  }}
                />
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA TABLE ENTERPRISE */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Tabela de Dados Empresarial (DataTable)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Componente genérico com ordenação por coluna, busca em tempo real, seleção de linhas, barra de ações em massa, seletor de visibilidade de colunas e paginação. No mobile (&lt;768px), transforma-se automaticamente em cards legíveis.
            </p>

            <DataTable<MockDemoRow>
              data={mockTableData}
              columns={tableColumns}
              keyExtractor={(r) => r.id}
              enableSelection
              selectedIds={selectedTableRowIds}
              onSelectionChange={setSelectedTableRowIds}
              searchPlaceholder="Filtrar moradores por nome ou unidade..."
              bulkActions={(selectedIds) => (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => {
                      addToast({
                        type: 'info',
                        title: 'Ação em Massa',
                        message: `${selectedIds.length} registros selecionados para remoção.`,
                      });
                    }}
                  >
                    Excluir ({selectedIds.length})
                  </Button>
                </div>
              )}
            />
          </Card>
        </div>
      )}

      {/* TAB 5: CALENDAR INTEGRADO */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Calendário Integrado & Agenda de Espaços
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Suporta visualizações Mês, Semana, Dia e Agenda, com filtros por categoria de recurso, cores semânticas e detalhes responsivos em Bottom Sheet (mobile) e Modal (desktop).
            </p>

            <Calendar
              events={[
                {
                  id: 'cal-1',
                  title: 'Salão de Festas Principal',
                  category: 'party_hall',
                  categoryLabel: 'Salão de Festas',
                  date: '2026-08-28',
                  startTime: '18:00',
                  endTime: '23:30',
                  userName: 'Carlos Drummond',
                  userUnit: '101-A',
                  status: 'confirmed',
                  isMyEvent: true,
                },
                {
                  id: 'cal-2',
                  title: 'Churrasqueira Gourmet 01',
                  category: 'barbecue',
                  categoryLabel: 'Churrasqueira',
                  date: '2026-08-28',
                  startTime: '12:00',
                  endTime: '16:00',
                  userName: 'Clarice Lispector',
                  userUnit: '204-B',
                  status: 'confirmed',
                },
                {
                  id: 'cal-3',
                  title: 'Assembleia Geral Ordinária',
                  category: 'assembly',
                  categoryLabel: 'Assembleia',
                  date: '2026-08-30',
                  startTime: '19:30',
                  endTime: '21:30',
                  location: 'Salão Principal + Transmissão Online',
                  status: 'confirmed',
                },
                {
                  id: 'cal-4',
                  title: 'Manutenção dos Elevadores',
                  category: 'maintenance',
                  categoryLabel: 'Manutenção',
                  date: '2026-09-02',
                  startTime: '08:00',
                  endTime: '12:00',
                  location: 'Bloco A e B',
                  status: 'pending',
                },
              ]}
              onNewReservation={() => {
                addToast({
                  type: 'info',
                  title: 'Nova Reserva',
                  message: 'Abrindo formulário de agendamento de espaço.',
                });
              }}
              onCancelEvent={(id) => {
                addToast({
                  type: 'warning',
                  title: 'Reserva Cancelada',
                  message: `A reserva #${id} foi cancelada.`,
                });
              }}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
