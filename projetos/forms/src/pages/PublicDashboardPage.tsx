import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  RefreshCw,
  Layers,
  AlertCircle,
  Building2,
  Users,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Home,
  Baby,
  Download,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';
import { Dashboard, DashboardWidget } from '../types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  PointElement,
  LineElement,
  Filler
);

const BLOCK_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  A: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', hex: '#3b82f6' },
  B: { bg: 'bg-purple-500/10 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/30', hex: '#a855f7' },
  C: { bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', hex: '#10b981' },
  D: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', hex: '#f59e0b' },
  E: { bg: 'bg-rose-500/10 dark:bg-rose-500/20', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', hex: '#f43f5e' },
  F: { bg: 'bg-cyan-500/10 dark:bg-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/30', hex: '#06b6d4' },
  Outros: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30', hex: '#64748b' },
};

export const PublicDashboardPage: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') || true;
  });

  // Table filters & sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'apt' | 'block' | 'kids'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    if (shareCode) loadPublicDashboard();
  }, [shareCode]);

  const loadPublicDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getPublicDashboard(shareCode!);
      setDashboard(data);
      setWidgets(data.widgets || []);
      setLastRefreshed(new Date());
    } catch (err: any) {
      setError(err.message || 'Dashboard não encontrado ou link desativado.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncSheet = async () => {
    if (!shareCode) return;
    try {
      setSyncing(true);
      const res = await api.syncPublicDashboard(shareCode);
      if (res.newImported && res.newImported > 0) {
        toast.success(`Sincronização realizada! ${res.newImported} nova(s) resposta(s) importada(s).`);
      } else {
        toast.info(res.message || 'Sincronização concluída! Planilha já está atualizada.');
      }
      await loadPublicDashboard();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sincronizar com Google Sheets');
    } finally {
      setSyncing(false);
    }
  };

  const toggleThemeMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Structured responses from server
  const rawResponses = useMemo(() => {
    return (dashboard as any)?.responses_list || [];
  }, [dashboard]);

  // Aggregated calculations based on real data
  const stats = useMemo(() => {
    const totalApartamentos = rawResponses.length;
    let totalCriancas = 0;
    let totalTermosSim = 0;
    const blockMap: Record<string, { count: number; kids: number; apartments: string[] }> = {
      A: { count: 0, kids: 0, apartments: [] },
      B: { count: 0, kids: 0, apartments: [] },
      C: { count: 0, kids: 0, apartments: [] },
      D: { count: 0, kids: 0, apartments: [] },
      E: { count: 0, kids: 0, apartments: [] },
      F: { count: 0, kids: 0, apartments: [] },
    };

    rawResponses.forEach((r: any) => {
      const ans = r.answers || {};
      const apt = String(ans['Apartamento'] || '').trim();
      const bloco = (String(ans['Bloco'] || '').trim().toUpperCase() || 'OUTROS');
      const kids = parseInt(ans['Quantidade de crianças'], 10) || 0;
      const termos = String(ans['Termos de aceite'] || '').toLowerCase();

      totalCriancas += kids;
      if (termos.includes('sim') || termos.includes('aceito') || termos.includes('concordo')) {
        totalTermosSim += 1;
      }

      if (!blockMap[bloco]) {
        blockMap[bloco] = { count: 0, kids: 0, apartments: [] };
      }
      blockMap[bloco].count += 1;
      blockMap[bloco].kids += kids;
      if (apt) {
        blockMap[bloco].apartments.push(apt);
      }
    });

    const mediaCriancas = totalApartamentos > 0 ? (totalCriancas / totalApartamentos).toFixed(1) : '0';
    const taxaAceite = totalApartamentos > 0 ? Math.round((totalTermosSim / totalApartamentos) * 100) : 100;

    return {
      totalApartamentos,
      totalCriancas,
      mediaCriancas,
      taxaAceite,
      totalTermosSim,
      blockMap,
    };
  }, [rawResponses]);

  // Filtered and Sorted responses
  const filteredResponses = useMemo(() => {
    let result = rawResponses.filter((r: any) => {
      const ans = r.answers || {};
      const apt = String(ans['Apartamento'] || '').toLowerCase();
      const bloco = String(ans['Bloco'] || '').toUpperCase();
      const email = String(r.respondent_email || '').toLowerCase();

      // Block filter
      if (selectedBlock !== 'ALL' && bloco !== selectedBlock) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesApt = apt.includes(query);
        const matchesBloco = bloco.toLowerCase().includes(query) || `bloco ${bloco.toLowerCase()}`.includes(query);
        const matchesEmail = email.includes(query);
        if (!matchesApt && !matchesBloco && !matchesEmail) {
          return false;
        }
      }

      return true;
    });

    result.sort((a: any, b: any) => {
      const ansA = a.answers || {};
      const ansB = b.answers || {};

      let valA: any = '';
      let valB: any = '';

      if (sortBy === 'apt') {
        valA = String(ansA['Apartamento'] || '');
        valB = String(ansB['Apartamento'] || '');
        return sortOrder === 'asc' ? valA.localeCompare(valB, undefined, { numeric: true }) : valB.localeCompare(valA, undefined, { numeric: true });
      }
      if (sortBy === 'block') {
        valA = String(ansA['Bloco'] || '');
        valB = String(ansB['Bloco'] || '');
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (sortBy === 'kids') {
        valA = parseInt(ansA['Quantidade de crianças'], 10) || 0;
        valB = parseInt(ansB['Quantidade de crianças'], 10) || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      // date
      valA = new Date(a.submitted_at || 0).getTime();
      valB = new Date(b.submitted_at || 0).getTime();
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return result;
  }, [rawResponses, selectedBlock, searchTerm, sortBy, sortOrder]);

  // Paginated list
  const totalPages = Math.ceil(filteredResponses.length / pageSize) || 1;
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResponses.slice(start, start + pageSize);
  }, [filteredResponses, currentPage]);

  const toggleSort = (field: 'date' | 'apt' | 'block' | 'kids') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = ['#', 'Apartamento', 'Bloco', 'Quantidade de Crianças', 'Termos de Aceite', 'Data e Hora'];
    const rows = filteredResponses.map((r: any, idx: number) => {
      const ans = r.answers || {};
      const dateStr = r.submitted_at ? new Date(r.submitted_at).toLocaleString('pt-BR') : '';
      return [
        idx + 1,
        `"${ans['Apartamento'] || ''}"`,
        `"${ans['Bloco'] || ''}"`,
        ans['Quantidade de crianças'] || 0,
        `"${ans['Termos de aceite'] || 'Sim'}"`,
        `"${dateStr}"`,
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inscricoes_halloween_2026_${selectedBlock}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Arquivo CSV exportado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-300">Carregando painel de dados em tempo real...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Dashboard Indisponível</h2>
          <p className="text-xs text-slate-300">{error}</p>
          <Link to="/" className="inline-block text-xs font-bold text-indigo-400 hover:underline pt-2">
            Voltar para o início
          </Link>
        </div>
      </div>
    );
  }

  // Chart datasets
  const activeBlocks = ['A', 'B', 'C', 'D', 'E', 'F'];
  const barChartData = {
    labels: activeBlocks.map(b => `Bloco ${b}`),
    datasets: [
      {
        label: 'Crianças Confirmadas',
        data: activeBlocks.map(b => stats.blockMap[b]?.kids || 0),
        backgroundColor: activeBlocks.map(b => BLOCK_COLORS[b]?.hex || '#6366f1'),
        borderRadius: 8,
      },
      {
        label: 'Apartamentos Inscritos',
        data: activeBlocks.map(b => stats.blockMap[b]?.count || 0),
        backgroundColor: activeBlocks.map(b => (BLOCK_COLORS[b]?.hex || '#6366f1') + '66'),
        borderRadius: 8,
      },
    ],
  };

  const doughnutChartData = {
    labels: activeBlocks.map(b => `Bloco ${b}`),
    datasets: [
      {
        data: activeBlocks.map(b => stats.blockMap[b]?.count || 0),
        backgroundColor: activeBlocks.map(b => BLOCK_COLORS[b]?.hex || '#6366f1'),
        borderWidth: 2,
        borderColor: isDarkMode ? '#1e293b' : '#ffffff',
      },
    ],
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Top Header Card */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <Layers className="w-3.5 h-3.5" /> Olivelas Analytics Realtime
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Sincronizado com Google Sheets
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
              {dashboard.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
              {dashboard.description || 'Painel de acompanhamento e estatísticas oficiais com dados reais sincronizados.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
            <div className="text-right hidden sm:block mr-2">
              <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Última atualização</div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {lastRefreshed.toLocaleTimeString('pt-BR')}
              </div>
            </div>

            <button
              onClick={handleSyncSheet}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/20 transition-all disabled:opacity-50 cursor-pointer"
              title="Sincronizar novos dados com a planilha Google"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Planilha'}
            </button>

            <button
              onClick={toggleThemeMode}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
              title={isDarkMode ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>
        </div>

        {/* 4 Prominent KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Apartamentos Inscritos
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {stats.totalApartamentos}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">famílias cadastradas</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% dos blocos com participantes
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Crianças Participantes
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Baby className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {stats.totalCriancas}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">crianças confirmadas</span>
            </div>
            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Prontas para doces ou travessuras
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Média Crianças / Ap.
              </span>
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                {stats.mediaCriancas}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">por unidade inscrita</span>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Distribuição equilibrada no condomínio
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aceite dos Termos
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400">
                {stats.taxaAceite}%
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">({stats.totalTermosSim}/{stats.totalApartamentos})</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              Regras do evento validadas
            </div>
          </div>
        </div>

        {/* Section: Resumo Detalhado por Bloco (Apartamentos & Crianças) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" /> Resumo por Bloco Participante & Apartamentos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Clique em qualquer bloco para filtrar instantaneamente a tabela de inscrições abaixo.
              </p>
            </div>
            {selectedBlock !== 'ALL' && (
              <button
                onClick={() => setSelectedBlock('ALL')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Limpar filtro ({selectedBlock})
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {activeBlocks.map((bloco) => {
              const bInfo = stats.blockMap[bloco] || { count: 0, kids: 0, apartments: [] };
              const colors = BLOCK_COLORS[bloco] || BLOCK_COLORS.Outros;
              const isSelected = selectedBlock === bloco;

              return (
                <div
                  key={bloco}
                  onClick={() => setSelectedBlock(isSelected ? 'ALL' : bloco)}
                  className={`rounded-2xl p-4 border transition-all cursor-pointer select-none ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 bg-white dark:bg-slate-900 border-indigo-500 shadow-lg scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${colors.bg} ${colors.text} border ${colors.border}`}>
                      Bloco {bloco}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {bInfo.count} {bInfo.count === 1 ? 'ap.' : 'ap.'}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="text-xl font-black text-slate-900 dark:text-white">
                      {bInfo.kids} <span className="text-xs font-normal text-slate-400">crianças</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: colors.hex,
                          width: `${stats.totalCriancas > 0 ? (bInfo.kids / stats.totalCriancas) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Apartamentos:
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                      {bInfo.apartments.length > 0 ? (
                        bInfo.apartments.map((apt, idx) => (
                          <span
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchTerm(apt);
                              setSelectedBlock(bloco);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-500 hover:text-white transition-colors"
                            title="Filtrar por este apartamento"
                          >
                            {apt}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400">Nenhum</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Distribuição de Crianças e Famílias por Bloco
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Comparativo de crianças confirmadas vs apartamentos inscritos
                </p>
              </div>
              <span className="text-[11px] font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-full">
                Gráfico Oficial
              </span>
            </div>
            <div className="h-64">
              <Bar
                data={barChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        color: isDarkMode ? '#94a3b8' : '#475569',
                        font: { size: 11, weight: 'bold' },
                      },
                    },
                  },
                  scales: {
                    x: {
                      ticks: { color: isDarkMode ? '#94a3b8' : '#475569' },
                      grid: { color: isDarkMode ? '#33415522' : '#e2e8f088' },
                    },
                    y: {
                      ticks: { color: isDarkMode ? '#94a3b8' : '#475569' },
                      grid: { color: isDarkMode ? '#33415522' : '#e2e8f088' },
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 flex flex-col justify-between">
            <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Proporção por Bloco (Apartamentos)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Participação relativa no condomínio
              </p>
            </div>
            <div className="h-56 flex items-center justify-center">
              <Doughnut
                data={doughnutChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        color: isDarkMode ? '#94a3b8' : '#475569',
                        font: { size: 10, weight: 'bold' },
                        boxWidth: 10,
                      },
                    },
                  },
                }}
              />
            </div>
            <div className="text-center text-[11px] font-semibold text-slate-400">
              Total de {stats.totalApartamentos} apartamentos representados
            </div>
          </div>
        </div>

        {/* Section: Complete Real Data Table (Texto) */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Lista Completa de Apartamentos e Inscrições (Tabela em Texto)
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  {filteredResponses.length} registros
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dados oficiais em texto com busca, filtros de bloco, ordenação interativa e exportação.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportToCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                title="Exportar registros filtrados em CSV"
              >
                <Download className="w-3.5 h-3.5" /> Exportar CSV
              </button>
            </div>
          </div>

          {/* Table Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar por número do apartamento ou bloco..."
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Block Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => {
                  setSelectedBlock('ALL');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedBlock === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Todos ({stats.totalApartamentos})
              </button>
              {activeBlocks.map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    setSelectedBlock(selectedBlock === b ? 'ALL' : b);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedBlock === b
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Bloco {b} ({stats.blockMap[b]?.count || 0})
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-3 px-4 w-12 text-center">#</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-indigo-500 transition-colors select-none"
                    onClick={() => toggleSort('apt')}
                  >
                    <div className="flex items-center gap-1.5">
                      Apartamento
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-indigo-500 transition-colors select-none"
                    onClick={() => toggleSort('block')}
                  >
                    <div className="flex items-center gap-1.5">
                      Bloco
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-indigo-500 transition-colors select-none"
                    onClick={() => toggleSort('kids')}
                  >
                    <div className="flex items-center gap-1.5">
                      Crianças Confirmadas
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Termos de Aceite</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:text-indigo-500 transition-colors select-none text-right"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      Data da Inscrição
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedResponses.length > 0 ? (
                  paginatedResponses.map((r: any, idx: number) => {
                    const ans = r.answers || {};
                    const apt = ans['Apartamento'] || '—';
                    const bloco = (ans['Bloco'] || '—').toUpperCase();
                    const kids = parseInt(ans['Quantidade de crianças'], 10) || 0;
                    const termos = ans['Termos de aceite'] || 'Sim';
                    const colors = BLOCK_COLORS[bloco] || BLOCK_COLORS.Outros;
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    const dateFormatted = r.submitted_at
                      ? new Date(r.submitted_at).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—';

                    return (
                      <tr
                        key={r.id || idx}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-4 text-center text-slate-400 font-mono text-[11px]">
                          {rowNumber}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <Home className="w-3.5 h-3.5 text-slate-500" />
                            Ap. {apt}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold ${colors.bg} ${colors.text} border ${colors.border}`}>
                            Bloco {bloco}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            <Baby className="w-3.5 h-3.5" />
                            {kids} {kids === 1 ? 'criança' : 'crianças'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {termos}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {dateFormatted}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Nenhuma inscrição encontrada para o filtro informado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination & Summary Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Mostrando <span className="font-bold text-slate-700 dark:text-slate-200">{paginatedResponses.length}</span> de{' '}
              <span className="font-bold text-slate-700 dark:text-slate-200">{filteredResponses.length}</span> inscrições filtradas{' '}
              (Total no condomínio: <span className="font-bold text-slate-700 dark:text-slate-200">{stats.totalApartamentos}</span>)
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400 space-y-1">
          <p>© 2026 Olivelas IAM Forms — Condomínio Monumento São Paulo</p>
          <p className="text-[10px]">
            Sincronização em tempo real alimentada pela API Google Sheets oficial
          </p>
        </div>

      </div>
    </div>
  );
};
