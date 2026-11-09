import puppeteer from 'puppeteer-core';

async function check() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle2' });
  await page.type('#email', 'willian.o.jesus@gmail.com');
  await page.type('#password', 'ServiceForge@2026');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 3000));
  await page.goto('http://localhost:8080/service-orders/assets/brands', { waitUntil: 'networkidle2' });
  console.log('URL:', page.url());
  const btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
  console.log('Buttons on brands page:', btns);
  const text = await page.evaluate(() => document.body.innerText.slice(0, 500));
  console.log('Text on brands page:', text);
  await browser.close();
}

check().catch(console.error);
