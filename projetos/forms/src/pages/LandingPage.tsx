import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Shield,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Layers,
  Database,
  Lock,
  Globe,
  Palette,
  CloudUpload,
  Cpu,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Layers className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-white">
                Olivelas <span className="text-indigo-400">IAM Forms</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Enterprise & Forms Intelligence
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/app"
              className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all hover:scale-105"
            >
              Acessar Plataforma
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-slate-950 -z-10" />

        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Nova Geração de Formulários Corporativos & IAM</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            Toda a facilidade do <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400">Google Forms</span>, com o poder, segurança e inteligência corporativa.
          </h1>

          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-slate-300 leading-relaxed font-light">
            Formulários completos com suporte a <strong>números inteiros</strong>, <strong>números quebrados/decimais</strong>, <strong>blocos informativos</strong>, <strong>upload de imagens</strong>, controle de acesso <strong>IAM/HBAC</strong>, <strong>30 temas visuais</strong>, <strong>3 idiomas</strong> e <strong>dashboards interativos</strong> em tempo real integrados ao Google Sheets e Drive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/app/forms/new"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-2 text-base hover:scale-105"
            >
              Criar Formulário Agora <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/f/censo-olivelas-2026"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-200 border border-slate-700 bg-slate-900/60 hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-base"
            >
              <FileText className="w-5 h-5 text-indigo-400" /> Testar Formulário Público
            </Link>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="max-w-7xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Governança & IAM HBAC</h3>
            <p className="text-sm text-slate-400">
              Perfis de Administrador Global, Criador e Visualizador. Compartilhe formulários específicos com outros usuários concedendo acesso de <strong>Editor</strong> ou apenas <strong>Visualizador</strong> por e-mail.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Dashboards Interativos</h3>
            <p className="text-sm text-slate-400">
              Crie gráficos de pizza, donut, barras verticais e horizontais, linhas e cartões de métricas. Salve, edite e compartilhe páginas públicas ou privadas integradas a respostas ou Google Sheets.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Integração Total com o Google</h3>
            <p className="text-sm text-slate-400">
              Sincronização em tempo real de envios para planilhas do <strong>Google Sheets</strong>, upload de anexos no <strong>Google Drive</strong> e importador de perguntas do <strong>Google Forms</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison: Google Forms vs Olivelas IAM Forms */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800 bg-slate-900/30">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white">Comparativo: Google Forms vs Olivelas IAM Forms</h2>
            <p className="text-slate-400 text-sm">Mais completo, flexível e seguro para operações corporativas.</p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/70 text-slate-300">
                  <th className="py-4 px-6 font-bold">Recurso / Capacidade</th>
                  <th className="py-4 px-6 font-bold text-slate-400">Google Forms</th>
                  <th className="py-4 px-6 font-bold text-indigo-400">Olivelas IAM Forms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="py-3.5 px-6 font-medium">Números Inteiros & Números Quebrados/Decimais</td>
                  <td className="py-3.5 px-6 text-slate-500">Apenas validação básica de texto</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Tipos nativos com precisão, min/max e step
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Blocos de Somente Texto (Avisos/Instruções)</td>
                  <td className="py-3.5 px-6 text-slate-500">Parcial</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">Nativo com suporte visual</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Upload de Imagens & Arquivos</td>
                  <td className="py-3.5 px-6 text-slate-500">Requer conta Google para o usuário</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">Público, anônimo ou autenticado</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">IAM & Níveis de Colaboração por E-mail</td>
                  <td className="py-3.5 px-6 text-slate-500">Acesso único no Drive</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">Editor ou Visualizador granular por form</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Temas Visuais Personalizados</td>
                  <td className="py-3.5 px-6 text-slate-500">Cores padrão básicas</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">30 temas visuais com gradientes</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Multi-idioma (PT-BR, EN, ES)</td>
                  <td className="py-3.5 px-6 text-slate-500">Idioma do navegador</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">Seletor instantâneo de 3 línguas</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">Dashboards Interativos Customizáveis</td>
                  <td className="py-3.5 px-6 text-slate-500">Gráficos estáticos simples</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">Pizza, Donut, Linha, Barras & Métricas CRUD</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-6 font-medium">API Tokens & HBAC</td>
                  <td className="py-3.5 px-6 text-slate-500">Não possui API direta simples</td>
                  <td className="py-3.5 px-6 font-semibold text-emerald-400">Tokens Bearer com escopos granulares</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Pronto para transformar sua gestão de dados?</h2>
        <p className="max-w-xl mx-auto text-slate-400 text-base">
          Comece agora mesmo a criar formulários inteligentes e dashboards corporativos.
        </p>
        <Link
          to="/app"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 text-lg transition-transform hover:scale-105"
        >
          Acessar o Painel de Controle <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
};
