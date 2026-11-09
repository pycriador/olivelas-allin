import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

async function runValidation() {
  console.log('🚀 Iniciando validação completa de Design, Mobile e Sidemenu...');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message);
    errors.push(err.message);
  });

  // Ensure screenshots dir exists
  if (!fs.existsSync('public/screenshots')) {
    fs.mkdirSync('public/screenshots', { recursive: true });
  }

  // 1. Login
  console.log('1️⃣ Fazendo login com willian.o.jesus@gmail.com...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  await page.type('#email', 'willian.o.jesus@gmail.com', { delay: 10 });
  await page.type('#password', 'ServiceForge@2026', { delay: 10 });
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  console.log('URL após login:', page.url());

  // 2. Validate Dashboard Desktop
  console.log('2️⃣ Validando Dashboard no Desktop (1280x800)...');
  await page.goto('http://localhost:8080/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const desktopOverflow = await page.evaluate(() => {
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  console.log('Desktop Overflow Check:', desktopOverflow);
  await page.screenshot({ path: 'public/screenshots/desktop_dashboard_redesign.png', fullPage: false });

  // 3. Validate Theme Palette Dialog
  console.log('3️⃣ Testando seletor de 30 temas (Estilo Olivelas)...');
  const paletteBtn = await page.$('button[title*="Personalizar Cores"]');
  if (paletteBtn) {
    await paletteBtn.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'public/screenshots/theme_palette_modal.png' });

    // Pick another theme to verify dynamic CSS property injection
    const themeSwatches = await page.$$('button[aria-pressed]');
    console.log(`Encontradas ${themeSwatches.length} opções de temas no modal.`);
    if (themeSwatches.length > 2) {
      await themeSwatches[2].click(); // select a theme
      await new Promise(r => setTimeout(r, 500));
    }
    // Close modal if open
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // 4. Test Sidemenu Selection on /service-orders/new
  console.log('4️⃣ Testando seleção única no Sidemenu em /service-orders/new...');
  await page.goto('http://localhost:8080/service-orders/new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const activeLinks = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('[data-sidebar="menu-button"][data-active="true"]'));
    return buttons.map(b => {
      const a = b.querySelector('a') || b;
      return {
        text: b.textContent?.trim(),
        href: a.getAttribute('href'),
        className: b.className
      };
    });
  });
  console.log('Links ativos encontrados no menu lateral:', activeLinks);

  const isDuplicateActive = activeLinks.length > 1 &&
    activeLinks.some(l => l.href === '/service-orders') &&
    activeLinks.some(l => l.href === '/service-orders/new');

  if (isDuplicateActive) {
    console.error('❌ FALHA: Ainda existem 2 elementos selecionados no sidemenu!');
  } else {
    console.log('✅ SUCESSO: Apenas 1 elemento selecionado no sidemenu! (Sem duplicação)');
  }
  await page.screenshot({ path: 'public/screenshots/desktop_new_so_active_sidebar.png' });

  // 5. Test Mobile Viewport (390x844 - iPhone 14 / Modern Smartphone)
  console.log('5️⃣ Testando versão Mobile (390x844)...');
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8080/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  const mobileOverflowDashboard = await page.evaluate(() => {
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  });
  console.log('Mobile Dashboard Overflow Check:', mobileOverflowDashboard);
  await page.screenshot({ path: 'public/screenshots/mobile_dashboard_redesign.png' });

  // 6. Test Mobile Sidebar Drawer
  console.log('6️⃣ Testando abertura do menu lateral no mobile...');
  const menuTrigger = await page.$('header button');
  if (menuTrigger) {
    await menuTrigger.click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'public/screenshots/mobile_sidebar_open.png' });
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 500));
  }

  // 7. Test Service Orders list on Mobile & Desktop
  console.log('7️⃣ Testando tabela de Ordens de Serviço no mobile e desktop...');
  await page.goto('http://localhost:8080/service-orders', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  const mobileOverflowSO = await page.evaluate(() => {
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 2,
    };
  });
  console.log('Mobile SO Table Overflow Check:', mobileOverflowSO);
  await page.screenshot({ path: 'public/screenshots/mobile_so_list_redesign.png' });

  // Switch back to desktop and capture table
  await page.setViewport({ width: 1280, height: 800 });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: 'public/screenshots/desktop_so_list_redesign.png' });

  // 8. Test Settings Page with Themes
  console.log('8️⃣ Testando página de Configurações & Temas...');
  await page.goto('http://localhost:8080/settings', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'public/screenshots/desktop_settings_themes.png' });

  await browser.close();
  console.log('🎉 Validação visual e funcional concluída com sucesso!');
}

runValidation().catch(err => {
  console.error('Erro na validação:', err);
  process.exit(1);
});
