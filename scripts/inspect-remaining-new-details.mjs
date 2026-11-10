#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJETOS_DIR = path.resolve(__dirname, '..', 'projetos');

const CHECK_FILES = [
  'casa_organizada_ai/src/routes/_authenticated/app.tsx',
  'casa_organizada_ai/src/routes/_authenticated/app.admin.tsx',
  'forms_pro/src/layouts/app-layout.tsx',
  'forms_pro/src/stores/auth-store.ts',
  'forms_pro/src/hooks/use-auth.ts',
  'loja_simples_hortifruti/admin/index.html',
  'loja_simples_vendas/index.html',
  'visualizador_dashboad_ai/server/db/store.ts',
];

for (const rel of CHECK_FILES) {
  const full = path.join(PROJETOS_DIR, rel);
  if (fs.existsSync(full)) {
    console.log(`\n=== ${rel} ===`);
    console.log(fs.readFileSync(full, 'utf8').slice(0, 2500));
  } else {
    console.log(`\n[NO FILE] ${rel}`);
  }
}

// Also list all files in forms_pro/src and casa_organizada_ai/src
for (const proj of ['forms_pro', 'casa_organizada_ai']) {
  const srcDir = path.join(PROJETOS_DIR, proj, 'src');
  if (fs.existsSync(srcDir)) {
    console.log(`\n--- ${proj}/src subdirs ---`);
    for (const entry of fs.readdirSync(srcDir)) {
      const p = path.join(srcDir, entry);
      if (fs.statSync(p).isDirectory()) {
        console.log(entry, '->', fs.readdirSync(p));
      } else {
        console.log(entry);
      }
    }
  }
}
