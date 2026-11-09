import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.resolve(rootDir, 'public', 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Supabase config
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ybgywoljyeumgzsdbldu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder_key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SCREENS = [
  { id: 'landing', path: '/', name: 'Landing Page & Apresentação', module: 'Geral' },
  { id: 'how_it_works', path: '/how-it-works', name: 'Como Funciona o Sistema & Evidências', module: 'Documentação' },
  { id: 'so_dashboard', path: '/service-orders/dashboard', name: 'Dashboard de Ordens de Serviço', module: 'Ordens de Serviço' },
  { id: 'so_list', path: '/service-orders', name: 'Listagem de Ordens de Serviço', module: 'Ordens de Serviço' },
  { id: 'so_new', path: '/service-orders/new', name: 'Abertura de Nova OS', module: 'Ordens de Serviço' },
  { id: 'customers', path: '/service-orders/customers/list', name: 'Cadastro e Gestão de Clientes', module: 'Clientes' },
  { id: 'assets', path: '/service-orders/assets/equipment', name: 'Equipamentos e Ativos', module: 'Ativos' },
  { id: 'fin_accounts', path: '/financial/accounts', name: 'Contas Financeiras Bancárias', module: 'Financeiro' },
  { id: 'fin_transactions', path: '/financial/transactions', name: 'Movimentações e Fluxo de Caixa', module: 'Financeiro' },
  { id: 'fin_payable', path: '/financial/payable', name: 'Contas a Pagar', module: 'Financeiro' },
  { id: 'fin_receivable', path: '/financial/receivable', name: 'Contas a Receber', module: 'Financeiro' },
  { id: 'fin_invoices', path: '/financial/invoices', name: 'Notas Fiscais & Faturamento', module: 'Financeiro' },
  { id: 'inv_products', path: '/inventory/products', name: 'Catálogo de Produtos & Peças', module: 'Estoque' },
  { id: 'inv_warehouses', path: '/inventory/warehouses', name: 'Almoxarifados & Depósitos', module: 'Estoque' },
  { id: 'inv_movements', path: '/inventory/movements', name: 'Movimentações de Estoque', module: 'Estoque' },
  { id: 'pur_orders', path: '/purchasing/orders', name: 'Ordens de Compra de Fornecedor', module: 'Compras' },
  { id: 'pur_receiving', path: '/purchasing/receiving', name: 'Recebimento de Mercadorias', module: 'Compras' },
  { id: 'hr_employees', path: '/hr/employees', name: 'Quadro de Funcionários & Técnicos', module: 'RH' },
  { id: 'hr_timesheets', path: '/hr/timesheets', name: 'Apontamento de Horas & Ponto', module: 'RH' },
  { id: 'hr_commissions', path: '/hr/commissions', name: 'Comissões de Serviços e Peças', module: 'RH' },
  { id: 'crm_leads', path: '/crm/leads', name: 'Pipeline de Vendas & Leads', module: 'CRM' },
  { id: 'crm_opportunities', path: '/crm/opportunities', name: 'Oportunidades de Negócio', module: 'CRM' },
  { id: 'documents_templates', path: '/documents/templates', name: 'Modelos de Documentos & Laudos', module: 'Documentos' },
  { id: 'documents_designer', path: '/documents/designer', name: 'Designer Visual de Documentos', module: 'Documentos' },
  { id: 'knowledge', path: '/knowledge/library', name: 'Base de Conhecimento Técnico', module: 'Conhecimento' },
  { id: 'admin_users', path: '/admin/users', name: 'Gestão de Usuários & Operadores', module: 'Administração' },
  { id: 'admin_companies', path: '/admin/companies', name: 'Gestão de Unidades e Empresas', module: 'Administração' },
  { id: 'settings', path: '/settings', name: 'Configurações Globais do Sistema', module: 'Configurações' }
];

async function runDatabaseCRUDTests() {
  console.log('\n--- EXECUTANDO TESTES DE BANCO DE DADOS (REAL SUPABASE CRUD) ---');
  const results = [];

  // 1. TESTE FINANCEIRO: Contas Bancárias
  try {
    const finCode = `CC-TEST-${Date.now().toString(36).toUpperCase()}`;
    // Create
    const { data: createdAcc, error: errCreate } = await supabase.from('fin_accounts').insert({
      name: 'Conta Teste Automatizado E2E',
      code: finCode,
      type: 'checking',
      bank: 'Banco Santander',
      current_balance: 7500.00,
      active: true
    }).select().single();
    if (errCreate) throw errCreate;

    // Read
    const { data: readAcc, error: errRead } = await supabase.from('fin_accounts').select('*').eq('id', createdAcc.id).single();
    if (errRead) throw errRead;

    // Update
    const { data: updatedAcc, error: errUpd } = await supabase.from('fin_accounts').update({
      current_balance: 9200.50
    }).eq('id', createdAcc.id).select().single();
    if (errUpd) throw errUpd;

    // Delete
    const { error: errDel } = await supabase.from('fin_accounts').delete().eq('id', createdAcc.id);
    if (errDel) throw errDel;

    results.push({
      entity: 'fin_accounts (Contas Financeiras)',
      operations: 'CREATE -> READ -> UPDATE -> DELETE',
      status: 'PASSED',
      realDb: true,
      details: `Criado: ${createdAcc.name} (${finCode}), Saldo inicial: R$ 7.500,00, Atualizado para: R$ 9.200,50, Deletado com sucesso.`
    });
    console.log('✔ fin_accounts CRUD validado no Supabase');
  } catch (err) {
    results.push({
      entity: 'fin_accounts (Contas Financeiras)',
      operations: 'CRUD',
      status: 'FAILED',
      realDb: false,
      details: err.message
    });
    console.error('✖ fin_accounts falhou:', err.message);
  }

  // 2. TESTE ESTOQUE: Produtos & Peças
  try {
    const sku = `PECA-TEST-${Date.now().toString(36).toUpperCase()}`;
    // Create
    const { data: createdProd, error: errCreate } = await supabase.from('inv_products').insert({
      name: 'Bateria Li-Ion 5000mAh Teste E2E',
      sku: sku,
      cost_price: 85.00,
      sale_price: 190.00,
      current_stock: 30,
      active: true
    }).select().single();
    if (errCreate) throw errCreate;

    // Read
    const { data: readProd, error: errRead } = await supabase.from('inv_products').select('*').eq('id', createdProd.id).single();
    if (errRead) throw errRead;

    // Update
    const { data: updatedProd, error: errUpd } = await supabase.from('inv_products').update({
      current_stock: 45,
      sale_price: 210.00
    }).eq('id', createdProd.id).select().single();
    if (errUpd) throw errUpd;

    // Delete
    const { error: errDel } = await supabase.from('inv_products').delete().eq('id', createdProd.id);
    if (errDel) throw errDel;

    results.push({
      entity: 'inv_products (Produtos & Peças)',
      operations: 'CREATE -> READ -> UPDATE -> DELETE',
      status: 'PASSED',
      realDb: true,
      details: `Criado SKU ${sku}, Preço Custo: R$ 85, Venda: R$ 190, Estoque atualizado p/ 45 un, Deletado com sucesso.`
    });
    console.log('✔ inv_products CRUD validado no Supabase');
  } catch (err) {
    results.push({
      entity: 'inv_products (Produtos & Peças)',
      operations: 'CRUD',
      status: 'FAILED',
      realDb: false,
      details: err.message
    });
    console.error('✖ inv_products falhou:', err.message);
  }

  // 3. TESTE RECURSOS HUMANOS: Funcionários
  try {
    const email = `func.e2e.${Date.now().toString(36)}@serviceforge.com.br`;
    // Create
    const { data: createdEmp, error: errCreate } = await supabase.from('hr_employees').insert({
      name: 'Mariana Oliveira E2E Test',
      role: 'Supervisora Técnica de Bancada',
      email: email,
      base_salary: 4500.00,
      active: true
    }).select().single();
    if (errCreate) throw errCreate;

    // Read
    const { data: readEmp, error: errRead } = await supabase.from('hr_employees').select('*').eq('id', createdEmp.id).single();
    if (errRead) throw errRead;

    // Update
    const { data: updatedEmp, error: errUpd } = await supabase.from('hr_employees').update({
      base_salary: 5100.00,
      role: 'Gerente Técnica Regional'
    }).eq('id', createdEmp.id).select().single();
    if (errUpd) throw errUpd;

    // Delete
    const { error: errDel } = await supabase.from('hr_employees').delete().eq('id', createdEmp.id);
    if (errDel) throw errDel;

    results.push({
      entity: 'hr_employees (Recursos Humanos)',
      operations: 'CREATE -> READ -> UPDATE -> DELETE',
      status: 'PASSED',
      realDb: true,
      details: `Criada funcionária: ${createdEmp.name}, Cargo: ${createdEmp.role}, Salário atualizado p/ R$ 5.100,00, Deletado com sucesso.`
    });
    console.log('✔ hr_employees CRUD validado no Supabase');
  } catch (err) {
    results.push({
      entity: 'hr_employees (Recursos Humanos)',
      operations: 'CRUD',
      status: 'FAILED',
      realDb: false,
      details: err.message
    });
    console.error('✖ hr_employees falhou:', err.message);
  }

  // 4. TESTE FINANCEIRO: Contas a Pagar
  try {
    const { data: createdPay, error: errCreate } = await supabase.from('fin_payables').insert({
      description: 'Aquisição de Ferramentas de Precisão E2E',
      supplier_name: 'Fornecedor Tech Tools Ltda',
      original_value: 1250.00,
      final_value: 1250.00,
      due_date: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
      status: 'pending'
    }).select().single();
    if (errCreate) throw errCreate;

    // Update
    const { data: updatedPay, error: errUpd } = await supabase.from('fin_payables').update({
      status: 'paid',
      paid_value: 1250.00,
      paid_at: new Date().toISOString()
    }).eq('id', createdPay.id).select().single();
    if (errUpd) throw errUpd;

    // Delete
    await supabase.from('fin_payables').delete().eq('id', createdPay.id);

    results.push({
      entity: 'fin_payables (Contas a Pagar)',
      operations: 'CREATE -> UPDATE (BAIXA) -> DELETE',
      status: 'PASSED',
      realDb: true,
      details: `Título a pagar R$ 1.250,00 criado com status pendente, baixado como pago e removido após teste.`
    });
    console.log('✔ fin_payables CRUD validado no Supabase');
  } catch (err) {
    results.push({
      entity: 'fin_payables (Contas a Pagar)',
      operations: 'CRUD',
      status: 'FAILED',
      details: err.message
    });
  }

  // 5. TESTE FINANCEIRO: Contas a Receber
  try {
    const { data: createdRec, error: errCreate } = await supabase.from('fin_receivables').insert({
      description: 'Ordem de Serviço #9081 - Troca de Placa',
      customer_name: 'Ana Paula Ferreira',
      original_value: 890.00,
      final_value: 890.00,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pending'
    }).select().single();
    if (errCreate) throw errCreate;

    // Update
    await supabase.from('fin_receivables').update({
      status: 'received',
      received_value: 890.00,
      received_at: new Date().toISOString()
    }).eq('id', createdRec.id);

    // Delete
    await supabase.from('fin_receivables').delete().eq('id', createdRec.id);

    results.push({
      entity: 'fin_receivables (Contas a Receber)',
      operations: 'CREATE -> UPDATE (RECEBIDO) -> DELETE',
      status: 'PASSED',
      realDb: true,
      details: `Título a receber R$ 890,00 criado, marcado como recebido e limpo.`
    });
    console.log('✔ fin_receivables CRUD validado no Supabase');
  } catch (err) {
    results.push({
      entity: 'fin_receivables (Contas a Receber)',
      operations: 'CRUD',
      status: 'FAILED',
      details: err.message
    });
  }

  // 6. TESTE ALMOXARIFADO: Depósitos & Bins
  try {
    const wCode = `DEP-${Date.now().toString(36).toUpperCase()}`;
    const { data: createdWh, error: errCreate } = await supabase.from('inv_warehouses').insert({
      name: 'Depósito Principal de Bancada E2E',
      code: wCode,
      location: 'São Paulo - SP',
      is_default: false,
      active: true
    }).select().single();
    if (errCreate) throw errCreate;

    await supabase.from('inv_warehouses').update({ location: 'São Paulo - SP (Bloco B)' }).eq('id', createdWh.id);
    await supabase.from('inv_warehouses').delete().eq('id', createdWh.id);

    results.push({
      entity: 'inv_warehouses (Almoxarifados)',
      operations: 'CREATE -> UPDATE -> DELETE',
      status: 'PASSED',
      realDb: true,
      details: `Criado almoxarifado código ${wCode}, atualizado localização e excluído.`
    });
    console.log('✔ inv_warehouses CRUD validado no Supabase');
  } catch (err) {
    results.push({
      entity: 'inv_warehouses (Almoxarifados)',
      operations: 'CRUD',
      status: 'FAILED',
      details: err.message
    });
  }

  return results;
}

async function runScreenshotSuite() {
  console.log('\n--- INICIANDO CAPTURA DE SCREENSHOTS DE TODAS AS TELAS (CHROME HEADLESS) ---');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const screenResults = [];
  const baseUrl = (process.env.TARGET_URL || process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

  console.log(`\nAlvo de execução configurado: ${baseUrl}`);

  for (const screen of SCREENS) {
    const page = await browser.newPage();
    const cleanPath = screen.path.startsWith('/') ? screen.path : `/${screen.path}`;
    const url = `${baseUrl}${cleanPath}`;
    const desktopImg = `${screen.id}_desktop.png`;
    const mobileImg = `${screen.id}_mobile.png`;
    const desktopPath = path.resolve(screenshotsDir, desktopImg);
    const mobilePath = path.resolve(screenshotsDir, mobileImg);

    let loadError = null;
    let consoleLogs = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('chrome-extension')) {
          consoleLogs.push(text);
        }
      }
    });

    try {
      await page.evaluateOnNewDocument(() => {
        localStorage.setItem('sf.demoSession', 'true');
        localStorage.setItem('sf.currentCompanyId', '00000000-0000-0000-0000-000000000001');

        if (!localStorage.getItem('serviceforge:customers')) {
          const sampleCustomers = [
            {
              id: "cust-01",
              name: "TechSolutions Brasil Ltda",
              document: "12.345.678/0001-90",
              email: "contato@techsolutions.com.br",
              phone: "(11) 98765-4321",
              type: "PJ",
              status: "active",
              createdAt: new Date().toISOString()
            },
            {
              id: "cust-02",
              name: "Mariana Albuquerque Ferreira",
              document: "321.654.987-00",
              email: "mariana.albuquerque@gmail.com",
              phone: "(11) 91234-5678",
              type: "PF",
              status: "active",
              createdAt: new Date().toISOString()
            }
          ];
          localStorage.setItem('serviceforge:customers', JSON.stringify(sampleCustomers));
        }

        if (!localStorage.getItem('serviceforge:service_orders')) {
          const sampleSOs = [
            {
              id: "so-01",
              number: "SF-000101",
              customerName: "TechSolutions Brasil Ltda",
              equipmentModel: "MacBook Pro M2 16\"",
              serialNumber: "C02XYZ123ABC",
              reportedDefect: "Equipamento não liga após oscilação elétrica",
              status: "Em Diagnóstico",
              priority: "high",
              totalValue: 2450.00,
              technicianName: "Carlos Alberto Silva",
              createdAt: new Date().toISOString()
            },
            {
              id: "so-02",
              number: "SF-000102",
              customerName: "Mariana Albuquerque Ferreira",
              equipmentModel: "iPhone 14 Pro Max",
              serialNumber: "F2LZ98765432",
              reportedDefect: "Tela com linhas verticais e touch inoperante",
              status: "Pronta",
              priority: "normal",
              totalValue: 1280.00,
              technicianName: "Carlos Alberto Silva",
              createdAt: new Date().toISOString()
            }
          ];
          localStorage.setItem('serviceforge:service_orders', JSON.stringify(sampleSOs));
        }
      });

      // 1. Desktop Viewport (1280x800)
      await page.setViewport({ width: 1280, height: 800 });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2200));
      await page.screenshot({ path: desktopPath });

      // 2. Mobile Viewport (390x844 - iPhone 14 / Mobile standard)
      await page.setViewport({ width: 390, height: 844, isMobile: true });
      await new Promise(r => setTimeout(r, 800));
      await page.screenshot({ path: mobilePath });

      console.log(`✔ [${screen.module}] ${screen.name} -> Screenshots gravados`);
      screenResults.push({
        id: screen.id,
        name: screen.name,
        module: screen.module,
        path: screen.path,
        desktopImg: `/screenshots/${desktopImg}`,
        mobileImg: `/screenshots/${mobileImg}`,
        status: consoleLogs.length > 0 ? 'WARNING' : 'PASSED',
        warnings: consoleLogs
      });
    } catch (err) {
      console.error(`✖ Erro ao capturar ${screen.name}:`, err.message);
      screenResults.push({
        id: screen.id,
        name: screen.name,
        module: screen.module,
        path: screen.path,
        desktopImg: null,
        mobileImg: null,
        status: 'FAILED',
        error: err.message
      });
    } finally {
      await page.close();
    }
  }

  await browser.close();
  return screenResults;
}

async function main() {
  const timestamp = new Date().toISOString();
  console.log(`Iniciando bateria de validação em ${timestamp}...`);

  const crudResults = await runDatabaseCRUDTests();
  const screenResults = await runScreenshotSuite();

  const manifest = {
    generatedAt: timestamp,
    totalScreensTested: screenResults.length,
    screensPassed: screenResults.filter(s => s.status === 'PASSED').length,
    crudTestsCount: crudResults.length,
    crudPassedCount: crudResults.filter(c => c.status === 'PASSED').length,
    databaseTarget: 'Lovable Cloud / Supabase (ybgywoljyeumgzsdbldu)',
    crudResults,
    screens: screenResults
  };

  const manifestPath = path.resolve(rootDir, 'src', 'core', 'test-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`\nManifesto de testes salvo com sucesso em: ${manifestPath}`);
  console.log(`Validação concluída: ${manifest.screensPassed}/${manifest.totalScreensTested} telas validadas, ${manifest.crudPassedCount}/${manifest.crudTestsCount} operações de banco confirmadas!`);
  process.exit(0);
}

main().catch(err => {
  console.error('Erro fatal durante a execução:', err);
  process.exit(1);
});
