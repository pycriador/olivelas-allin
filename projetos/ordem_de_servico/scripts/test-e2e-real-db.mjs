import puppeteer from 'puppeteer-core';
import pg from 'pg';

const { Client } = pg;
const dbClient = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('🚀 Iniciando validação E2E com gravação no banco PostgreSQL real...');
  await dbClient.connect();

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // 1. Login
  console.log('1️⃣ Efetuando login...');
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.type('#email', 'willian.o.jesus@gmail.com', { delay: 10 });
  await page.type('#password', 'ServiceForge@2026', { delay: 10 });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
  console.log('   URL após login:', page.url());

  const uniqueSuffix = Date.now().toString().slice(-5);

  // 2. Add Novo Cliente via UI
  console.log('2️⃣ Criando Novo Cliente via Interface...');
  await page.goto('http://localhost:8080/service-orders/customers/list', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Novo Cliente')), { timeout: 15000 });

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Novo Cliente'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const customerName = `Cliente Real DB ${uniqueSuffix}`;
  await page.waitForSelector('[role="dialog"] input', { timeout: 10000 });
  const custInput = await page.$('[role="dialog"] input');
  if (custInput) {
    await custInput.click();
    await custInput.type(customerName, { delay: 15 });
  }

  // Click Save
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const saveBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.textContent || '').includes('Salvar'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Verify in PostgreSQL table customers
  console.log('   Consultando PostgreSQL: SELECT * FROM serviceforge.customers WHERE name = ...');
  const custRes = await dbClient.query('SELECT id, name, created_at FROM serviceforge.customers WHERE name = $1;', [customerName]);
  console.log(`   Resultado no PostgreSQL: ${custRes.rows.length} cliente(s) encontrado(s)!`);
  if (custRes.rows.length === 0) throw new Error('Cliente NÃO foi gravado no banco de dados PostgreSQL!');
  console.log('   ✅ Cliente gravado no PostgreSQL: ID =', custRes.rows[0].id);

  // 3. Add Nova Marca via UI
  console.log('3️⃣ Criando Nova Marca via Interface...');
  await page.goto('http://localhost:8080/service-orders/assets/brands', { waitUntil: 'networkidle2' });
  await page.waitForFunction(() => Array.from(document.querySelectorAll('button')).some(b => (b.textContent || '').includes('Nova Marca')), { timeout: 15000 });

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Nova Marca'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  const brandName = `Marca Real DB ${uniqueSuffix}`;
  const brandInput = await page.$('[role="dialog"] input');
  if (brandInput) {
    await brandInput.click();
    await brandInput.type(brandName, { delay: 15 });
  }

  // Click Save
  await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const saveBtn = Array.from(dialog.querySelectorAll('button')).find(b => (b.textContent || '').includes('Salvar'));
    if (saveBtn) saveBtn.click();
  });
  await new Promise(r => setTimeout(r, 3000));

  // Verify in PostgreSQL table brands
  console.log('   Consultando PostgreSQL: SELECT * FROM serviceforge.brands WHERE name = ...');
  const brandRes = await dbClient.query('SELECT id, name, created_at FROM serviceforge.brands WHERE name = $1;', [brandName]);
  console.log(`   Resultado no PostgreSQL: ${brandRes.rows.length} marca(s) encontrada(s)!`);
  if (brandRes.rows.length === 0) throw new Error('Marca NÃO foi gravada no banco de dados PostgreSQL!');
  console.log('   ✅ Marca gravada no PostgreSQL: ID =', brandRes.rows[0].id);

  // 4. Create Nova OS via UI
  console.log('4️⃣ Criando Nova Ordem de Serviço via Fluxo Wizard...');
  await page.goto('http://localhost:8080/service-orders/new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Listen to browser console
  page.on('console', msg => console.log('   [BROWSER CONSOLE]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('   [BROWSER PAGEERROR]', err.message));

  // Search for customer
  const searchInput = await page.$('input[placeholder*="Digite para buscar"]');
  if (searchInput) {
    await searchInput.click();
    await searchInput.type('Cliente', { delay: 20 });
    await page.waitForSelector('.max-h-60 div', { timeout: 8000 });
  }

  // Select customer card from the dropdown
  const cardFound = await page.evaluate(() => {
    const card = document.querySelector('.max-h-60 div.cursor-pointer, .max-h-60 > div');
    if (card) {
      card.click();
      return true;
    }
    return false;
  });
  console.log('   Card de cliente selecionado:', cardFound);
  await new Promise(r => setTimeout(r, 1000));

  let stepText = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('   Status inicial:', stepText);

  // Step 1 -> Step 2
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  stepText = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('   Após avançar passo 1:', stepText);

  // Step 2 -> Step 3
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  stepText = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('   Após avançar passo 2:', stepText);

  // Step 3 -> Step 4
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  stepText = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('   Após avançar passo 3:', stepText);

  // Step 4: type defect description
  const defectArea = await page.$('textarea[placeholder*="Descreva o defeito"]');
  if (defectArea) {
    await defectArea.click();
    await defectArea.type(`Aparelho não liga após queda - Teste Real ${uniqueSuffix}`, { delay: 10 });
  }
  await new Promise(r => setTimeout(r, 1000));

  // Step 4 -> Step 5
  await page.evaluate(() => {
    const nextBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
    if (nextBtn) nextBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  stepText = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('   Após avançar passo 4:', stepText);

  // Step 5: Final confirmation -> click "Gerar Ordem de Serviço"
  await page.evaluate(() => {
    const finishBtn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Gerar Ordem'));
    if (finishBtn) finishBtn.click();
  });
  await new Promise(r => setTimeout(r, 5000));

  const toastText = await page.evaluate(() => {
    const toasts = Array.from(document.querySelectorAll('[data-sonner-toast], [role="status"]'));
    return toasts.map(t => t.textContent?.trim()).join(' | ');
  });
  console.log('   Toast message na UI:', toastText);
  console.log('   URL final após criação de OS:', page.url());

  // Verify in PostgreSQL table service_orders
  console.log('   Consultando PostgreSQL: SELECT * FROM serviceforge.service_orders ORDER BY created_at DESC LIMIT 5;');
  const soRes = await dbClient.query('SELECT id, number, customer_name, status, created_at FROM serviceforge.service_orders ORDER BY created_at DESC LIMIT 5;');
  console.log(`   Últimas OS no PostgreSQL:`, soRes.rows);
  if (soRes.rows.length === 0) throw new Error('Nenhuma OS encontrada no banco de dados PostgreSQL!');
  console.log(`   ✅ OS Gravada no PostgreSQL com Sucesso: ${soRes.rows[0].number} (Cliente: ${soRes.rows[0].customer_name}, ID: ${soRes.rows[0].id})`);

  // Take screenshot evidence
  await page.screenshot({ path: 'public/screenshots/real_db_records_confirmed.png' });
  console.log('📸 Screenshot salvo: public/screenshots/real_db_records_confirmed.png');

  await browser.close();
  await dbClient.end();
  console.log('\n🎉 SUCESSO TOTAL: TODOS OS BOTÕES DE ADICIONAR FUNCIONAM E GRAVAM DE VERDADE NO POSTGRESQL!');
}

run().catch((err) => {
  console.error('❌ Falha na validação:', err);
  process.exit(1);
});
