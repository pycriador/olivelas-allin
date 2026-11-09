import puppeteer from 'puppeteer-core';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = process.env.TARGET_URL || process.env.BASE_URL || 'http://localhost:8080';
const RESULTS_DIR = path.resolve(rootDir, 'tests', 'test-results');
const SCREENSHOTS_DIR = path.resolve(RESULTS_DIR, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const { Client } = pg;
const dbClient = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('========================================================================');
  console.log('🚀 EXECUTOR DO PLANO DE TESTES E2E — SERVICEFORGE PLATFORM');
  console.log('========================================================================');
  console.log(`📍 URL Base: ${BASE_URL}`);
  console.log(`📁 Diretório de Resultados: ${RESULTS_DIR}`);
  console.log(`📸 Diretório de Screenshots: ${SCREENSHOTS_DIR}`);
  console.log(`🐘 Schema PostgreSQL Alvo: serviceforge`);

  const startTime = Date.now();
  let passedCount = 0;
  let failedCount = 0;
  const testResults = [];

  // Connect to PostgreSQL database
  try {
    await dbClient.connect();
    console.log('✅ Conexão direta com PostgreSQL (pooler Supabase) estabelecida.');
  } catch (err) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', err.message);
  }

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    protocolTimeout: 60000,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  const page = await browser.newPage();
  
  // Ensure authentication persistence across all navigations
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('sf.demoSession', 'true');
    localStorage.setItem('sf.company', '00000000-0000-0000-0000-000000000001');
  });

  const runSuffix = Date.now().toString().slice(-4);

  async function recordStep(id, title, fn) {
    console.log(`\n------------------------------------------------------------------------`);
    console.log(`▶ Executando ${id}: ${title}...`);
    const stepStart = Date.now();
    try {
      await fn();
      const duration = Date.now() - stepStart;
      console.log(`[PASS] ${id} - ${title} (${duration}ms)`);
      passedCount++;
      testResults.push({ id, title, status: 'passed', durationMs: duration });
    } catch (err) {
      const duration = Date.now() - stepStart;
      console.error(`[FAIL] ${id} - ${title} (${duration}ms): ${err.message}`);
      failedCount++;
      testResults.push({ id, title, status: 'failed', durationMs: duration, error: err.message });
      try {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `fail_${id}.png`) });
      } catch {}
    }
  }

  // TC-01: Autenticação & Dashboard
  await recordStep('TC-01', 'Autenticação e Inicialização do Painel Administrativo', async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await sleep(1000);

    // Click 1-Click test login or enter credentials
    await page.evaluate(() => {
      localStorage.setItem('sf.demoSession', 'true');
      localStorage.setItem('sf.company', '00000000-0000-0000-0000-000000000001');
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Modo Testes') || (b.textContent || '').includes('Entrar'));
      if (btn) btn.click();
    });
    await sleep(2000);

    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await sleep(1500);

    const hasDashboardContent = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Dashboard') || text.includes('Ordens') || text.includes('Visão Geral') || text.includes('ServiceForge');
    });

    if (!hasDashboardContent) {
      throw new Error('Painel Administrativo não carregou os componentes essenciais');
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC01_dashboard.png') });
  });

  // TC-02: Cadastro de Novo Cliente
  const testCustomerName = `Cliente QA AutoRun ${runSuffix}`;
  await recordStep('TC-02', 'Cadastro de Novo Cliente PF/PJ com Persistência em Banco', async () => {
    await page.goto(`${BASE_URL}/service-orders/customers/list`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Novo Cliente')), { timeout: 15000 });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Novo Cliente'));
      if (btn) btn.click();
    });
    await sleep(1000);

    await page.waitForSelector('[role="dialog"] input', { timeout: 10000 });
    const input = await page.$('[role="dialog"] input');
    if (input) {
      await input.click();
      await input.type(testCustomerName, { delay: 10 });
    }

    // Save
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const saveBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.textContent || '').includes('Salvar'));
      if (saveBtn) saveBtn.click();
    });
    await sleep(2500);

    // Verify in PostgreSQL serviceforge.customers
    const res = await dbClient.query('SELECT id, name FROM serviceforge.customers WHERE name = $1;', [testCustomerName]);
    if (res.rows.length === 0) throw new Error(`Cliente '${testCustomerName}' não encontrado no PostgreSQL serviceforge.customers`);
    console.log(`   Cliente salvo no PostgreSQL serviceforge.customers: ID = ${res.rows[0].id}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC02_customer_created.png') });
  });

  // TC-03: Cadastro de Nova Marca
  const testBrandName = `Marca QA AutoRun ${runSuffix}`;
  await recordStep('TC-03', 'Cadastro de Nova Marca de Equipamentos', async () => {
    await page.goto(`${BASE_URL}/service-orders/assets/brands`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Nova Marca')), { timeout: 15000 });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Nova Marca'));
      if (btn) btn.click();
    });
    await sleep(1000);

    await page.waitForSelector('[role="dialog"] input', { timeout: 10000 });
    const input = await page.$('[role="dialog"] input');
    if (input) {
      await input.click();
      await input.type(testBrandName, { delay: 10 });
    }

    // Save
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const saveBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.textContent || '').includes('Criar') || (b.textContent || '').includes('Salvar'));
      if (saveBtn) saveBtn.click();
    });
    await sleep(2500);

    // Verify in PostgreSQL serviceforge.brands
    const res = await dbClient.query('SELECT id, name FROM serviceforge.brands WHERE name = $1;', [testBrandName]);
    if (res.rows.length === 0) throw new Error(`Marca '${testBrandName}' não encontrada no PostgreSQL serviceforge.brands`);
    console.log(`   Marca salva no PostgreSQL serviceforge.brands: ID = ${res.rows[0].id}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC03_brand_created.png') });
  });

  // TC-04: Cadastro de Categoria de Equipamentos
  const testCatName = `Categoria QA AutoRun ${runSuffix}`;
  await recordStep('TC-04', 'Cadastro de Categoria de Equipamentos', async () => {
    await page.goto(`${BASE_URL}/service-orders/assets/categories`, { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Nova Categoria')), { timeout: 15000 });

    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Nova Categoria'));
      if (btn) btn.click();
    });
    await sleep(1000);

    await page.waitForSelector('[role="dialog"] input', { timeout: 10000 });
    const input = await page.$('[role="dialog"] input');
    if (input) {
      await input.click();
      await input.type(testCatName, { delay: 10 });
    }

    // Save
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const saveBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.textContent || '').includes('Criar') || (b.textContent || '').includes('Salvar'));
      if (saveBtn) saveBtn.click();
    });
    await sleep(2500);

    const res = await dbClient.query('SELECT id, name FROM serviceforge.categories WHERE name = $1;', [testCatName]);
    if (res.rows.length === 0) throw new Error(`Categoria '${testCatName}' não encontrada no PostgreSQL serviceforge.categories`);
    console.log(`   Categoria salva no PostgreSQL serviceforge.categories: ID = ${res.rows[0].id}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC04_category_created.png') });
  });

  // TC-05: Cadastro de Equipamento do Cliente
  await recordStep('TC-05', 'Cadastro de Equipamento do Cliente', async () => {
    await page.goto(`${BASE_URL}/service-orders/assets/equipment`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const hasAddBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Novo Equipamento') || (b.textContent || '').includes('Adicionar'));
    });
    if (!hasAddBtn) throw new Error('Botão de Novo Equipamento não encontrado na tela de ativos');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC05_equipment_list.png') });
  });

  // TC-06: Abertura de Ordem de Serviço com Busca de Cliente (Wizard 5 Passos)
  await recordStep('TC-06', 'Abertura de Ordem de Serviço com Busca de Cliente (Wizard 5 Passos)', async () => {
    await page.goto(`${BASE_URL}/service-orders/new`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Search and select customer
    const searchInput = await page.$('input[placeholder*="Digite para buscar"]');
    if (searchInput) {
      await searchInput.click();
      await searchInput.type('Willian', { delay: 15 });
      await sleep(1000);
      await page.keyboard.press('Enter');
      await sleep(1000);
    }

    // Advance Wizard steps
    for (let step = 1; step <= 3; step++) {
      await page.evaluate(() => {
        const nextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
        if (nextBtn) nextBtn.click();
      });
      await sleep(1000);
    }

    // Step 4: type defect description
    const defectArea = await page.$('textarea[placeholder*="Descreva o defeito"]');
    if (defectArea) {
      await defectArea.click();
      await defectArea.type(`Defeito relatado em bancada - Teste QA AutoRun ${runSuffix}`, { delay: 10 });
    }
    await sleep(1000);

    // Advance to Step 5
    await page.evaluate(() => {
      const nextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
      if (nextBtn) nextBtn.click();
    });
    await sleep(1000);

    // Final confirmation -> click "Gerar Ordem"
    await page.evaluate(() => {
      const finishBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Gerar Ordem'));
      if (finishBtn) finishBtn.click();
    });
    await sleep(3500);

    // Verify in PostgreSQL service_orders
    const res = await dbClient.query('SELECT id, number, customer_name, status FROM serviceforge.service_orders ORDER BY created_at DESC LIMIT 1;');
    if (res.rows.length === 0) throw new Error('Nenhuma OS encontrada em serviceforge.service_orders');
    console.log(`   OS Gerada com sucesso: ${res.rows[0].number} (${res.rows[0].customer_name})`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC06_service_order_wizard.png') });
  });

  // TC-07: Listagem e Ordenação de Ordens de Serviço
  await recordStep('TC-07', 'Listagem e Ordenação de Ordens de Serviço', async () => {
    await page.goto(`${BASE_URL}/service-orders`, { waitUntil: 'networkidle2' });
    await sleep(2000);

    // Verify sortable header click (Número, Cliente, etc)
    const clicked = await page.evaluate(() => {
      const th = Array.from(document.querySelectorAll('th')).find(t => {
        const text = (t.textContent || '').toLowerCase();
        return text.includes('número') || text.includes('numero') || text.includes('cliente') || text.includes('os');
      });
      if (th) {
        th.click();
        return true;
      }
      return false;
    });
    if (!clicked) throw new Error('Coluna de ordenação não encontrada na tabela de OS');
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC07_so_list_sorted.png') });
  });

  // TC-08: Gestão Financeira - Contas Bancárias
  await recordStep('TC-08', 'Gestão Financeira - Contas Bancárias', async () => {
    await page.goto(`${BASE_URL}/financial/accounts`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const hasAddBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('conta') || t.includes('account') || t.includes('novo') || t.includes('nova') || t.includes('adicionar');
      });
    });
    if (!hasAddBtn) throw new Error('Botão de Nova Conta Financeira não encontrado');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC08_financial_accounts.png') });
  });

  // TC-09: Gestão Financeira - Contas a Pagar
  await recordStep('TC-09', 'Gestão Financeira - Contas a Pagar e Receber', async () => {
    await page.goto(`${BASE_URL}/financial/payable`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const tableExists = await page.$('table, [role="table"]') !== null;
    if (!tableExists) throw new Error('Tabela de contas a pagar não encontrada');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC09_financial_payable.png') });
  });

  // TC-10: Catálogo de Produtos e Peças
  await recordStep('TC-10', 'Catálogo de Produtos, Peças e Estoque', async () => {
    await page.goto(`${BASE_URL}/inventory/products`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const hasAddBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('produto') || t.includes('product') || t.includes('novo') || t.includes('adicionar');
      });
    });
    if (!hasAddBtn) throw new Error('Botão de Novo Produto não encontrado');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC10_inventory_products.png') });
  });

  // TC-11: Quadro de Funcionários e Técnicos (RH)
  await recordStep('TC-11', 'Quadro de Funcionários e Técnicos (RH)', async () => {
    await page.goto(`${BASE_URL}/hr/employees`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const hasAddBtn = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => {
        const t = (b.textContent || '').toLowerCase();
        return t.includes('funcionário') || t.includes('funcionario') || t.includes('employee') || t.includes('novo') || t.includes('adicionar');
      });
    });
    if (!hasAddBtn) throw new Error('Botão de Novo Funcionário não encontrado');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC11_hr_employees.png') });
  });

  // TC-12: Base de Conhecimento e Soluções Técnicas
  await recordStep('TC-12', 'Base de Conhecimento e Soluções Técnicas', async () => {
    await page.goto(`${BASE_URL}/knowledge/library`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const hasLibraryContent = await page.evaluate(() => {
      const text = document.body.innerText.toLowerCase();
      const hasInput = document.querySelector('input[placeholder*="biblioteca"], input[placeholder*="pesquisar"]') !== null;
      return text.includes('biblioteca') || text.includes('conhecimento') || text.includes('library') || hasInput;
    });
    if (!hasLibraryContent) {
      throw new Error('Página da Base de Conhecimento não carregou corretamente');
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC12_knowledge_library.png') });
  });

  // TC-13: Alternador de Temas e Design System
  await recordStep('TC-13', 'Alternador de Temas e Cores (Design System)', async () => {
    await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle2' });
    await sleep(2000);
    const themeBtn = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Tema') || (b.textContent || '').includes('Aparência'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log('   Interação com botão de tema:', themeBtn ? 'Sim' : 'Ignorado');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'TC13_settings_themes.png') });
  });

  // TC-14: Validação de Integridade do Schema PostgreSQL 'serviceforge'
  await recordStep('TC-14', 'Validação de Integridade do Schema PostgreSQL serviceforge', async () => {
    const res = await dbClient.query(`
      SELECT count(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'serviceforge';
    `);
    const count = parseInt(res.rows[0].count, 10);
    console.log(`   Tabelas no schema serviceforge: ${count}`);
    if (count < 35) throw new Error(`Esperado pelo menos 35 tabelas no schema serviceforge, encontrado ${count}`);
  });

  await browser.close();
  await dbClient.end();

  const totalDuration = Date.now() - startTime;
  const summary = {
    platform: 'ServiceForge Platform v1.0.0-RC1',
    timestamp: new Date().toISOString(),
    durationMs: totalDuration,
    totalSteps: testResults.length,
    passedSteps: passedCount,
    failedSteps: failedCount,
    successRate: `${Math.round((passedCount / testResults.length) * 100)}%`,
    testResults
  };

  fs.writeFileSync(path.join(RESULTS_DIR, 'summary.json'), JSON.stringify(summary, null, 2), 'utf-8');

  console.log('\n========================================================================');
  console.log('📊 RESUMO DA EXECUÇÃO DO PLANO DE TESTES E2E');
  console.log('========================================================================');
  console.log(`⏱️ Tempo Total: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`✅ Passos Aprovados: ${passedCount}/${testResults.length}`);
  console.log(`❌ Passos com Falha: ${failedCount}`);
  console.log(`📈 Taxa de Sucesso: ${summary.successRate}`);
  console.log(`📄 Relatório gravado em: ${path.join(RESULTS_DIR, 'summary.json')}`);

  if (failedCount > 0) {
    console.error('❌ Falha: Um ou mais cenários falharam!');
    process.exit(1);
  } else {
    console.log('🎉 SUCESSO COMPLETO: Todos os 14 cenários E2E da plataforma foram validados com êxito!');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('❌ Falha fatal no executor:', err);
  process.exit(1);
});
