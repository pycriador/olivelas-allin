#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJETOS_DIR = path.resolve(__dirname, '..', 'projetos');

const NEW_NODE_PROJECTS = [
  'album_figurinhas',
  'artes_caneca',
  'casa_organizada_ai',
  'cesta_cafe_manha',
  'collection_vault',
  'dashboard_bi',
  'forms',
  'forms_pro',
  'gerenciador_tunnel_apps',
  'iam_suite',
  'inventario_jogos',
  'link_promo',
  'qrcode_maker',
  'sync_google_drive',
  'visualizador_dashboad_ai',
];

const filterArgs = process.argv.slice(2);
const targets =
  filterArgs.length > 0
    ? NEW_NODE_PROJECTS.filter((p) => filterArgs.includes(p))
    : NEW_NODE_PROJECTS;

for (const proj of targets) {
  const dir = path.join(PROJETOS_DIR, proj);
  if (!fs.existsSync(dir)) continue;

  const nm = path.join(dir, 'node_modules');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const needsNitro = Boolean(pkgJson.dependencies?.['@tanstack/react-start']);
  const hasNitroInstalled = fs.existsSync(path.join(nm, 'nitro'));

  const alreadyBuilt =
    filterArgs.length === 0 &&
    (fs.existsSync(path.join(dir, '.output', 'server')) ||
      fs.existsSync(path.join(dir, 'dist', 'index.html')) ||
      fs.existsSync(path.join(dir, 'dist', 'client', 'index.html')));

  if (alreadyBuilt && (!needsNitro || hasNitroInstalled)) {
    console.log(`⏭️  Skipping ${proj} (already built)`);
    continue;
  }

  if (proj === 'iam_suite') {
    const formsProLock = path.join(PROJETOS_DIR, 'forms_pro', 'package-lock.json');
    if (fs.existsSync(formsProLock)) {
      fs.copyFileSync(formsProLock, path.join(dir, 'package-lock.json'));
    }
    if (fs.existsSync(nm)) {
      fs.rmSync(nm, { recursive: true, force: true });
    }
  }

  if (!fs.existsSync(nm) || (needsNitro && !hasNitroInstalled)) {
    console.log(`\n📦 Installing dependencies for ${proj}...`);
    execSync('npm install --no-audit --no-fund --legacy-peer-deps', {
      cwd: dir,
      stdio: 'inherit',
    });
  }

  console.log(`\n🔨 Building ${proj}...`);
  try {
    execSync('npm run build', {
      cwd: dir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    // Copy favicon.svg into dist/ or .output/public/
    const srcFav = path.join(dir, 'public', 'favicon.svg');
    const fallbackFav = path.join(dir, 'favicon.svg');
    const favToCopy = fs.existsSync(srcFav) ? srcFav : fs.existsSync(fallbackFav) ? fallbackFav : null;
    if (favToCopy) {
      if (fs.existsSync(path.join(dir, 'dist'))) {
        fs.copyFileSync(favToCopy, path.join(dir, 'dist', 'favicon.svg'));
      }
      if (fs.existsSync(path.join(dir, '.output', 'public'))) {
        fs.copyFileSync(favToCopy, path.join(dir, '.output', 'public', 'favicon.svg'));
      }
    }
    console.log(`✅ Built ${proj} successfully!`);
  } catch (err) {
    console.error(`❌ Build failed for ${proj}: ${err.message}`);
    process.exit(1);
  }
}

console.log('\n🎉 All targeted new projects installed and built successfully!');
