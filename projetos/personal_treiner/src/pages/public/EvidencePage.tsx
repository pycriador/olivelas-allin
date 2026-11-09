import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  ExternalLink,
  Layers,
  ZoomIn,
  X,
  Sun,
  Moon,
  Filter,
  Check,
} from 'lucide-react';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { Button } from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { getAssetUrl } from '../../utils/assets';

interface TestCaseEvidence {
  id: string;
  name: string;
  category: string;
  description: string;
  filename: string;
  status: 'SUCESSO';
  timestamp: string;
  executionSeconds: string;
}

const TEST_EVIDENCES: TestCaseEvidence[] = [
  {
    id: 'TC-01',
    name: 'Tela de Autenticação & Quick Login',
    category: 'Autenticação',
    description: 'Interface de login com opções de acesso rápido por papel (Personal, Trainer e Aluno) e formulário seguro.',
    filename: 'test-evidence/screenshots/01-login-screen.png',
    status: 'SUCESSO',
    timestamp: '13:08:18',
    executionSeconds: '1.2s',
  },
  {
    id: 'TC-02',
    name: 'Dashboard do Personal Trainer',
    category: 'Personal Trainer',
    description: 'Painel analítico com KPIs de retenção, adesão, faturamento e menu lateral refinado com perfil unificado.',
    filename: 'test-evidence/screenshots/02-dashboard-personal.png',
    status: 'SUCESSO',
    timestamp: '13:08:21',
    executionSeconds: '1.8s',
  },
  {
    id: 'TC-03',
    name: 'Listagem de Alunos com Filtros & Status',
    category: 'Gestão de Alunos',
    description: 'Cards detalhados de alunos com status, planos, frequência semanal e busca avançada por query params.',
    filename: 'test-evidence/screenshots/03-students-list.png',
    status: 'SUCESSO',
    timestamp: '13:08:23',
    executionSeconds: '1.4s',
  },
  {
    id: 'TC-04',
    name: 'Cadastro de Novo Aluno (Metas, Rotina, Nível)',
    category: 'Gestão de Alunos',
    description: 'Formulário completo com metas, dias de disponibilidade, nível e histórico técnico.',
    filename: 'test-evidence/screenshots/04-student-create-form.png',
    status: 'SUCESSO',
    timestamp: '13:08:25',
    executionSeconds: '1.6s',
  },
  {
    id: 'TC-05',
    name: 'Confirmação do Aluno Cadastrado na Listagem',
    category: 'Gestão de Alunos',
    description: 'Exibição imediata do novo aluno na listagem com dados persistidos em tempo real.',
    filename: 'test-evidence/screenshots/05-student-created-in-list.png',
    status: 'SUCESSO',
    timestamp: '13:08:27',
    executionSeconds: '1.1s',
  },
  {
    id: 'TC-06',
    name: 'Ficha Completa e Perfil do Aluno',
    category: 'Gestão de Alunos',
    description: 'Painel de métricas do aluno, histórico de adesão e abas dinâmicas de acompanhamento.',
    filename: 'test-evidence/screenshots/06-student-detail-overview.png',
    status: 'SUCESSO',
    timestamp: '13:08:29',
    executionSeconds: '1.5s',
  },
  {
    id: 'TC-07',
    name: 'Biblioteca de Exercícios com Player SVG',
    category: 'Treinos & Exercícios',
    description: 'Catálogo completo com animações SVG, grupos musculares e filtros avançados por equipamento.',
    filename: 'test-evidence/screenshots/07-exercises-library.png',
    status: 'SUCESSO',
    timestamp: '13:08:31',
    executionSeconds: '1.3s',
  },
  {
    id: 'TC-08',
    name: 'Modelos Prontos de Séries (Templates)',
    category: 'Treinos & Exercícios',
    description: 'Templates reutilizáveis categorizados por nível e objetivo de treino com versionamento.',
    filename: 'test-evidence/screenshots/08-workout-templates.png',
    status: 'SUCESSO',
    timestamp: '13:08:33',
    executionSeconds: '1.4s',
  },
  {
    id: 'TC-09',
    name: 'Prescrição & Construtor de Treinos',
    category: 'Treinos & Exercícios',
    description: 'Editor dinâmico de divisões ABC, séries, repetições, intervalos e cargas alvo.',
    filename: 'test-evidence/screenshots/09-workout-builder.png',
    status: 'SUCESSO',
    timestamp: '13:08:35',
    executionSeconds: '1.7s',
  },
  {
    id: 'TC-10',
    name: 'Gestão Nutricional & Planos Alimentares',
    category: 'Nutrição & Dietas',
    description: 'Planejamento de macronutrientes, distribuição calórica e refeições diárias dos alunos.',
    filename: 'test-evidence/screenshots/10-nutrition-management.png',
    status: 'SUCESSO',
    timestamp: '13:08:37',
    executionSeconds: '1.2s',
  },
  {
    id: 'TC-11',
    name: 'Formulários - Visão Geral (/personal/forms/geral)',
    category: 'Anamnese & Formulários',
    description: 'Dashboard analítico com taxa de resposta de anamneses e aplicações ativas.',
    filename: 'test-evidence/screenshots/11-forms-overview.png',
    status: 'SUCESSO',
    timestamp: '13:08:39',
    executionSeconds: '1.1s',
  },
  {
    id: 'TC-12',
    name: 'Formulários - Modelos de Fichas (/personal/forms/fichas)',
    category: 'Anamnese & Formulários',
    description: 'Listagem dos questionários padronizados com controle de versões e botão de exclusão.',
    filename: 'test-evidence/screenshots/12-forms-templates.png',
    status: 'SUCESSO',
    timestamp: '13:08:41',
    executionSeconds: '1.3s',
  },
  {
    id: 'TC-13',
    name: 'Editor de Perguntas Elegante & Intuitivo',
    category: 'Anamnese & Formulários',
    description: 'Seletor visual de tipos de campo com tags de opções e design sóbrio sem caixas feias de texto.',
    filename: 'test-evidence/screenshots/13-form-question-editor.png',
    status: 'SUCESSO',
    timestamp: '13:08:43',
    executionSeconds: '1.5s',
  },
  {
    id: 'TC-14',
    name: 'Formulários - Envios & Respostas dos Alunos',
    category: 'Anamnese & Formulários',
    description: 'Histórico completo de respostas submetidas pelos alunos para auditoria técnica.',
    filename: 'test-evidence/screenshots/14-forms-applications.png',
    status: 'SUCESSO',
    timestamp: '13:08:45',
    executionSeconds: '1.2s',
  },
  {
    id: 'TC-15',
    name: 'Configurações - Permissões HBAC em Tabela',
    category: 'Configurações & HBAC',
    description: 'Tabela elegante com busca por instrutor, paginação sob demanda e botões com padding calibrado.',
    filename: 'test-evidence/screenshots/15-settings-permissions-table.png',
    status: 'SUCESSO',
    timestamp: '13:08:47',
    executionSeconds: '1.4s',
  },
  {
    id: 'TC-16',
    name: 'Configurações - Mini CMS Landing Page',
    category: 'Configurações & HBAC',
    description: 'Customização completa de títulos, depoimentos, cores e links da landing page pública.',
    filename: 'test-evidence/screenshots/16-settings-landing-cms.png',
    status: 'SUCESSO',
    timestamp: '13:08:49',
    executionSeconds: '1.3s',
  },
  {
    id: 'TC-17',
    name: 'Relatórios & Business Intelligence',
    category: 'Relatórios & BI',
    description: 'Gráficos de aderência, volume total treinado e saúde financeira dos alunos.',
    filename: 'test-evidence/screenshots/17-reports-bi.png',
    status: 'SUCESSO',
    timestamp: '13:08:50',
    executionSeconds: '1.2s',
  },
  {
    id: 'TC-18',
    name: 'Gestão de Planos & Cupons Promocionais',
    category: 'Financeiro & Planos',
    description: 'Planos de assinatura periódicos, descontos promocionais e regras de fidelidade.',
    filename: 'test-evidence/screenshots/18-plans-and-coupons.png',
    status: 'SUCESSO',
    timestamp: '13:08:52',
    executionSeconds: '1.4s',
  },
  {
    id: 'TC-19',
    name: 'Ranking & Gamificação - Painel Personal',
    category: 'Gamificação',
    description: 'Gestão das ligas e regras de pontuação com pódio dos alunos líderes.',
    filename: 'test-evidence/screenshots/19-ranking-personal.png',
    status: 'SUCESSO',
    timestamp: '13:08:54',
    executionSeconds: '1.3s',
  },
  {
    id: 'TC-20',
    name: 'Portal do Aluno - Dashboard & Streak',
    category: 'Portal do Aluno',
    description: 'Painel do aluno com sequência de treinos (streak), calorias gastas e próximo treino do dia.',
    filename: 'test-evidence/screenshots/20-student-dashboard.png',
    status: 'SUCESSO',
    timestamp: '13:08:55',
    executionSeconds: '1.5s',
  },
  {
    id: 'TC-21',
    name: 'Portal do Aluno - Plano Alimentar',
    category: 'Portal do Aluno',
    description: 'Visualização das refeições prescritas, cronograma diário e opções de substituição.',
    filename: 'test-evidence/screenshots/21-student-nutrition.png',
    status: 'SUCESSO',
    timestamp: '13:08:57',
    executionSeconds: '1.1s',
  },
  {
    id: 'TC-22',
    name: 'Portal do Aluno - Treino Ativo em Execução',
    category: 'Portal do Aluno',
    description: 'Interface interativa de treino com cronômetro de descanso, registro de séries e cargas reais.',
    filename: 'test-evidence/screenshots/22-student-active-workout.png',
    status: 'SUCESSO',
    timestamp: '13:08:59',
    executionSeconds: '1.7s',
  },
  {
    id: 'TC-23',
    name: 'Finalização de Treino & Pontuação do Ranking',
    category: 'Gamificação',
    description: 'Modal de finalização com esforço percebido (RPE) e atribuição de pontos no ranking.',
    filename: 'test-evidence/screenshots/23-student-workout-completed.png',
    status: 'SUCESSO',
    timestamp: '13:09:00',
    executionSeconds: '1.3s',
  },
  {
    id: 'TC-24',
    name: 'Portal do Aluno - Ranking Geral dos Alunos',
    category: 'Gamificação',
    description: 'Pódio de alunos atualizado em tempo real com os pontos acumulados pelo treino executado.',
    filename: 'test-evidence/screenshots/24-student-ranking-leaderboard.png',
    status: 'SUCESSO',
    timestamp: '13:09:02',
    executionSeconds: '1.2s',
  },
  {
    id: 'TC-25',
    name: 'Exclusão Segura de Aluno com Confirmação',
    category: 'Gestão de Alunos',
    description: 'Modal de segurança para exclusão permanente do cadastro e dados vinculados com auditoria.',
    filename: 'test-evidence/screenshots/25-student-deletion-confirmed.png',
    status: 'SUCESSO',
    timestamp: '13:09:04',
    executionSeconds: '1.4s',
  },
  {
    id: 'TC-26',
    name: 'Landing Page Pública da Treinadora',
    category: 'Público & CMS',
    description: 'Página pública de conversão de clientes com apresentação, planos e contato direto.',
    filename: 'test-evidence/screenshots/26-public-landing-page.png',
    status: 'SUCESSO',
    timestamp: '13:09:05',
    executionSeconds: '1.0s',
  },
];

