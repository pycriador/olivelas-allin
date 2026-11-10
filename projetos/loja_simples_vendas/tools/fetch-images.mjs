import { readFile, writeFile, mkdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import https from 'node:https';
import http from 'node:http';
import { termFor } from './img-terms.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const JSON_PATH = join(ROOT, 'data', 'produtos.json');
const OUT_DIR = join(ROOT, 'assets', 'images', 'products');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- HTTP helpers ----------
function httpRequest(url, options = {}, maxRedirects = 5) {
  return new Promise((resolvePromise, rejectPromise) => {
    const run = (u, redirects) => {
      const mod = u.startsWith('https') ? https : http;
      const req = mod.get(u, { headers: { 'User-Agent': USER_AGENT, ...options.headers } }, (res) => {
        const status = res.statusCode;
        if (redirects > 0 && [301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.resume();
          const next = new URL(res.headers.location, u).toString();
          return run(next, redirects - 1);
        }
        if (status !== 200) {
          res.resume();
          return rejectPromise(new Error(`HTTP ${status} para ${u}`));
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => resolvePromise({ body: Buffer.concat(chunks), headers: res.headers, url: u }));
        res.on('error', rejectPromise);
      });
      req.on('error', rejectPromise);
      req.setTimeout(30000, () => req.destroy(new Error('timeout')));
    };
    run((new URL(url)).toString(), maxRedirects);
  });
}

async function searchOpenverse(q, pageSize = 20) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(q)}&page_size=${pageSize}`;
  const res = await httpRequest(url);
  return JSON.parse(res.body.toString('utf-8'));
}

const MAGIC = {
  jpg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF....WEBP (detect WEBP separately)
  gif: [0x47, 0x49, 0x46, 0x38],
};

function detectType(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.slice(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return 'png';
  if (buf.slice(0, 4).equals(Buffer.from('RIFF'))) {
    if (buf.slice(8, 12).equals(Buffer.from('WEBP'))) return 'webp';
  }
  if (buf.slice(0, 4).equals(Buffer.from('GIF8'))) return 'gif';
  return null;
}

function extFromUrl(url) {
  const m = url.split('?')[0].match(/\.(jpe?g|png|webp|gif)(?:$|[/])/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : null;
}

// ---------- Ranking ----------
const ALLOWED_LICENSES = ['cc0', 'pdm', 'pdm-360', 'by', 'by-sa', 'by-nd'];

function rankImages(results) {
  const scored = results
    // exclude non-commercial (unsuitable for a product catalog)
    .filter((r) => r.url && !r.mature && !/nc/.test(r.license || ''))
    .map((r) => {
      const width = r.width || 0;
      const height = r.height || 0;
      let score = 0;
      const lic = (r.license || '').toLowerCase();
      if (!ALLOWED_LICENSES.includes(lic)) score += -50;
      if (lic === 'cc0' || lic === 'pdm' || lic === 'pdm-360') score += 40; // no attribution needed
      else if (lic === 'by') score += 20;
      else if (lic === 'by-sa' || lic === 'by-nd') score += 10;
      const minDim = Math.min(width, height);
      if (minDim >= 1600) score += 30;
      else if (minDim >= 1024) score += 25;
      else if (minDim >= 600) score += 15;
      else if (minDim >= 400) score += 5;
      else score -= 20;
      // landscape-ish preferred for cards
      if (width >= height && width > 0) score += 8;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored;
}

// ---------- Rate-limited fetch ----------
let lastRequestAt = 0;
async function paced(fn) {
  const now = Date.now();
  const gap = now - lastRequestAt;
  if (gap < 1100) await sleep(1100 - gap); // ~1 request/sec to be safe with openverse
  lastRequestAt = Date.now();
  return fn();
}

// ---------- Attribution ----------
async function recordAttribution(entries) {
  const attPath = join(ROOT, 'assets', 'images', 'products', 'CREDITOS.md');
  const lines = [
    '# Créditos de Imagens',
    '',
    'Imagens de produtos obtidas do Openverse (Creative Commons). Atribuição conforme licença de cada obra.',
    '',
  ];
  entries.forEach((e) => {
    lines.push(`- \`${e.file}\`: ${e.attribution}`);
  });
  lines.push('');
  await writeFile(attPath, lines.join('\n'), 'utf-8');
}

// ---------- Main ----------
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : Infinity;
const SKIP_EXISTING = process.env.SKIP_EXISTING !== '0';
let skipped = 0;
let processed = 0;
const attributions = [];

async function processProduct(product, cat) {
  const term = termFor(cat.slug, product.codigo);
  if (!term) {
    console.log(`  [skip] sem termo: ${product.codigo} ${product.nome}`);
    skipped++;
    return;
  }

  let data;
  try {
    data = await paced(() => searchOpenverse(term));
  } catch (e) {
    console.log(`  [erro busca] ${product.codigo} ${product.nome}: ${e.message}`);
    skipped++;
    return;
  }

  const results = data.results || [];
  if (!results.length) {
    console.log(`  [sem resultado] ${product.codigo} ${product.nome} (termo: ${term})`);
    skipped++;
    return;
  }

  const ranked = rankImages(results)
    .filter((item) => ALLOWED_LICENSES.includes((item.r.license || '').toLowerCase()));
  let chosen = null;
  for (const { r } of ranked) {
    try {
      const res = await paced(() => httpRequest(r.url));
      const type = detectType(res.body);
      if (!type) continue;
      if (res.body.length < 2000) continue; // too small / invalid
      chosen = { r, body: res.body, type };
      break;
    } catch {
      /* try next */
    }
  }

  if (!chosen) {
    console.log(`  [download falhou] ${product.codigo} ${product.nome}`);
    skipped++;
    return;
  }

  const slug = cat.slug;
  const fname = `${product.codigo}-${slug}.${chosen.type}`;
  const fpath = join(OUT_DIR, fname);
  await writeFile(fpath, chosen.body);
  product.imagem = `assets/images/products/${fname}`;

  const att = chosen.r.attribution || '';
  attributions.push({ file: fname, attribution: att });
  console.log(`  [ok] ${product.codigo} ${product.nome} -> ${fname} (${chosen.type}, ${chosen.body.length} bytes, lic=${chosen.r.license})`);
}

async function main() {
  console.log('Lendo produtos.json...');
  const data = JSON.parse(await readFile(JSON_PATH, 'utf-8'));
  await mkdir(OUT_DIR, { recursive: true });

  let totalImagens = 0;
  for (const cat of data.categorias) {
    console.log(`\n=== ${cat.categoria} ===`);
    for (const p of cat.produtos) {
      if (SKIP_EXISTING && p.imagem) {
        console.log(`  [skip ja tem imagem] ${p.codigo} ${p.nome}`);
        continue;
      }
      await processProduct(p, cat);
      processed++;
      if (processed >= LIMIT) break;
    }
    if (processed >= LIMIT) break;
  }

  // write back
  await writeFile(JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  if (attributions.length) await recordAttribution(attributions);

  // summary
  let withImg = 0;
  for (const cat of data.categorias) {
    for (const p of cat.produtos) if (p.imagem) withImg++;
  }
  console.log('\n================ RESUMO ================');
  console.log(`Produtos com imagem: ${withImg}/${data.categorias.reduce((a, c) => a + c.produtos.length, 0)}`);
  console.log(`Sem imagem (skip/falha): ${skipped}`);
  console.log(`Diretório: assets/images/products (${attributions.length} arquivos + CREDITOS.md)`);
}

main().catch((e) => {
  console.error('ERRO GLOBAL:', e);
  process.exit(1);
});
