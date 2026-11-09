import puppeteer from 'puppeteer-core';

async function captureTables() {
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
  await new Promise(r => setTimeout(r, 2500));

  // Service orders
  await page.goto('http://localhost:8080/service-orders', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'public/screenshots/table_so_1280.png' });

  // Customers list
  await page.goto('http://localhost:8080/service-orders/customers/list', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'public/screenshots/table_customers_1280.png' });

  // Records brands
  await page.goto('http://localhost:8080/records/brands', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: 'public/screenshots/table_brands_1280.png' });

  await browser.close();
  console.log('Screenshots captured!');
}

captureTables().catch(console.error);
