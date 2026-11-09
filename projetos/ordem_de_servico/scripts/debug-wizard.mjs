import puppeteer from 'puppeteer-core';

async function debugWizard() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  // Login
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
  await page.type('#email', 'willian.o.jesus@gmail.com');
  await page.type('#password', 'ServiceForge@2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  // Go to /service-orders/new
  await page.goto('http://localhost:8080/service-orders/new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));

  // Check step text
  const stepText1 = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('Current Step:', stepText1);

  // Search and select first customer
  const searchInput = await page.$('input');
  if (searchInput) {
    await searchInput.type('a', { delay: 10 });
    await new Promise(r => setTimeout(r, 1500));
  }

  // Click first customer card
  await page.evaluate(() => {
    const card = document.querySelector('.cursor-pointer');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check if customer selected
  const hasSelected = await page.evaluate(() => document.body.innerText.includes('Cliente selecionado') || document.body.innerText.includes('CPF') || document.body.innerText.includes('Trocar cliente'));
  console.log('Customer selected?', hasSelected);

  // Click Próximo
  for (let s = 1; s <= 4; s++) {
    const stepText = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
    console.log(`At step: ${stepText}, clicking Próximo...`);

    if (s === 4) {
      const ta = await page.$('textarea');
      if (ta) await ta.type('Defeito para teste');
    }

    const clickedNext = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    console.log(`Próximo clicked on step ${s}?`, clickedNext);
    await new Promise(r => setTimeout(r, 1000));
  }

  // Now at Step 5
  const stepText5 = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('At step 5:', stepText5);

  const btnsOn5 = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim()).filter(Boolean));
  console.log('Buttons on step 5:', btnsOn5);

  const clickedGerar = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Gerar Ordem de Serviço'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  console.log('Gerar Ordem de Serviço clicked?', clickedGerar);
  await new Promise(r => setTimeout(r, 3000));

  console.log('Final URL:', page.url());
  await browser.close();
}

debugWizard().catch(console.error);
