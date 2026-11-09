import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.resolve(process.cwd(), 'public', 'evidence');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 Iniciando bateria de testes e captura de evidências...');
  console.log(`📂 Destino das capturas: ${OUTPUT_DIR}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    protocolTimeout: 120000,
    defaultViewport: {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1.5,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  });

  try {
    const page = await browser.newPage();

    // Impede popups de nova janela para não travar o runner
    await page.evaluateOnNewDocument(() => {
      window.open = () => null;
    });

    // 1. Acessa página inicial para preparar localStorage com dados completos
    console.log('⚡ Inicializando ambiente e dados mockados do Restaurante Olivelas...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });

    await page.evaluate(() => {
      // Demo global admin / restaurant admin user
      const demoUser = {
        id: 'usr-willian',
        email: 'willian.o.jesus@gmail.com',
        name: 'Willian Jesus',
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem('olivelas_demo_user', JSON.stringify(demoUser));
      localStorage.setItem('olivelas_active_restaurant_id', 'rest-1');

      // Setup team members (all 5 roles covered)
      const members = [
        {
          id: 'mem-admin-1',
          restaurant_id: 'rest-1',
          user_id: 'usr-admin-1',
          role_id: 'restaurant_admin',
          status: 'active',
          joined_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 20).toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'usr-admin-1',
            full_name: 'Carlos Mendes',
            email: 'carlos.admin@olivelas.com.br',
            avatar_url: null,
            phone: '(11) 99111-2233',
          },
          role: {
            id: 'restaurant_admin',
            name: 'Administrador',
            description: 'Controle total do restaurante e da equipe.',
          },
        },
        {
          id: 'mem-manager-1',
          restaurant_id: 'rest-1',
          user_id: 'usr-manager-1',
          role_id: 'manager',
          status: 'active',
          joined_at: new Date(Date.now() - 86400000 * 18).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 18).toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'usr-manager-1',
            full_name: 'Fernanda Lima',
            email: 'fernanda.gerente@olivelas.com.br',
            avatar_url: null,
            phone: '(11) 99222-3344',
          },
          role: {
            id: 'manager',
            name: 'Gerente',
            description: 'Gerenciamento operacional e produtos.',
          },
        },
        {
          id: 'mem-waiter-1',
          restaurant_id: 'rest-1',
          user_id: 'usr-waiter-1',
          role_id: 'waiter',
          status: 'active',
          joined_at: new Date(Date.now() - 86400000 * 15).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'usr-waiter-1',
            full_name: 'Roberto Alves',
            email: 'roberto.garcom@olivelas.com.br',
            avatar_url: null,
            phone: '(11) 99333-4455',
          },
          role: {
            id: 'waiter',
            name: 'Garçom',
            description: 'Operação de mesas e pedidos no salão.',
          },
        },
        {
          id: 'mem-kitchen-1',
          restaurant_id: 'rest-1',
          user_id: 'usr-kitchen-1',
          role_id: 'kitchen',
          status: 'active',
          joined_at: new Date(Date.now() - 86400000 * 12).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'usr-kitchen-1',
            full_name: 'Chef Marcelo Oliveira',
            email: 'marcelo.cozinha@olivelas.com.br',
            avatar_url: null,
            phone: '(11) 99444-5566',
          },
          role: {
            id: 'kitchen',
            name: 'Cozinha',
            description: 'Operação e visualização dos pedidos na cozinha.',
          },
        },
        {
          id: 'mem-cashier-1',
          restaurant_id: 'rest-1',
          user_id: 'usr-cashier-1',
          role_id: 'cashier',
          status: 'active',
          joined_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'usr-cashier-1',
            full_name: 'Aline Santos',
            email: 'aline.caixa@olivelas.com.br',
            avatar_url: null,
            phone: '(11) 99555-6677',
          },
          role: {
            id: 'cashier',
            name: 'Caixa',
            description: 'Operação de caixa e fechamento de contas.',
          },
        },
        {
          id: 'mem-willian-1',
          restaurant_id: 'rest-1',
          user_id: 'usr-willian',
          role_id: 'restaurant_admin',
          status: 'active',
          joined_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
          updated_at: new Date().toISOString(),
          profile: {
            id: 'usr-willian',
            full_name: 'Willian Jesus',
            email: 'willian.o.jesus@gmail.com',
            avatar_url: null,
            phone: '(11) 99999-9999',
          },
          role: {
            id: 'restaurant_admin',
            name: 'Administrador (Global)',
            description: 'Controle irrestrito do restaurante e SaaS.',
          },
        },
      ];
      localStorage.setItem('olivelas_mock_members', JSON.stringify(members));

      // Reset Table 03 to available
      const tablesKey = 'olivelas_tables_rest-1';
      const rawTables = localStorage.getItem(tablesKey);
      if (rawTables) {
        const tables = JSON.parse(rawTables);
        const t3 = tables.find((t) => t.id === 'table-03');
        if (t3) {
          t3.status = 'available';
          delete t3.current_order_id;
          delete t3.waiter_name;
          delete t3.occupied_at;
        }
        localStorage.setItem(tablesKey, JSON.stringify(tables));
      }
    });

    // ----------------------------------------------------
    // SCREENSHOT 01: Equipe / Membros do Restaurante Olivelas
    // ----------------------------------------------------
    console.log('📸 01: Capturando gestão de equipe (/app/team)...');
    await page.goto(`${BASE_URL}/app/team`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '01-team-management-all-roles.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 02: Modal de Adicionar Novo Membro
    // ----------------------------------------------------
    console.log('📸 02: Abrindo modal de adicionar membro...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find((b) => b.textContent?.includes('Adicionar membro') || b.textContent?.includes('Convidar'));
      if (btn) btn.click();
    });
    await sleep(800);

    await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"]');
      if (emailInput) {
        emailInput.value = 'sommelier.marcos@olivelas.com.br';
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const nameInput = document.querySelector('input#memberName, input[placeholder*="nome" i]');
      if (nameInput) {
        nameInput.value = 'Marcos Sommelier';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(400);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '02-team-add-member-modal.png'),
      fullPage: false,
    });

    await page.keyboard.press('Escape');
    await sleep(400);

    // ----------------------------------------------------
    // SCREENSHOT 03: Catálogo de Produtos e Pratos
    // ----------------------------------------------------
    console.log('📸 03: Capturando catálogo de produtos (/app/menu/products)...');
    await page.goto(`${BASE_URL}/app/menu/products`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '03-menu-products-catalog.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 04: Complementos e Pontos da Carne
    // ----------------------------------------------------
    console.log('📸 04: Capturando complementos e pontos da carne (/app/menu/add-ons)...');
    await page.goto(`${BASE_URL}/app/menu/add-ons?tab=items`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '04-menu-meat-doneness-addons.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 05: Salão de Mesas e Áreas
    // ----------------------------------------------------
    console.log('📸 05: Capturando salão de mesas (/app/tables)...');
    await page.goto(`${BASE_URL}/app/tables`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '05-tables-floor-plan.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 06: Mesa 03 - Modal de Abertura de Comanda
    // ----------------------------------------------------
    console.log('📸 06: Acessando Mesa 03 e abrindo modal de comanda...');
    await page.goto(`${BASE_URL}/app/tables/table-03`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    // Clica especificamente no botão "Abrir Comanda" central da mesa
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const openBtn = btns.find(
        (b) => b.textContent?.trim() === 'Abrir Comanda' && !b.textContent?.includes('Digital')
      );
      if (openBtn) openBtn.click();
    });
    await sleep(800);

    // Preenche campos do modal de comanda
    await page.evaluate(() => {
      const nameInput = document.querySelector('input#custName');
      if (nameInput) {
        nameInput.value = 'Roberto Cavalcanti';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const waiterInput = document.querySelector('input#custWaiter');
      if (waiterInput) {
        waiterInput.value = 'Roberto Alves (Garçom)';
        waiterInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const notesInput = document.querySelector('input#custNotes');
      if (notesInput) {
        notesInput.value = 'Cliente VIP • Almoço Executivo de Negócios';
        notesInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(600);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '06-open-comanda-modal.png'),
      fullPage: false,
    });

    // Submete a abertura da comanda
    await page.evaluate(() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    });
    await sleep(1500);

    // ----------------------------------------------------
    // SCREENSHOT 07: Modal de Seleção de Prato com Ponto da Carne
    // ----------------------------------------------------
    console.log('📸 07: Abrindo modal para adicionar Prato de Carne com Ponto...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(
        (b) =>
          (b.textContent?.includes('Adicionar Item') || b.textContent?.includes('Adicionar Pedido')) &&
          !b.textContent?.includes('Digital')
      );
      if (addBtn) addBtn.click();
    });
    await sleep(1000);

    // Seleciona o Ancho Angus e escreve a observação do ponto da carne
    await page.evaluate(() => {
      const prodButtons = Array.from(document.querySelectorAll('button'));
      const anchoBtn = prodButtons.find((b) => b.textContent?.includes('Ancho Angus'));
      if (anchoBtn) anchoBtn.click();
    });
    await sleep(500);

    await page.evaluate(() => {
      const notesInput = document.querySelector('input#itemNotes');
      if (notesInput) {
        notesInput.value = 'Ponto da Carne: Ao Ponto • Sem cebola na farofa de alecrim';
        notesInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(600);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '07-comanda-item-selection-with-doneness.png'),
      fullPage: false,
    });

    // Submete a adição do Ancho Angus
    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const addForm = forms.find((f) => f.textContent?.includes('Adicionar ao Pedido'));
      if (addForm) {
        const submit = addForm.querySelector('button[type="submit"]');
        if (submit) submit.click();
      }
    });
    await sleep(1200);

    // Adiciona agora a Bebida: Gin Tônica Mediterrâneo
    console.log('🍸 Adicionando Bebida (Gin Tônica Mediterrâneo)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(
        (b) =>
          (b.textContent?.includes('Adicionar Item') || b.textContent?.includes('Adicionar Pedido')) &&
          !b.textContent?.includes('Digital')
      );
      if (addBtn) addBtn.click();
    });
    await sleep(1000);

    await page.evaluate(() => {
      const prodButtons = Array.from(document.querySelectorAll('button'));
      const ginBtn = prodButtons.find((b) => b.textContent?.includes('Gin Tônica'));
      if (ginBtn) ginBtn.click();
    });
    await sleep(500);

    await page.evaluate(() => {
      const notesInput = document.querySelector('input#itemNotes');
      if (notesInput) {
        notesInput.value = 'Gelo translúcido, zimbro fresco e ramo de alecrim';
        notesInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await sleep(500);

    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form'));
      const addForm = forms.find((f) => f.textContent?.includes('Adicionar ao Pedido'));
      if (addForm) {
        const submit = addForm.querySelector('button[type="submit"]');
        if (submit) submit.click();
      }
    });
    await sleep(1500);

    // ----------------------------------------------------
    // SCREENSHOT 08: Comanda com Prato de Carne (Ponto) e Bebida
    // ----------------------------------------------------
    console.log('📸 08: Capturando comanda ativa com itens e totais calculados...');
    await sleep(800);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '08-comanda-items-added.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 09: Enviar Comanda para a Cozinha
    // ----------------------------------------------------
    console.log('📸 09: Enviando pedido da comanda para a cozinha...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sendBtn = btns.find(
        (b) => b.textContent?.includes('Enviar para Cozinha') || b.textContent?.includes('Enviar para a Cozinha')
      );
      if (sendBtn) sendBtn.click();
    });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '09-comanda-sent-to-kitchen.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 10: Painel KDS da Cozinha (Fila em Preparo)
    // ----------------------------------------------------
    console.log('📸 10: Acessando tela KDS da cozinha (/app/kds)...');
    await page.goto(`${BASE_URL}/app/kds`, { waitUntil: 'networkidle0' });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '10-kds-kitchen-queue.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 11: Cozinha - Prato Preparado (Marcar como Pronto)
    // ----------------------------------------------------
    console.log('📸 11: Cozinha finaliza o preparo da carne e bebida (Marcar como Pronto)...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.border-blue-500\\/40, .bg-card'));
      const t3Card = cards.find((c) => c.textContent?.includes('Mesa 3') || c.textContent?.includes('Ancho Angus'));
      if (t3Card) {
        const btn = t3Card.querySelector('button');
        if (btn) btn.click();
      } else {
        const btns = Array.from(document.querySelectorAll('button'));
        const readyBtn = btns.find((b) => b.textContent?.includes('Marcar como Pronto'));
        if (readyBtn) readyBtn.click();
      }
    });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '11-kds-dish-prepared-ready.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 12: Cozinha - Entregar ao Garçom
    // ----------------------------------------------------
    console.log('📸 12: Cozinha entrega prato pronto ao garçom Roberto Alves...');
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.border-emerald-500\\/40, .bg-card'));
      const t3Card = cards.find((c) => c.textContent?.includes('Mesa 3') || c.textContent?.includes('Ancho Angus'));
      if (t3Card) {
        const btn = t3Card.querySelector('button');
        if (btn) btn.click();
      } else {
        const btns = Array.from(document.querySelectorAll('button'));
        const deliverBtn = btns.find((b) => b.textContent?.includes('Entregar ao Garçom'));
        if (deliverBtn) deliverBtn.click();
      }
    });
    await sleep(1500);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '12-kds-dish-delivered-to-waiter.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 13: Salão - Mesa 03 com Pedido Entregue e Conta Solicitada
    // ----------------------------------------------------
    console.log('📸 13: Retornando à Mesa 03 no salão com prato entregue...');
    await page.goto(`${BASE_URL}/app/tables/table-03`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    // Marca status da mesa como conta solicitada
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const actionsBtn = btns.find((b) => b.textContent?.includes('Ações'));
      if (actionsBtn) actionsBtn.click();
    });
    await sleep(500);

    await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[role="menuitem"], .cursor-pointer'));
      const billItem = items.find((i) => i.textContent?.includes('Conta Solicitada'));
      if (billItem) billItem.click();
    });
    await sleep(1200);
    await page.screenshot({
      path: path.join(OUTPUT_DIR, '13-table-order-delivered-salon.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 14: Comanda Digital do Cliente com QR Code e PIX
    // ----------------------------------------------------
    console.log('📸 14: Capturando comanda digital do cliente (/comanda/table-03)...');
    await page.goto(`${BASE_URL}/comanda/table-03?restaurant=rest-1`, { waitUntil: 'networkidle0' });
    await sleep(1200);

    // Clica em "Pedir a Conta Agora" para exibir o QR Code PIX Dinâmico
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const billBtn = btns.find((b) => b.textContent?.includes('Pedir a Conta'));
      if (billBtn) billBtn.click();
    });
    await sleep(1000);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '14-digital-comanda-customer-qrcode-pix.png'),
      fullPage: false,
    });

    // ----------------------------------------------------
    // SCREENSHOT 15: Caixa / POS e Liquidação
    // ----------------------------------------------------
    console.log('📸 15: Acessando Caixa para fechamento da Mesa 03 (/app/cashier)...');
    await page.goto(`${BASE_URL}/app/cashier`, { waitUntil: 'networkidle0' });
    await sleep(1500);

    // Clica no card da Mesa 03 no caixa para exibir o resumo completo de fechamento
    await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('button, div[role="button"], .cursor-pointer'));
      const table3Btn = cards.find((c) => c.textContent?.includes('Mesa 03') || c.textContent?.includes('Mesa 3'));
      if (table3Btn) table3Btn.click();
    });
    await sleep(800);

    await page.screenshot({
      path: path.join(OUTPUT_DIR, '15-cashier-checkout-payment.png'),
      fullPage: false,
    });

    console.log('🎉 Todas as 15 telas foram capturadas e salvas com sucesso em public/evidence/!');
  } catch (error) {
    console.error('❌ Erro durante a execução dos testes e capturas:', error);
  } finally {
    await browser.close();
  }
}

run();
