#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJETOS_DIR = path.resolve(__dirname, '..', 'projetos');

const EXISTING_16 = new Set([
  'agendamento_simples',
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
]);

function walkFiles(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth || !fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', '.output', '.vinxi', '.nitro'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, maxDepth, currentDepth + 1));
    } else {
      results.push(full);
    }
  }
  return results;
}

const dirs = fs
  .readdirSync(PROJETOS_DIR)
  .filter((d) => fs.statSync(path.join(PROJETOS_DIR, d)).isDirectory())
  .sort();

console.log(`Total projects in projetos/: ${dirs.length}`);
const summary = [];

for (const d of dirs) {
  const full = path.join(PROJETOS_DIR, d);
  const isNew = !EXISTING_16.has(d);
  const hasPkg = fs.existsSync(path.join(full, 'package.json'));
  const hasNodeModules = fs.existsSync(path.join(full, 'node_modules'));
  const hasDotGit = fs.existsSync(path.join(full, '.git'));
  const hasSupabaseDir = fs.existsSync(path.join(full, 'supabase'));
  const migrationsDir = path.join(full, 'supabase', 'migrations');
  const migrations = fs.existsSync(migrationsDir) ? fs.readdirSync(migrationsDir) : [];

  let pkgName = '';
  let scripts = {};
  let deps = [];
  if (hasPkg) {
    const pkg = JSON.parse(fs.readFileSync(path.join(full, 'package.json'), 'utf8'));
    pkgName = pkg.name || '';
    scripts = pkg.scripts || {};
    deps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];
  }

  const allFiles = walkFiles(full, 4).map((f) => path.relative(full, f));
  const authFiles = allFiles.filter((f) =>
    /auth|login|session|user|supabase|store|context|seed|mock|db|database/i.test(f)
  );
  const routeFiles = allFiles.filter((f) => /routes|pages|App\.tsx|main\.tsx|index\.html/i.test(f));

  const type = !hasPkg
    ? 'vanilla'
    : deps.includes('@tanstack/react-start') || deps.includes('nitro')
    ? 'nitro'
    : 'spa';

  summary.push({
    folder: d,
    isNew,
    type,
    pkgName,
    hasNodeModules,
    hasDotGit,
    hasSupabase: hasSupabaseDir || deps.includes('@supabase/supabase-js'),
    migrationsCount: migrations.length,
    migrations,
    scripts,
    authFiles: authFiles.slice(0, 15),
    routeFiles: routeFiles.slice(0, 15),
  });
}

console.log(JSON.stringify(summary.filter((s) => s.isNew), null, 2));
