import puppeteer from 'puppeteer-core';

async function testWizardSelection() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Login
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
  await page.type('#email', 'willian.o.jesus@gmail.com');
  await page.type('#password', 'ServiceForge@2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));

  // Go to /service-orders/new
  await page.goto('http://localhost:8080/service-orders/new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // Search input
  const input = await page.$('input[placeholder*="Digite para buscar"]');
  console.log('Search input found:', !!input);
  await input.click();
  await input.type('Cliente', { delay: 10 });
  await new Promise(r => setTimeout(r, 2000));

  // Find customer cards
  const cardsCount = await page.evaluate(() => {
    const cards = document.querySelectorAll('.max-h-60 div.cursor-pointer, .max-h-60 > div');
    return cards.length;
  });
  console.log('Customer cards found in search dropdown:', cardsCount);

  // Click first card
  await page.evaluate(() => {
    const card = document.querySelector('.max-h-60 div.cursor-pointer, .max-h-60 > div');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Check if selectedCustomer is set
  const selectedInfo = await page.evaluate(() => {
    const card = document.querySelector('div:has(> .text-base)');
    const selectedText = document.body.innerText.includes('Cliente Selecionado');
    const nextBtnDisabled = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'))?.disabled;
    return { selectedText, nextBtnDisabled };
  });
  console.log('Selection state:', selectedInfo);

  // Click Próximo
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => (b.textContent || '').includes('Próximo'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  const stepAfter = await page.evaluate(() => document.body.innerText.match(/Passo \d de \d/)?.[0]);
  console.log('Step after Próximo:', stepAfter);

  await browser.close();
}

testWizardSelection().catch(console.error);
