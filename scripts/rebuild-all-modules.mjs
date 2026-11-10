#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJETOS_DIR = path.join(ROOT_DIR, 'projetos');

const MODULES_TO_BUILD = [
  'agendamentos',
  'app_condominio',
  'art_hub',
  'casa_organizada',
  'contratos',
  'especificacoes',
  'gestao_estoque',
  'ordem_de_servico',
  'personal_treiner',
  'restaurante',
  'rifas',
  'sistema_delivery',
  'sistema_mercado',
  'suite_rifa',
  'vitrine_digital',
];

for (const mod of MODULES_TO_BUILD) {
  const dir = path.join(PROJETOS_DIR, mod);
  if (!fs.existsSync(dir)) continue;
  console.log(`\n🔨 Building ${mod}...`);
  try {
    execSync('npx vite build', {
      cwd: dir,
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'production' },
    });
    // Ensure favicon.svg is copied to dist or .output/public
    const srcFav = path.join(dir, 'public', 'favicon.svg');
    if (fs.existsSync(srcFav)) {
      const distFav = path.join(dir, 'dist', 'favicon.svg');
      const outFav = path.join(dir, '.output', 'public', 'favicon.svg');
      if (fs.existsSync(path.join(dir, 'dist'))) {
        fs.copyFileSync(srcFav, distFav);
      }
      if (fs.existsSync(path.join(dir, '.output', 'public'))) {
        fs.copyFileSync(srcFav, outFav);
      }
    }
    console.log(`✅ Built ${mod}`);
  } catch (err) {
    console.error(`❌ Build failed for ${mod}:`, err.message);
    process.exit(1);
  }
}

console.log('\n🎉 All 15 compiled modules built successfully!');
