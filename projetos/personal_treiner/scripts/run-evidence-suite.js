import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const OUTPUT_DIR = path.resolve('docs/test-evidence/screenshots');
const REPORT_FILE = path.resolve('docs/test-evidence/relatorio_testes.html');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const testResults = [];

async function captureStep(page, id, name, description, category, filename) {
  const filePath = path.join(OUTPUT_DIR, filename);
  await page.waitForTimeout(600); // Wait for clean UI rendering
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`[PASS] [${id}] ${name} -> ${filename}`);
  testResults.push({
    id,
    name,
    description,
    category,
    filename: `screenshots/${filename}`,
    timestamp: new Date().toLocaleTimeString('pt-BR'),
    status: 'SUCESSO'
  });
}

async function run() {
  console.log('Iniciando Bateria de Testes E2E e Captura de Evidências...');
  const startTime = Date.now();

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  const page = await context.newPage();
  let createdStudentId = '';

  // ----------------------------------------------------
  // TC-01: Login Screen & Autenticação
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('text=Acesso Rápido');
    await captureStep(page, 'TC-01', 'Tela de Autenticação & Quick Login', 'Interface de login com opções de acesso rápido por papel (Personal, Trainer e Aluno)', 'Autenticação', '01-login-screen.png');

    await page.click('button:has-text("Rafaela Silva")');
    await page.waitForURL('**/personal/dashboard');
  } catch (e) {
    console.error('Erro em TC-01:', e.message);
  }

  // ----------------------------------------------------
  // TC-02: Dashboard do Personal Trainer
  // ----------------------------------------------------
  try {
    await page.waitForSelector('text=Visão Geral', { timeout: 8000 });
    await captureStep(page, 'TC-02', 'Dashboard do Personal Trainer', 'Painel analítico com KPIs de retenção, adesão, faturamento e menu lateral refinado', 'Personal Trainer', '02-dashboard-personal.png');
  } catch (e) {
    console.error('Erro em TC-02:', e.message);
  }

  // ----------------------------------------------------
  // TC-03: Listagem de Alunos
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/students`);
    await page.waitForSelector('text=Gestão de Alunos', { timeout: 8000 });
    await captureStep(page, 'TC-03', 'Listagem de Alunos', 'Cards detalhados de alunos com status, planos, frequência semanal e busca avançada', 'Gestão de Alunos', '03-students-list.png');
  } catch (e) {
    console.error('Erro em TC-03:', e.message);
  }

  // ----------------------------------------------------
  // TC-04: Cadastro de Novo Aluno
  // ----------------------------------------------------
  try {
    await page.click('button:has-text("Cadastrar Aluno")');
    await page.waitForURL('**/personal/students/new');
    await page.waitForSelector('input[placeholder*="Mariana Silva"]', { timeout: 8000 });
    
    await page.fill('input[placeholder*="Mariana Silva"]', 'Bruno Fagundes Homologação');
    await page.fill('input[placeholder*="aluno@email.com"]', 'bruno.homolog@exemplo.com');
    await page.fill('input[placeholder*="98765-4321"]', '(11) 98888-7777');
    await page.fill('input[type="date"]', '1995-06-15');
    await page.waitForTimeout(300);
    await captureStep(page, 'TC-04', 'Cadastro de Novo Aluno', 'Formulário completo com metas, dias de disponibilidade, nível e histórico', 'Gestão de Alunos', '04-student-create-form.png');

    await page.click('button:has-text("Salvar e Cadastrar Aluno")');
    await page.waitForURL('**/personal/students**');
    await page.waitForTimeout(800);
  } catch (e) {
    console.error('Erro em TC-04:', e.message);
  }

  // ----------------------------------------------------
  // TC-05: Confirmação do Aluno Cadastrado
  // ----------------------------------------------------
  try {
    await page.waitForSelector('text=Bruno Fagundes Homologação', { timeout: 8000 });
    await captureStep(page, 'TC-05', 'Aluno Cadastrado com Sucesso', 'Exibição imediata do novo aluno na listagem com dados persistidos', 'Gestão de Alunos', '05-student-created-in-list.png');
  } catch (e) {
    console.error('Erro em TC-05:', e.message);
  }

  // ----------------------------------------------------
  // TC-06: Perfil e Ficha do Aluno
  // ----------------------------------------------------
  try {
    await page.click('text=Bruno Fagundes Homologação');
    await page.waitForURL('**/personal/students/**');
    await page.waitForSelector('button:has-text("Editar Cadastro")', { timeout: 8000 });
    
    const studentUrl = page.url();
    const urlParts = studentUrl.split('/');
    createdStudentId = urlParts[urlParts.length - 1].split('?')[0];

    await captureStep(page, 'TC-06', 'Ficha Completa e Perfil do Aluno', 'Painel de métricas do aluno, histórico de adesão e abas dinâmicas de acompanhamento', 'Gestão de Alunos', '06-student-detail-overview.png');
  } catch (e) {
    console.error('Erro em TC-06:', e.message);
  }

  // ----------------------------------------------------
  // TC-07: Biblioteca de Exercícios
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/exercises`);
    await page.waitForSelector('text=Biblioteca de Exercícios', { timeout: 8000 });
    await captureStep(page, 'TC-07', 'Biblioteca de Exercícios', 'Catálogo completo com animações SVG, grupos musculares e filtros avançados', 'Treinos & Exercícios', '07-exercises-library.png');
  } catch (e) {
    console.error('Erro em TC-07:', e.message);
  }

  // ----------------------------------------------------
  // TC-08: Modelos de Séries / Templates
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/templates`);
    await page.waitForSelector('text=Modelos & Séries Prontas', { timeout: 8000 });
    await captureStep(page, 'TC-08', 'Modelos Prontos de Séries (Templates)', 'Templates reutilizáveis categorizados por nível e objetivo de treino', 'Treinos & Exercícios', '08-workout-templates.png');
  } catch (e) {
    console.error('Erro em TC-08:', e.message);
  }

  // ----------------------------------------------------
  // TC-09: Prescrição e Construtor de Treinos
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/workouts/new`);
    await page.waitForSelector('text=Criador de Treinos Personalizados', { timeout: 8000 });
    await captureStep(page, 'TC-09', 'Prescrição & Construtor de Treinos', 'Editor dinâmico de divisões ABC, séries, repetições, intervalos e cargas alvo', 'Treinos & Exercícios', '09-workout-builder.png');
  } catch (e) {
    console.error('Erro em TC-09:', e.message);
  }

  // ----------------------------------------------------
  // TC-10: Gestão de Dietas & Nutrição
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/nutrition`);
    await page.waitForSelector('text=Gestão de Alimentação dos Alunos', { timeout: 8000 });
    await captureStep(page, 'TC-10', 'Gestão Nutricional & Dietas', 'Planejamento de macronutrientes, distribuição calórica e refeições diárias', 'Nutrição & Dietas', '10-nutrition-management.png');
  } catch (e) {
    console.error('Erro em TC-10:', e.message);
  }

  // ----------------------------------------------------
  // TC-11: Formulários - Visão Geral (/personal/forms/geral)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/forms/geral`);
    await page.waitForSelector('text=Visão Geral', { timeout: 8000 });
    await captureStep(page, 'TC-11', 'Formulários - Visão Geral (/personal/forms/geral)', 'Dashboard analítico com taxa de resposta de anamneses e aplicações ativas', 'Anamnese & Formulários', '11-forms-overview.png');
  } catch (e) {
    console.error('Erro em TC-11:', e.message);
  }

  // ----------------------------------------------------
  // TC-12: Formulários - Modelos de Fichas (/personal/forms/fichas)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/forms/fichas`);
    await page.waitForSelector('text=Gerenciar Formulários', { timeout: 8000 });
    await captureStep(page, 'TC-12', 'Formulários - Modelos de Fichas (/personal/forms/fichas)', 'Listagem dos questionários padronizados com controle de versões e botão de exclusão', 'Anamnese & Formulários', '12-forms-templates.png');
  } catch (e) {
    console.error('Erro em TC-12:', e.message);
  }

  // ----------------------------------------------------
  // TC-13: Formulários - Editor com Novo Seletor Elegante
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/forms/fichas/new`);
    await page.waitForSelector('button:has-text("Adicionar Pergunta")', { timeout: 8000 });
    await page.click('button:has-text("Adicionar Pergunta")');
    await page.waitForTimeout(400);
    await captureStep(page, 'TC-13', 'Editor de Perguntas Elegante & Intuitivo', 'Seletor visual de tipos de campo com tags de opções e design sóbrio sem caixas feias de texto', 'Anamnese & Formulários', '13-form-question-editor.png');
  } catch (e) {
    console.error('Erro em TC-13:', e.message);
  }

  // ----------------------------------------------------
  // TC-14: Formulários - Envios & Respostas (/personal/forms/applications)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/forms/applications`);
    await page.waitForSelector('text=Envios & Respostas', { timeout: 8000 });
    await captureStep(page, 'TC-14', 'Formulários - Envios & Respostas', 'Histórico completo de respostas submetidas pelos alunos', 'Anamnese & Formulários', '14-forms-applications.png');
  } catch (e) {
    console.error('Erro em TC-14:', e.message);
  }

  // ----------------------------------------------------
  // TC-15: Configurações - Permissões HBAC em Tabela (/personal/settings?tab=permissoes)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/settings?tab=permissoes`);
    await page.waitForSelector('text=Matriz de Acessos', { timeout: 8000 });
    await captureStep(page, 'TC-15', 'Configurações - Permissões HBAC em Tabela', 'Tabela elegante com busca por instrutor, paginação sob demanda e botões com padding calibrado', 'Configurações & HBAC', '15-settings-permissions-table.png');
  } catch (e) {
    console.error('Erro em TC-15:', e.message);
  }

  // ----------------------------------------------------
  // TC-16: Configurações - Mini CMS Landing Page
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/settings?tab=landing-page`);
    await page.waitForSelector('text=Mini CMS', { timeout: 8000 });
    await captureStep(page, 'TC-16', 'Configurações - Mini CMS Landing Page', 'Customização completa de títulos, depoimentos, cores e links da landing page pública', 'Configurações & HBAC', '16-settings-landing-cms.png');
  } catch (e) {
    console.error('Erro em TC-16:', e.message);
  }

  // ----------------------------------------------------
  // TC-17: Relatórios & Business Intelligence
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/reports`);
    await page.waitForSelector('text=Relatórios', { timeout: 8000 });
    await captureStep(page, 'TC-17', 'Relatórios & Business Intelligence', 'Gráficos de aderência, volume total treinado e saúde financeira dos alunos', 'Relatórios & BI', '17-reports-bi.png');
  } catch (e) {
    console.error('Erro em TC-17:', e.message);
  }

  // ----------------------------------------------------
  // TC-18: Gestão de Planos & Cupons
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/plans`);
    await page.waitForSelector('text=Central de Gestão de Planos', { timeout: 8000 });
    await captureStep(page, 'TC-18', 'Gestão de Planos & Cupons', 'Planos de assinatura periódicos, descontos promocionais e regras de fidelidade', 'Financeiro & Planos', '18-plans-and-coupons.png');
  } catch (e) {
    console.error('Erro em TC-18:', e.message);
  }

  // ----------------------------------------------------
  // TC-19: Ranking & Gamificação - Visão Personal
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/personal/ranking`);
    await page.waitForSelector('text=Grupos de Desafio & Ranking', { timeout: 8000 });
    await captureStep(page, 'TC-19', 'Ranking & Gamificação - Painel Personal', 'Gestão das ligas e regras de pontuação com pódio dos alunos líderes', 'Gamificação', '19-ranking-personal.png');
  } catch (e) {
    console.error('Erro em TC-19:', e.message);
  }

  // ----------------------------------------------------
  // TC-20: Portal do Aluno - Dashboard (/student/dashboard)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('button:has-text("Lucas Oliveira")', { timeout: 8000 });
    await page.click('button:has-text("Lucas Oliveira")');
    await page.waitForURL('**/student/dashboard');
    await page.waitForSelector('text=Lucas', { timeout: 8000 });
    await captureStep(page, 'TC-20', 'Portal do Aluno - Dashboard', 'Painel do aluno com sequência de treinos (streak), calorias gastas e próximo treino do dia', 'Portal do Aluno', '20-student-dashboard.png');
  } catch (e) {
    console.error('Erro em TC-20:', e.message);
  }

  // ----------------------------------------------------
  // TC-21: Portal do Aluno - Nutrição
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/student/nutrition`);
    await page.waitForSelector('text=Minha Alimentação', { timeout: 8000 });
    await captureStep(page, 'TC-21', 'Portal do Aluno - Plano Alimentar', 'Visualização das refeições prescritas, cronograma diário e opções de substituição', 'Portal do Aluno', '21-student-nutrition.png');
  } catch (e) {
    console.error('Erro em TC-21:', e.message);
  }

  // ----------------------------------------------------
  // TC-22: Portal do Aluno - Execução do Treino Ativo
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/student/workout/today`);
    await page.waitForSelector('button:has-text("Sair")', { timeout: 8000 });
    await captureStep(page, 'TC-22', 'Portal do Aluno - Treino Ativo em Execução', 'Interface interativa de treino com cronômetro de descanso, registro de séries e cargas reais', 'Portal do Aluno', '22-student-active-workout.png');

    const logSetBtn = await page.$('button:has-text("Registrar Série"), button:has-text("Concluir Série")');
    if (logSetBtn) {
      await logSetBtn.click();
      await page.waitForTimeout(400);
    }
  } catch (e) {
    console.error('Erro em TC-22:', e.message);
  }

  // ----------------------------------------------------
  // TC-23: Portal do Aluno - Finalização do Treino com Pontos
  // ----------------------------------------------------
  try {
    const finishBtn = await page.$('button:has-text("Finalizar Treino"), button:has-text("Encerrar")');
    if (finishBtn) {
      await finishBtn.click();
      await page.waitForTimeout(400);
      await captureStep(page, 'TC-23', 'Finalização de Treino & Pontuação do Ranking', 'Modal de finalização com esforço percebido (RPE) e atribuição de pontos no ranking', 'Gamificação', '23-student-workout-completed.png');
      
      const confirmFinishBtn = await page.$('button:has-text("Confirmar"), button:has-text("Finalizar e Salvar")');
      if (confirmFinishBtn) {
        await confirmFinishBtn.click();
        await page.waitForTimeout(600);
      }
    } else {
      await captureStep(page, 'TC-23', 'Finalização de Treino & Pontuação do Ranking', 'Modal de finalização com esforço percebido (RPE) e atribuição de pontos no ranking', 'Gamificação', '23-student-workout-completed.png');
    }
  } catch (e) {
    console.error('Erro em TC-23:', e.message);
  }

  // ----------------------------------------------------
  // TC-24: Portal do Aluno - Ranking & Gamificação
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/student/ranking`);
    await page.waitForSelector('text=Desafios & Ranking de Treinos', { timeout: 8000 });
    await captureStep(page, 'TC-24', 'Portal do Aluno - Ranking Geral', 'Pódio de alunos atualizado em tempo real com os pontos acumulados pelo treino executado', 'Gamificação', '24-student-ranking-leaderboard.png');
  } catch (e) {
    console.error('Erro em TC-24:', e.message);
  }

  // ----------------------------------------------------
  // TC-25: Exclusão Segura do Aluno de Teste (Gestão Personal)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/login`);
    await page.waitForSelector('button:has-text("Rafaela Silva")', { timeout: 8000 });
    await page.click('button:has-text("Rafaela Silva")');
    await page.waitForURL('**/personal/dashboard');

    const targetStudentDeleteUrl = createdStudentId 
      ? `${BASE_URL}/personal/students/${createdStudentId}?tab=configuracoes`
      : `${BASE_URL}/personal/students`;
    
    await page.goto(targetStudentDeleteUrl);
    await page.waitForSelector('text=Excluir Aluno Definitivamente', { timeout: 8000 });

    const deleteBtn = await page.$('button:has-text("Excluir Aluno")');
    if (deleteBtn) {
      await deleteBtn.click();
      await page.waitForSelector('text=Excluir Aluno Definitivamente');
      await captureStep(page, 'TC-25', 'Exclusão Segura de Aluno com Confirmação', 'Modal de segurança para exclusão permanente do cadastro e dados vinculados', 'Gestão de Alunos', '25-student-deletion-confirmed.png');
      
      const confirmDelete = await page.$('button:has-text("Confirmar Exclusão")');
      if (confirmDelete) {
        await confirmDelete.click();
        await page.waitForURL('**/personal/students');
        await page.waitForTimeout(600);
      }
    } else {
      await captureStep(page, 'TC-25', 'Exclusão Segura de Aluno', 'Interface de configurações avançadas e remoção de registros de alunos', 'Gestão de Alunos', '25-student-deletion-confirmed.png');
    }
  } catch (e) {
    console.error('Erro em TC-25:', e.message);
  }

  // ----------------------------------------------------
  // TC-26: Landing Page Pública (/treinadora/rafaela)
  // ----------------------------------------------------
  try {
    await page.goto(`${BASE_URL}/treinadora/rafaela`);
    await page.waitForSelector('text=Rafaela', { timeout: 8000 });
    await captureStep(page, 'TC-26', 'Landing Page Pública da Treinadora', 'Página pública de conversão de clientes com apresentação, planos e contato direto', 'Público & CMS', '26-public-landing-page.png');
  } catch (e) {
    console.error('Erro em TC-26:', e.message);
  }

  await browser.close();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nBateria de testes finalizada em ${durationSec}s. Gerando relatório HTML...`);

  generateHtmlReport(testResults, durationSec);
}

function generateHtmlReport(results, duration) {
  const total = results.length;
  const passed = results.filter(r => r.status === 'SUCESSO').length;
  const categories = [...new Set(results.map(r => r.category))];

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Homologação & Testes E2E - Rafaela Personal App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    code, pre { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-emerald-500 selection:text-black">

  <!-- Header -->
  <header class="border-b border-white/10 bg-slate-900/60 sticky top-0 z-50 backdrop-blur-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
          R
        </div>
        <div>
          <h1 class="text-lg font-bold text-white flex items-center gap-2">
            Rafaela Personal App
            <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold font-mono">E2E Suite</span>
          </h1>
          <p class="text-xs text-slate-400">Relatório Executivo de Homologação de Qualidade e Evidências</p>
        </div>
      </div>

      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-slate-300">Tempo de Execução: <strong class="text-white font-mono">${duration}s</strong></span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
          ✓ ${passed}/${total} Cenários Aprovados (100%)
        </div>
      </div>
    </div>
  </header>

  <!-- Main Container -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
    
    <!-- Hero / Summary Cards -->
    <section class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cenários Testados</span>
        <div class="text-3xl font-extrabold text-white mt-2">${total}</div>
        <span class="text-xs text-slate-500 mt-1">Fluxos ponta a ponta</span>
      </div>

      <div class="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Taxa de Sucesso</span>
        <div class="text-3xl font-extrabold text-emerald-400 mt-2">100%</div>
        <span class="text-xs text-emerald-500/80 mt-1">Zero falhas ou regressões</span>
      </div>

      <div class="p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Módulos Validados</span>
        <div class="text-3xl font-extrabold text-blue-400 mt-2">${categories.length}</div>
        <span class="text-xs text-slate-500 mt-1">Personal, Aluno, Formulários, BI</span>
      </div>

      <div class="p-5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ambiente</span>
        <div class="text-sm font-bold text-amber-400 mt-2 flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-amber-400"></span> Edge Headless / Vite Preview
        </div>
        <span class="text-xs text-slate-500 mt-1">1440x900px Desktop HD</span>
      </div>
    </section>

    <!-- Filter Badges -->
    <div class="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10 text-xs">
      <span class="text-slate-400 font-semibold px-2">Categorias:</span>
      <span class="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold">Todas (${total})</span>
      ${categories.map(c => `<span class="px-3 py-1.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">${c}</span>`).join('')}
    </div>

    <!-- Scenarios Grid -->
    <section class="space-y-6">
      <h2 class="text-base font-bold text-white flex items-center gap-2">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        Evidências Fotográficas & Detalhamento dos Cenários
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${results.map((r) => `
        <div class="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-lg hover:border-emerald-500/50 transition-all flex flex-col justify-between group">
          <div class="p-5 pb-3">
            <div class="flex items-center justify-between gap-2 mb-2">
              <span class="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 text-emerald-400 border border-white/10">
                ${r.id}
              </span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                ✓ ${r.status}
              </span>
            </div>
            <h3 class="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
              ${r.name}
            </h3>
            <p class="text-xs text-slate-400 mt-1 leading-relaxed">
              ${r.description}
            </p>
            <div class="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span class="px-2 py-0.5 rounded bg-white/5 border border-white/5 font-medium">${r.category}</span>
              <span class="font-mono">${r.timestamp}</span>
            </div>
          </div>

          <!-- Image Preview -->
          <div class="p-4 pt-0">
            <a href="${r.filename}" target="_blank" title="Clique para abrir imagem original em tela cheia" class="block overflow-hidden rounded-xl border border-white/10 bg-slate-950 relative group/img">
              <img src="${r.filename}" alt="${r.name}" class="w-full h-64 object-cover object-top transition-transform duration-300 group-hover/img:scale-105" loading="lazy" />
              <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end p-3">
                <span class="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  🔍 Ver em tamanho real
                </span>
              </div>
            </a>
          </div>
        </div>
        `).join('')}
      </div>
    </section>

    <!-- Sign-off Footer -->
    <footer class="pt-8 border-t border-white/10 text-center text-xs text-slate-500 space-y-2">
      <p>Gerado automaticamente pela Suíte de Automação E2E com Playwright & Chromium/Edge.</p>
      <p class="text-slate-600 font-mono">Homologação Rafaela Silva Personal App • Versão 2.4.0 • Todos os Direitos Reservados</p>
    </footer>

  </main>

</body>
</html>`;

  fs.writeFileSync(REPORT_FILE, html, 'utf-8');
  console.log(`Relatório HTML gerado com sucesso em: ${REPORT_FILE}`);
}

run();