export const EvidencePage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeImageModal, setActiveImageModal] = useState<TestCaseEvidence | null>(null);

  const categories = useMemo(() => {
    const set = new Set(TEST_EVIDENCES.map((e) => e.category));
    return ['Todas', ...Array.from(set)];
  }, []);

  const filteredEvidences = useMemo(() => {
    return TEST_EVIDENCES.filter((item) => {
      const matchCat = selectedCategory === 'Todas' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.id.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);

      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Voltar para a Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Página Inicial</span>
            </button>
            <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <BrandLogo size="sm" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Rafaela Personal <span className="text-emerald-500 text-xs font-mono font-normal">| Homologação E2E</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/login')}
              className="text-xs font-bold"
            >
              Entrar no App
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
              <span>Suíte de Testes Automatizados E2E • Playwright</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              Evidências de Testes & Qualidade
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Homologação completa com 26 cenários ponta a ponta executados no Microsoft Edge Headless (1440x900).
              Cobre fluxos de login, gestão de alunos, montagem de treinos, nutrição, formulários com o novo seletor elegante,
              permissões HBAC, execução do treino pelo aluno e pontuação em tempo real no ranking.
            </p>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Cenários Testados</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">26 / 26</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">✓ 100% dos fluxos</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 shadow-xs">
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">Taxa de Sucesso</span>
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">100%</div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold mt-1 block">0 Falhas ou Regressões</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Tempo de Execução</span>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">37.4s</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Bateria completa automatizada</span>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Ambiente</span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Edge Headless
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">1440x900px Desktop HD</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por cenário, ID ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500">
              Exibindo <strong>{filteredEvidences.length}</strong> de {TEST_EVIDENCES.length} cenários
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-emerald-500 dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Evidence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvidences.map((test) => (
            <div
              key={test.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs hover:border-emerald-500/50 transition-all flex flex-col justify-between group"
            >
              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-white/10">
                    {test.id}
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Check className="w-3 h-3" /> APROVADO
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">
                  {test.name}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {test.description}
                </p>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-white/5 font-medium text-slate-600 dark:text-slate-300">
                    {test.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {test.executionSeconds}
                  </span>
                </div>
              </div>

              {/* Image Preview Container */}
              <div className="p-3 pt-0">
                <div
                  onClick={() => setActiveImageModal(test)}
                  className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative group/img cursor-pointer bg-slate-950 aspect-video flex items-center justify-center"
                >
                  <img
                    src={getAssetUrl(test.filename)}
                    alt={test.name}
                    className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/img:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold">
                    <ZoomIn className="w-4 h-4 text-emerald-400" />
                    <span>Expandir Evidência</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Lightbox */}
        {activeImageModal && (
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center animate-in fade-in duration-200"
            onClick={() => setActiveImageModal(null)}
          >
            <div
              className="bg-slate-900 border border-white/10 rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {activeImageModal.id}
                    </span>
                    <h3 className="text-base font-bold text-white truncate">
                      {activeImageModal.name}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {activeImageModal.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getAssetUrl(activeImageModal.filename)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Abrir imagem original"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setActiveImageModal(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Image */}
              <div className="p-2 bg-slate-950 overflow-auto flex-1 flex items-center justify-center">
                <img
                  src={getAssetUrl(activeImageModal.filename)}
                  alt={activeImageModal.name}
                  className="max-w-full max-h-[72vh] object-contain rounded-lg border border-white/5"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-3 px-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                <span>Categoria: <strong className="text-white">{activeImageModal.category}</strong></span>
                <span className="text-emerald-400 font-semibold">✓ Teste Validado e Auditado</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
