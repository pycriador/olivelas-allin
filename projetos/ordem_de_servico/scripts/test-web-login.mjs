import puppeteer from 'puppeteer-core';

async function testWebLogin() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));

  console.log('Navegando para /login...');
  await page.goto('http://localhost:8080/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  const inputs = await page.$$eval('input', els => els.map(e => ({ id: e.id, type: e.type, name: e.name })));
  console.log('Inputs found:', inputs);

  await page.type('#email', 'willian.o.jesus@gmail.com', { delay: 20 });
  await page.type('#password', 'ServiceForge@2026', { delay: 20 });

  const val = await page.$$eval('input', els => els.map(e => ({ id: e.id, value: e.value })));
  console.log('Input values before click:', val);

  console.log('Submetendo form via evaluate...');
  const res = await page.evaluate(async () => {
    try {
      const emailInput = document.querySelector('#email');
      const passwordInput = document.querySelector('#password');
      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.click();
      return { clicked: true };
    } catch (e) {
      return { error: e.message };
    }
  });
  console.log('Click result:', res);

  await new Promise(r => setTimeout(r, 4000));
  const currentUrl = page.url();
  console.log('URL após login:', currentUrl);

  await page.screenshot({ path: 'public/screenshots/login_willian_success.png' });
  await browser.close();
}

testWebLogin().catch(console.error);
