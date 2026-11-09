import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  Shield,
  Smartphone,
  Calendar,
  Sparkles,
  Users2,
  ArrowRight,
  Receipt,
  FileText,
  LifeBuoy,
  Lock,
  Layers,
  ChevronRight,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { mockCondominiums } from '../mock-data/condominiums';

export const LandingView: React.FC = () => {
  const { setCurrentView, loginAs, mockUsers } = useApp() as any;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white pb-20">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Condominium
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  v0.1 (Beta)
                </span>
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block -mt-0.5">
                Enterprise Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('login')}
            >
              Entrar
            </Button>
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              onClick={() => setCurrentView('dashboard')}
            >
              Acessar Mockup
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-12 sm:pt-20 px-4 sm:px-8 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>Plataforma SaaS Multi-Condomínio com IA Documental e Mobile-First</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight sm:leading-none">
          A nova geração da gestão condominial inteligente e integrada.
        </h1>

        <p className="mt-6 text-base sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Uma única conta para todos os seus imóveis. Experiência fluida para moradores, ferramentas de alta produtividade para síndicos e governança completa para administradoras.
        </p>

        <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setCurrentView('dashboard')}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Explorar Mockup Interativo
          </Button>

          <Button
            variant="secondary"
            size="lg"
            leftIcon={<Building2 className="w-5 h-5 text-blue-600" />}
            onClick={() => setCurrentView('condo_select')}
          >
            Alternar Condomínio & Perfis
          </Button>
        </div>

        {/* Floating Metrics Banner */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">100%</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Multi-Tenant</p>
            <p className="text-[11px] text-slate-500">Uma identidade, múltiplos condomínios</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Mobile-1st</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">Touch Ready</p>
            <p className="text-[11px] text-slate-500">App responsivo para smartphone</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">RAG AI</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">IA Documental</p>
            <p className="text-[11px] text-slate-500">Consulta instantânea a convenções</p>
          </div>
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">4 Perfis</span>
            <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">RBAC Completo</p>
            <p className="text-[11px] text-slate-500">Morador, Síndico, Admin e SuperAdmin</p>
          </div>
        </div>
      </section>

      {/* Multi-tenancy Concept Showcase Section */}
      <section id="arquitetura" className="mt-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="primary" className="mb-3">Arquitetura de Domínio</Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Identidade Única com Context Switcher Nativo
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300">
            Chega de criar uma conta para cada apartamento. O usuário possui login unificado e transita entre seus condomínios e cargos com um clique.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-950/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <Badge variant="primary">Solar Park</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Condomínio Solar Park</h3>
            <p className="text-xs text-slate-500 mt-1">Apt 101 - Bloco A</p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Papel:</span>
                <span className="font-bold text-slate-900 dark:text-white">Morador & Síndico</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Plano:</span>
                <span className="font-bold text-blue-600">Enterprise</span>
              </div>
            </div>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-b from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <Badge variant="success">Green Village</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Condomínio Green Village</h3>
            <p className="text-xs text-slate-500 mt-1">Apt 502</p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Papel:</span>
                <span className="font-bold text-slate-900 dark:text-white">Morador</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Plano:</span>
                <span className="font-bold text-emerald-600">Professional</span>
              </div>
            </div>
          </Card>

          <Card className="border-purple-200 dark:border-purple-900/60 bg-gradient-to-b from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <Badge variant="purple">Residencial Jardim</Badge>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Residencial Jardim das Flores</h3>
            <p className="text-xs text-slate-500 mt-1">Apt 1201</p>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Papel:</span>
                <span className="font-bold text-purple-600">Síndico Geral</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Plano:</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">Starter</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Core Feature Pillars */}
      <section id="solucoes" className="mt-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="amber" className="mb-3">Módulos Integrados</Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tudo o que seu condomínio precisa em um único lugar
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-4">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Boletos & PIX Instantâneo</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Emissão de segunda via, código de barras copiável, chave PIX copia-e-cola e baixa automática de inadimplência.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Reservas & Google Calendar</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Catálogo visual de espaços com fotos, regras de antecedência, taxas e visão interativa por mês, semana e timeline diária.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mb-4">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Google Drive Sync & Documentos</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Atas, balancetes, convenções e regimentos organizados com busca rápida e sincronização automática em nuvem.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mb-4">
              <Users2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Assembleias Digitais & Votação</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Convocação com quórum em tempo real, integração de videoconferência e cédulas de votação seguras com apuração instantânea.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-4">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Helpdesk & Ocorrências com Fotos</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Tickets numerados para tags de acesso, autorizações e livro digital com upload de fotos e linha do tempo de respostas da gestão.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-4">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">RAG AI: Dúvidas com Fontes Oficiais</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Inteligência Artificial que responde perguntas dos moradores com citações diretas do regimento interno e número de páginas.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Tiers (Feature Flags Preview) */}
      <section id="planos" className="mt-24 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="purple" className="mb-3">Planos & Feature Flags</Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Escalabilidade para qualquer porte de condomínio
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Starter */}
          <Card className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-slate-400">Starter</span>
              <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">R$ 199 <span className="text-xs font-normal text-slate-500">/mês</span></h3>
              <p className="text-xs text-slate-500 mt-2">Para condomínios de pequeno porte com foco no essencial.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Boletos & PIX</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Reservas de Espaços</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Mural de Comunicados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Helpdesk & Ocorrências</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => setCurrentView('dashboard')}>
              Ver Demonstração
            </Button>
          </Card>

          {/* Professional */}
          <Card className="flex flex-col justify-between border-blue-500 dark:border-blue-500 shadow-md relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full">
              Mais Popular
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Professional</span>
              <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">R$ 389 <span className="text-xs font-normal text-slate-500">/mês</span></h3>
              <p className="text-xs text-slate-500 mt-2">Para condomínios residenciais e comerciais médios.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Tudo do plano Starter</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Assembleias Digitais com Votação</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Google Drive Sync de Atas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500" /> Painel Analítico do Síndico</li>
              </ul>
            </div>
            <Button variant="primary" size="sm" className="w-full mt-6" onClick={() => setCurrentView('dashboard')}>
              Testar Agora
            </Button>
          </Card>

          {/* Enterprise */}
          <Card className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Enterprise</span>
              <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white">R$ 690 <span className="text-xs font-normal text-slate-500">/mês</span></h3>
              <p className="text-xs text-slate-500 mt-2">Para grandes complexos, resorts e administradoras.</p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Tudo do plano Professional</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Assistente IA com RAG de Convenção</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Controle de Portaria & Acesso Facial</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500" /> Suporte VIP com SLA de 1 hora</li>
              </ul>
            </div>
            <Button variant="outline" size="sm" className="w-full mt-6" onClick={() => setCurrentView('dashboard')}>
              Explorar Enterprise
            </Button>
          </Card>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="mt-24 px-4 sm:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">
            Pronto para conhecer a fundação do Condominium Platform?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-xl mx-auto mb-8">
            Navegue pelo mockup completo com dados realistas, alternância de condomínios e simulação mobile.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-bold"
            rightIcon={<ArrowRight className="w-5 h-5 text-blue-600" />}
            onClick={() => setCurrentView('dashboard')}
          >
            Entrar na Plataforma Agora
          </Button>
        </div>
      </section>
    </div>
  );
};
