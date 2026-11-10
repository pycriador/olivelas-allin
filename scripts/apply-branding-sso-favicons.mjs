#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJETOS_DIR = path.join(ROOT_DIR, 'projetos');

// Official platform names and custom vector SVG icon configurations
const MODULE_CONFIGS = {
  root: {
    brandName: 'Olivelas - All In Enterprise Console',
    shortCode: 'AI',
    bgFrom: '#0f172a',
    bgTo: '#065f46',
    accent: '#34d399',
    glyph: `<path d="M16 5L26 11V21L16 27L6 21V11L16 5Z" stroke="#34d399" stroke-width="2.2" fill="rgba(16,185,129,0.18)"/><circle cx="16" cy="16" r="4" fill="#fde68a"/>`,
  },
  agendamento_simples: {
    brandName: 'Olivelas - Consultório & Odonto',
    shortCode: 'CO',
    bgFrom: '#0f172a',
    bgTo: '#0284c7',
    accent: '#38bdf8',
    glyph: `<rect x="7" y="8" width="18" height="17" rx="3" stroke="#38bdf8" stroke-width="2.2" fill="rgba(56,189,248,0.15)"/><path d="M11 6V10M21 6V10M7 13H25M16 16V22M13 19H19" stroke="#f8fafc" stroke-width="2.2" stroke-linecap="round"/>`,
  },
  agendamentos: {
    brandName: 'Olivelas - Clínicas & Agendamentos',
    shortCode: 'CA',
    bgFrom: '#0f172a',
    bgTo: '#0d9488',
    accent: '#2dd4bf',
    glyph: `<rect x="6" y="8" width="20" height="18" rx="3.5" stroke="#2dd4bf" stroke-width="2.2" fill="rgba(45,212,191,0.16)"/><path d="M11 5.5V9.5M21 5.5V9.5M12 17.5L15 20.5L20.5 15" stroke="#f8fafc" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  app_condominio: {
    brandName: 'Olivelas - Gestão de Condomínios',
    shortCode: 'GC',
    bgFrom: '#0f172a',
    bgTo: '#2563eb',
    accent: '#60a5fa',
    glyph: `<path d="M8 26V8C8 6.9 8.9 6 10 6H18C19.1 6 20 6.9 20 8V26M20 14H24C25.1 14 26 14.9 26 16V26M5 26H27" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round"/><rect x="11" y="10" width="2.5" height="2.5" fill="#f8fafc"/><rect x="15" y="10" width="2.5" height="2.5" fill="#f8fafc"/><rect x="11" y="15" width="2.5" height="2.5" fill="#f8fafc"/><rect x="15" y="15" width="2.5" height="2.5" fill="#f8fafc"/>`,
  },
  art_hub: {
    brandName: 'Olivelas - Art Hub & Catálogo IA',
    shortCode: 'AH',
    bgFrom: '#1e1b4b',
    bgTo: '#7c3aed',
    accent: '#c084fc',
    glyph: `<path d="M16 6C10.5 6 6 10.2 6 15.5C6 20.8 10.5 25 16 25C17.8 25 19.2 23.6 19.2 21.8C19.2 21 18.8 20.2 18.3 19.6C17.9 19.1 18.2 18.2 19 18.2H21C24.3 18.2 26.5 15.6 26.5 12.6C26.5 8.8 21.8 6 16 6Z" stroke="#c084fc" stroke-width="2.2" fill="rgba(192,132,252,0.18)"/><circle cx="11.5" cy="13" r="1.6" fill="#fde68a"/><circle cx="15.5" cy="10.5" r="1.6" fill="#f472b6"/><circle cx="20" cy="12.5" r="1.6" fill="#38bdf8"/>`,
  },
  casa_organizada: {
    brandName: 'Olivelas - Casa Organizada & Rotinas',
    shortCode: 'CR',
    bgFrom: '#064e3b',
    bgTo: '#10b981',
    accent: '#6ee7b7',
    glyph: `<path d="M6 15.5L16 7L26 15.5M9 13.5V24.5C9 25.3 9.7 26 10.5 26H21.5C22.3 26 23 25.3 23 24.5V13.5" stroke="#6ee7b7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 19.5L15.2 21.7L19.5 17" stroke="#f8fafc" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  contratos: {
    brandName: 'Olivelas - Automação de Contratos',
    shortCode: 'AC',
    bgFrom: '#0f172a',
    bgTo: '#b45309',
    accent: '#fbbf24',
    glyph: `<rect x="8" y="5.5" width="16" height="21" rx="2.5" stroke="#fbbf24" stroke-width="2.2" fill="rgba(251,191,36,0.15)"/><path d="M12 11H20M12 15H20M12 19H16" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="20.5" r="2.5" fill="#fbbf24"/>`,
  },
  especificacoes: {
    brandName: 'Olivelas - Engenharia de Especificações',
    shortCode: 'EE',
    bgFrom: '#0f172a',
    bgTo: '#4338ca',
    accent: '#818cf8',
    glyph: `<path d="M16 6L25 11L16 16L7 11L16 6Z" stroke="#818cf8" stroke-width="2.2" fill="rgba(129,140,248,0.2)"/><path d="M7 16L16 21L25 16M7 21L16 26L25 21" stroke="#f8fafc" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  gestao_estoque: {
    brandName: 'Olivelas - Gestão de Estoque & PDV',
    shortCode: 'GE',
    bgFrom: '#0f172a',
    bgTo: '#d97706',
    accent: '#fbbf24',
    glyph: `<path d="M16 5.5L25.5 10.8V21.2L16 26.5L6.5 21.2V10.8L16 5.5Z" stroke="#fbbf24" stroke-width="2.2" fill="rgba(245,158,11,0.18)"/><path d="M6.8 11L16 16.2L25.2 11M16 16.2V26.2" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>`,
  },
  ordem_de_servico: {
    brandName: 'Olivelas - Ordens de Serviço & Assistência',
    shortCode: 'OS',
    bgFrom: '#0f172a',
    bgTo: '#0369a1',
    accent: '#38bdf8',
    glyph: `<path d="M19.5 7.5C17.5 7.5 15.8 8.8 15.2 10.6L8 17.8C7.2 18.6 7.2 19.9 8 20.7L11.3 24C12.1 24.8 13.4 24.8 14.2 24L21.4 16.8C23.2 16.2 24.5 14.5 24.5 12.5C24.5 11.7 24.3 11 23.9 10.4L21.2 13.1L18.9 10.8L21.6 8.1C21 7.7 20.3 7.5 19.5 7.5Z" stroke="#38bdf8" stroke-width="2.1" fill="rgba(56,189,248,0.18)"/>`,
  },
  personal_treiner: {
    brandName: 'Olivelas - Personal Trainer',
    shortCode: 'PT',
    bgFrom: '#18181b',
    bgTo: '#e11d48',
    accent: '#fb7185',
    glyph: `<path d="M6.5 13V19M9.5 10.5V21.5M22.5 10.5V21.5M25.5 13V19M9.5 16H22.5" stroke="#fb7185" stroke-width="2.6" stroke-linecap="round"/><circle cx="16" cy="16" r="2.2" fill="#f8fafc"/>`,
  },
  restaurante: {
    brandName: 'Olivelas - Gestão de Restaurantes & KDS',
    shortCode: 'GR',
    bgFrom: '#1c1917',
    bgTo: '#ea580c',
    accent: '#fb923c',
    glyph: `<path d="M11 7V15C11 16.7 12.3 18 14 18V25M11 7V12M14 7V12M17 7V12M21 7V25M21 7C23 7 24 9.5 24 13.5H21" stroke="#fb923c" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  rifas: {
    brandName: 'Olivelas - Rifas & Sorteios Digitais',
    shortCode: 'RS',
    bgFrom: '#0f172a',
    bgTo: '#16a34a',
    accent: '#4ade80',
    glyph: `<path d="M6 11C6 9.9 6.9 9 8 9H24C25.1 9 26 9.9 26 11V13.8C24.6 13.8 23.5 14.9 23.5 16.3C23.5 17.7 24.6 18.8 26 18.8V21C26 22.1 25.1 23 24 23H8C6.9 23 6 22.1 6 21V18.8C7.4 18.8 8.5 17.7 8.5 16.3C8.5 14.9 7.4 13.8 6 13.8V11Z" stroke="#4ade80" stroke-width="2.1" fill="rgba(74,222,128,0.16)"/><circle cx="16" cy="16" r="2.5" fill="#fde68a"/>`,
  },
  sistema_delivery: {
    brandName: 'Olivelas - Central de Delivery',
    shortCode: 'CD',
    bgFrom: '#18181b',
    bgTo: '#dc2626',
    accent: '#f87171',
    glyph: `<path d="M7 19H19L22 13H16L14.5 10H9.5M10 22.5C11.4 22.5 12.5 21.4 12.5 20C12.5 18.6 11.4 17.5 10 17.5C8.6 17.5 7.5 18.6 7.5 20C7.5 21.4 8.6 22.5 10 22.5ZM21 22.5C22.4 22.5 23.5 21.4 23.5 20C23.5 18.6 22.4 17.5 21 17.5C19.6 17.5 18.5 18.6 18.5 20C18.5 21.4 19.6 22.5 21 22.5Z" stroke="#f87171" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  sistema_mercado: {
    brandName: 'Olivelas - Supermercado & Cestas',
    shortCode: 'SM',
    bgFrom: '#064e3b',
    bgTo: '#059669',
    accent: '#34d399',
    glyph: `<path d="M6.5 9H9.5L11.8 19.5H22.5L24.8 12H10.5" stroke="#34d399" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="rgba(52,211,153,0.15)"/><circle cx="13" cy="23" r="1.8" fill="#f8fafc"/><circle cx="21" cy="23" r="1.8" fill="#f8fafc"/>`,
  },
  suite_rifa: {
    brandName: 'Olivelas - Suíte Multi-Organização de Rifas',
    shortCode: 'SR',
    bgFrom: '#1e1b4b',
    bgTo: '#9333ea',
    accent: '#d8b4fe',
    glyph: `<path d="M10 8H22L24 12V22C24 23.1 23.1 24 22 24H10C8.9 24 8 23.1 8 22V12L10 8Z" stroke="#d8b4fe" stroke-width="2.1" fill="rgba(216,180,254,0.16)"/><path d="M16 12.5L17.3 15.2L20.2 15.6L18.1 17.6L18.6 20.5L16 19.1L13.4 20.5L13.9 17.6L11.8 15.6L14.7 15.2L16 12.5Z" fill="#fde68a"/>`,
  },
  vitrine_digital: {
    brandName: 'Olivelas - Vitrine Digital & Analisador IA',
    shortCode: 'VD',
    bgFrom: '#151413',
    bgTo: '#a88c5a',
    accent: '#fde68a',
    glyph: `<path d="M16 6.5L24.5 11.5L16 16.5L7.5 11.5L16 6.5Z" stroke="#fde68a" stroke-width="2.1" fill="rgba(253,230,138,0.18)"/><path d="M7.5 16.5L16 21.5L24.5 16.5M7.5 21L16 26L24.5 21" stroke="#f8fafc" stroke-width="2" stroke-linecap="round"/>`,
  },
};

function buildFaviconSvg(cfg) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <defs>
    <linearGradient id="olivelasBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${cfg.bgFrom}" />
      <stop offset="100%" stop-color="${cfg.bgTo}" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="8" fill="url(#olivelasBg)" />
  <rect x="1" y="1" width="30" height="30" rx="7" stroke="${cfg.accent}" stroke-opacity="0.45" stroke-width="1.2" />
  ${cfg.glyph}
</svg>
`;
}

function writeFaviconEverywhere(dirPath, cfg) {
  const svgContent = buildFaviconSvg(cfg);
  const targets = [
    path.join(dirPath, 'public', 'favicon.svg'),
    path.join(dirPath, 'favicon.svg'),
  ];
  if (fs.existsSync(path.join(dirPath, 'dist'))) {
    targets.push(path.join(dirPath, 'dist', 'favicon.svg'));
  }
  if (fs.existsSync(path.join(dirPath, '.output', 'public'))) {
    targets.push(path.join(dirPath, '.output', 'public', 'favicon.svg'));
  }
  for (const t of targets) {
    const parent = path.dirname(t);
    if (fs.existsSync(parent)) {
      fs.writeFileSync(t, svgContent, 'utf8');
    }
  }
}

// 1. Write Root Favicon & Update Root index.html
writeFaviconEverywhere(ROOT_DIR, MODULE_CONFIGS.root);
const rootIndexHtmlPath = path.join(ROOT_DIR, 'index.html');
if (fs.existsSync(rootIndexHtmlPath)) {
  let html = fs.readFileSync(rootIndexHtmlPath, 'utf8');
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${MODULE_CONFIGS.root.brandName}</title>`);
  if (!html.includes('href="/favicon.svg"')) {
    html = html.replace('</head>', `    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n  </head>`);
  }
  fs.writeFileSync(rootIndexHtmlPath, html, 'utf8');
}

// 2. Iterate over ALL folders in projetos/
const allProjectDirs = fs.readdirSync(PROJETOS_DIR).filter((d) => {
  const full = path.join(PROJETOS_DIR, d);
  return fs.statSync(full).isDirectory();
});

const NATIVE_TANSTACK_VITE_CONFIG = `import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    tanstackStart({
      importProtection: {
        behavior: "mock",
      },
    }),
    nitro(),
    viteReact(),
  ],
});
`;

const NATIVE_LOVABLE_AUTH_INDEX = `// Native Olivelas OAuth helper (replaces external third-party cloud auth)
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri || (typeof window !== "undefined" ? window.location.origin : undefined),
          queryParams: opts?.extraParams,
        },
      });
      if (error) {
        return { error };
      }
      return { redirected: Boolean(data?.url), data };
    },
  },
};
`;

const NATIVE_ERROR_REPORTING = `// Native Olivelas Error Telemetry (self-hosted, zero external dependencies)
type ErrorPayload = {
  message: string;
  stack?: string;
  Source?: string;
};

let installed = false;

export const reportLovableError = (
  error: unknown,
  options?: { boundary?: string; extra?: Record<string, unknown> },
) => {
  try {
    const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));
    const payload: ErrorPayload = {
      message: err.message || "Unknown runtime error",
      stack: err.stack,
      Source: options?.boundary ?? "runtime",
    };
    console.warn("[Olivelas Telemetry]", payload);
  } catch {
    // ignore
  }
};

export const installLovableErrorReporting = () => {
  if (installed || typeof window === "undefined") return;
  installed = true;
};
`;

for (const folder of allProjectDirs) {
  const projDir = path.join(PROJETOS_DIR, folder);
  const cfg = MODULE_CONFIGS[folder] || {
    brandName: `Olivelas - ${folder
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')}`,
    shortCode: folder.slice(0, 2).toUpperCase(),
    bgFrom: '#0f172a',
    bgTo: '#047857',
    accent: '#34d399',
    glyph: `<path d="M16 6L25 11V21L16 26L7 21V11L16 6Z" stroke="#34d399" stroke-width="2.2" fill="rgba(52,211,153,0.16)"/><circle cx="16" cy="16" r="3.5" fill="#fde68a"/>`,
  };

  // Write bespoke SVG favicon
  writeFaviconEverywhere(projDir, cfg);

  // Remove .lovable directory if present
  const dotLovable = path.join(projDir, '.lovable');
  if (fs.existsSync(dotLovable)) {
    fs.rmSync(dotLovable, { recursive: true, force: true });
  }

  // Clean package.json from Lovable dependencies
  const pkgPath = path.join(projDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkgRaw = fs.readFileSync(pkgPath, 'utf8');
    if (pkgRaw.includes('lovable')) {
      const pkg = JSON.parse(pkgRaw);
      for (const depGroup of ['dependencies', 'devDependencies', 'peerDependencies']) {
        if (pkg[depGroup]) {
          for (const k of Object.keys(pkg[depGroup])) {
            if (k.toLowerCase().includes('lovable')) {
              delete pkg[depGroup][k];
            }
          }
        }
      }
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    }
  }

  // Clean vite.config.ts from @lovable.dev/vite-tanstack-config or lovable-tagger
  const viteConfigPath = path.join(projDir, 'vite.config.ts');
  if (fs.existsSync(viteConfigPath)) {
    const viteRaw = fs.readFileSync(viteConfigPath, 'utf8');
    if (viteRaw.includes('@lovable.dev/vite-tanstack-config')) {
      fs.writeFileSync(viteConfigPath, NATIVE_TANSTACK_VITE_CONFIG, 'utf8');
    } else if (viteRaw.includes('lovable-tagger')) {
      const cleaned = viteRaw
        .replace(/import\s+\{\s*componentTagger\s*\}\s+from\s+["']lovable-tagger["'];?\r?\n?/g, '')
        .replace(/,?\s*mode\s*===\s*["']development["']\s*&&\s*componentTagger\(\)/g, '');
      fs.writeFileSync(viteConfigPath, cleaned, 'utf8');
    }
  }

  // Replace src/integrations/lovable/index.ts & appUserConnector.ts
  const lovableIdxPath = path.join(projDir, 'src', 'integrations', 'lovable', 'index.ts');
  if (fs.existsSync(lovableIdxPath)) {
    fs.writeFileSync(lovableIdxPath, NATIVE_LOVABLE_AUTH_INDEX, 'utf8');
  }
  const lovableConnPath = path.join(projDir, 'src', 'integrations', 'lovable', 'appUserConnector.ts');
  if (fs.existsSync(lovableConnPath) && !fs.readFileSync(lovableConnPath, 'utf8').includes('callAsAppUser')) {
    fs.writeFileSync(
      lovableConnPath,
      `// Native Olivelas Auth Bridge\nexport function initAppUserConnector() {}\n`,
      'utf8'
    );
  }

  // Replace src/lib/lovable-error-reporting.ts
  const errReportPath = path.join(projDir, 'src', 'lib', 'lovable-error-reporting.ts');
  if (fs.existsSync(errReportPath)) {
    fs.writeFileSync(errReportPath, NATIVE_ERROR_REPORTING, 'utf8');
  }

  // Update index.html if present
  const idxHtmlPath = path.join(projDir, 'index.html');
  if (fs.existsSync(idxHtmlPath)) {
    let html = fs.readFileSync(idxHtmlPath, 'utf8');
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${cfg.brandName}</title>`);
    // Replace any existing icon link or insert new one
    if (/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/i.test(html)) {
      html = html.replace(
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*>/gi,
        `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`
      );
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n  </head>`);
    }
    html = html.replace(/Lovable App/g, cfg.brandName).replace(/content=["']Lovable["']/gi, `content="${cfg.brandName}"`);
    fs.writeFileSync(idxHtmlPath, html, 'utf8');
  }

  // Update src/routes/__root.tsx if present (TanStack Start apps)
  const rootRoutePath = path.join(projDir, 'src', 'routes', '__root.tsx');
  if (fs.existsSync(rootRoutePath)) {
    let rootTsx = fs.readFileSync(rootRoutePath, 'utf8');
    rootTsx = rootTsx
      .replace(/\{\s*title:\s*["'][^"']*["']\s*\}/g, `{ title: "${cfg.brandName}" }`)
      .replace(/content:\s*["']Lovable["']/g, `content: "${cfg.brandName}"`)
      .replace(/content:\s*["']Lovable App["']/g, `content: "${cfg.brandName}"`)
      .replace(/content:\s*["']@Lovable["']/g, `content: "@Olivelas"`)
      .replace(/href:\s*["']\/favicon\.ico["']/g, `href: "/favicon.svg"`);
    fs.writeFileSync(rootRoutePath, rootTsx, 'utf8');
  }
}

// Update agendamento_simples pages/*.html and login.html
const agSimplesDir = path.join(PROJETOS_DIR, 'agendamento_simples');
const agSimplesPagesDir = path.join(agSimplesDir, 'pages');
for (const htmlFile of [
  path.join(agSimplesDir, 'login.html'),
  ...(fs.existsSync(agSimplesPagesDir)
    ? fs.readdirSync(agSimplesPagesDir).map((f) => path.join(agSimplesPagesDir, f))
    : []),
]) {
  if (fs.existsSync(htmlFile) && htmlFile.endsWith('.html')) {
    let html = fs.readFileSync(htmlFile, 'utf8');
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${MODULE_CONFIGS.agendamento_simples.brandName}</title>`);
    if (!html.includes('favicon.svg')) {
      html = html.replace('</head>', `  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>`);
    }
    fs.writeFileSync(htmlFile, html, 'utf8');
  }
}

console.log('✅ Favicons, HTML titles, and Lovable removals applied across all projects.');

function updateProjectFile(relPath, transform) {
  const fullPath = path.join(PROJETOS_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ File not found: ${relPath}`);
    return;
  }
  const original = fs.readFileSync(fullPath, 'utf8');
  const normalized = original.replace(/\r\n/g, '\n');
  const updated = transform(normalized);
  if (updated !== normalized) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✅ Updated ${relPath}`);
  }
}

// 1. agendamento_simples (4101): Olivelas - Consultório & Odonto
updateProjectFile('agendamento_simples/js/components.js', (src) =>
  src
    .replace(
      /<div class="brand-name">Dra\. Marta Gelsi<\/div>\s*<div class="brand-subtitle">Odontologia Especializada<\/div>/,
      `<div class="brand-name">Olivelas - Consultório & Odonto</div>\n                    <div class="brand-subtitle">Super Administrador • All In</div>`
    )
    .replace(/name: 'Dra\. Marta Gelsi'/, `name: 'Willian Jesus'`)
    .replace(/role: 'Administradora'/, `role: 'Super Administrador'`)
    .replace(/email: 'marta@clinica\.com'/, `email: 'willian.o.jesus@gmail.com'`)
);

updateProjectFile('agendamento_simples/js/auth.js', (src) =>
  src
    .replace(/email === 'marta@clinica\.com'/, `email === 'willian.o.jesus@gmail.com' || email === 'marta@clinica.com'`)
    .replace(/name: 'Dra\. Marta Gelsi'/g, `name: 'Willian Jesus'`)
    .replace(/role: 'Administradora'/g, `role: 'Super Administrador'`)
    .replace(
      /const sessionStr = localStorage\.getItem\(SESSION_KEY\);/,
      `const params = new URLSearchParams(window.location.search);
    const rawEmail = params.get('user_email') || '';
    const isLegacy = !rawEmail || rawEmail.includes('@olivelas-allin.demo') || rawEmail.includes('clara.monteiro');
    const ssoUser = {
      id: 'USR-001',
      email: isLegacy ? 'willian.o.jesus@gmail.com' : rawEmail,
      name: isLegacy ? 'Willian Jesus' : (params.get('user_name') || 'Willian Jesus'),
      role: 'Super Administrador (' + (params.get('company_name') || 'Olivelas Atelier & Varejo') + ')'
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(ssoUser));
    const sessionStr = localStorage.getItem(SESSION_KEY);`
    )
);

// 2. agendamentos (4102): Olivelas - Clínicas & Agendamentos
updateProjectFile('agendamentos/src/shared/components/app-sidebar.tsx', (src) =>
  src
    .replace(
      /<span className="truncate font-semibold tracking-tight">\s*\{t\("app\.name"\)\}\s*<\/span>/,
      `<span className="truncate font-semibold tracking-tight">Olivelas - Clínicas & Agendamentos</span>`
    )
    .replace(
      /<span className="truncate text-xs text-muted-foreground">\s*\{t\("app\.tagline"\)\}\s*<\/span>/,
      `<span className="truncate text-xs text-muted-foreground">Super Administrador • All In</span>`
    )
);

updateProjectFile('agendamentos/src/shared/hooks/use-current-profile.ts', (src) =>
  src
    .replace(
      /const ssoEmail = params\?\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\?\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
      `const rawEmail = params?.get("user_email") || "";
      const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
      const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
      const ssoName = isLegacy ? "Willian Jesus" : (params?.get("user_name") || "Willian Jesus");`
    )
);

// 3. app_condominio (4103): Olivelas - Gestão de Condomínios
updateProjectFile('app_condominio/src/components/navigation/DesktopSidebar.tsx', (src) =>
  src.replace(/Condominium SaaS/g, 'Olivelas - Gestão de Condomínios')
);

updateProjectFile('app_condominio/src/context/AppContext.tsx', (src) =>
  src
    .replace(
      /const \[activeRole, setActiveRole\] = useState<Role>\(\(\) => \{[\s\S]*?return 'syndic';\s*\}\);/,
      `const [activeRole, setActiveRole] = useState<Role>(() => {
    return 'global_admin';
  });`
    )
    .replace(
      /document\.title = `\$\{activeTenant\.name\} \| Olivelas Condomínio`;/,
      `document.title = 'Olivelas - Gestão de Condomínios';`
    )
);

updateProjectFile('app_condominio/src/mock-data/users.ts', (src) =>
  src
    .replace(/name:\s*'Carlos Eduardo \(Master\)'/, `name: 'Willian Jesus (Super Administrador)'`)
    .replace(/email:\s*'master@condosaas\.com'/, `email: 'willian.o.jesus@gmail.com'`)
    .replace(/name:\s*'Roberto Almeida'/, `name: 'Willian Jesus'`)
    .replace(/email:\s*'sindico@horizonteazul\.com'/, `email: 'willian.o.jesus@gmail.com'`)
);

// 4. art_hub (4104): Olivelas - Art Hub & Catálogo IA
updateProjectFile('art_hub/src/components/layout/admin-sidebar.tsx', (src) =>
  src
    .replace(/>Olivelas</, `>Olivelas - Art Hub & Catálogo IA<`)
    .replace(/>Enterprise Hub</, `>Super Administrador • All In<`)
);

updateProjectFile('art_hub/src/hooks/use-auth.ts', (src) =>
  src.replace(
    /const ssoEmail = params\?\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\?\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
    `const rawEmail = params?.get("user_email") || "";
    const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
    const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
    const ssoName = isLegacy ? "Willian Jesus" : (params?.get("user_name") || "Willian Jesus");`
  )
);

// 5. casa_organizada (4105): Olivelas - Casa Organizada & Rotinas
updateProjectFile('casa_organizada/src/hooks/useAuth.tsx', (src) =>
  src.replace(
    /const ssoEmail = params\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\.get\("user_name"\) \|\| "Willian Jesus";/,
    `const rawEmail = params.get("user_email") || "";
      const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
      const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
      const ssoName = isLegacy ? "Willian Jesus" : (params.get("user_name") || "Willian Jesus");`
  )
);

updateProjectFile('casa_organizada/src/hooks/useRoutine.ts', (src) =>
  src.replace(/userName:\s*'[^']*'/, `userName: 'Willian Jesus'`)
);

updateProjectFile('casa_organizada/src/pages/Index.tsx', (src) =>
  src.replace(
    /<p className="text-muted-foreground text-xs capitalize">\{todayStr\}<\/p>/,
    `<p className="text-primary font-semibold text-xs">Olivelas - Casa Organizada & Rotinas • Super Administrador (willian.o.jesus@gmail.com)</p>\n              <p className="text-muted-foreground text-xs capitalize">{todayStr}</p>`
  )
);

// 6. contratos (4106): Olivelas - Automação de Contratos
updateProjectFile('contratos/src/components/shared/logo.tsx', (src) =>
  src
    .replace(/Clause<span className="text-primary">Forge<\/span>/, `Olivelas - <span className="text-primary">Automação de Contratos</span>`)
);

updateProjectFile('contratos/src/hooks/use-auth.ts', (src) =>
  src.replace(
    /const demoRaw = typeof window !== "undefined" \? localStorage\.getItem\(DEMO_STORAGE_KEY\) : null;\s*if \(demoRaw\) \{[\s\S]*?return;\s*\}/,
    `if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rawEmail = params.get("user_email") || "";
      const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
      const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
      const ssoName = isLegacy ? "Willian Jesus" : (params.get("user_name") || "Willian Jesus");
      const parsed: SessionUser = {
        id: "00000000-0000-0000-0000-000000000001",
        email: ssoEmail,
        name: ssoName,
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(parsed));
      setSession({
        user: parsed,
        profile: {
          userId: parsed.id,
          fullName: parsed.name,
          isGlobalAdmin: true,
        },
        roles: ["admin"],
        groups: [],
        permissions: ["document:generate", "template:create", "template:edit", "template:delete", "iam:manage"],
      });
      return;
    }`
  )
);

// 7. especificacoes (4107): Olivelas - Engenharia de Especificações
updateProjectFile('especificacoes/src/components/layout/app-sidebar.tsx', (src) =>
  src
    .replace(/>SpecForge</, `>Olivelas - Engenharia de Especificações<`)
    .replace(/>SDD Console</, `>Super Administrador • All In<`)
);

updateProjectFile('especificacoes/src/stores/auth.store.ts', (src) =>
  src.replace(
    /const ssoEmail = params\?\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\?\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
    `const rawEmail = params?.get("user_email") || "";
      const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
      const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
      const ssoName = isLegacy ? "Willian Jesus" : (params?.get("user_name") || "Willian Jesus");`
  )
);

// 8. gestao_estoque (4108): Olivelas - Gestão de Estoque & PDV
updateProjectFile('gestao_estoque/src/layouts/AppLayout.tsx', (src) =>
  src
    .replace(/>Olivelas</, `>Olivelas - Gestão de Estoque & PDV<`)
    .replace(/>Gestão Enterprise</, `>Super Administrador • All In<`)
);

updateProjectFile('gestao_estoque/src/stores/authStore.ts', (src) =>
  src.replace(
    /const ssoEmail = ssoParams\?\.get\('user_email'\) \|\| 'willian\.o\.jesus@gmail\.com';\s*const ssoName = ssoParams\?\.get\('user_name'\) \|\| 'Willian Jesus';/,
    `const rawEmail = ssoParams?.get('user_email') || '';
  const isLegacy = !rawEmail || rawEmail.includes('@olivelas-allin.demo') || rawEmail.includes('clara.monteiro');
  const ssoEmail = isLegacy ? 'willian.o.jesus@gmail.com' : rawEmail;
  const ssoName = isLegacy ? 'Willian Jesus' : (ssoParams?.get('user_name') || 'Willian Jesus');`
  )
);

// 9. ordem_de_servico (4109): Olivelas - Ordens de Serviço & Assistência
updateProjectFile('ordem_de_servico/src/core/constants.ts', (src) =>
  src.replace(/export const APP_NAME = "[^"]*";/, `export const APP_NAME = "Olivelas - Ordens de Serviço & Assistência";`)
);

updateProjectFile('ordem_de_servico/src/providers/AuthProvider.tsx', (src) =>
  src.replace(
    /const ssoEmail = params\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
    `const rawEmail = params.get("user_email") || "";
      const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
      const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
      const ssoName = isLegacy ? "Willian Jesus" : (params.get("user_name") || "Willian Jesus");`
  )
);

// 10. personal_treiner (4110): Olivelas - Personal Trainer
updateProjectFile('personal_treiner/src/layouts/PersonalLayout.tsx', (src) =>
  src
    .replace(
      /<h1 className="font-bold text-lg tracking-tight text-white leading-none">RAFAELA<\/h1>\s*<p className="text-xs text-rose-400 font-medium tracking-widest uppercase mt-1">Personal<\/p>/,
      `<h1 className="font-bold text-base tracking-tight text-white leading-snug">Olivelas - Personal Trainer</h1>\n            <p className="text-[11px] text-rose-400 font-medium tracking-wider uppercase mt-0.5">Super Administrador • All In</p>`
    )
    .replace(
      /<p className="text-sm font-medium text-white truncate">\{currentUser\?\.name \|\| 'Personal'\}<\/p>\s*<p className="text-xs text-zinc-500 truncate">\{currentUser\?\.email \|\| 'Admin'\}<\/p>/,
      `<p className="text-sm font-medium text-white truncate">{currentUser?.name || 'Willian Jesus'}</p>\n              <p className="text-xs text-emerald-400 truncate">Super Administrador • {currentUser?.email || 'willian.o.jesus@gmail.com'}</p>`
    )
    .replace(
      /<span className="font-bold text-base tracking-tight text-white">RAFAELA<\/span>/g,
      `<span className="font-bold text-sm tracking-tight text-white">Olivelas - Personal Trainer</span>`
    )
);

updateProjectFile('personal_treiner/src/layouts/StudentLayout.tsx', (src) =>
  src
    .replace(
      /<h1 className="font-bold text-sm tracking-tight text-white leading-none">RAFAELA<\/h1>\s*<p className="text-\[10px\] text-rose-400 font-medium tracking-widest uppercase">Área da Aluna<\/p>/,
      `<h1 className="font-bold text-sm tracking-tight text-white leading-none">Olivelas - Personal Trainer</h1>\n            <p className="text-[10px] text-rose-400 font-medium tracking-widest uppercase">Área do Aluno • {currentUser?.name || 'Willian Jesus'}</p>`
    )
);

updateProjectFile('personal_treiner/src/repositories/storage.ts', (src) =>
  src
    .replace(/const USERS_KEY = '[^']*';/, `const USERS_KEY = 'olivelas_personal_users_v5';`)
    .replace(/const CURRENT_USER_KEY = '[^']*';/, `const CURRENT_USER_KEY = 'olivelas_personal_current_user_v5';`)
);

updateProjectFile('personal_treiner/src/context/AuthContext.tsx', (src) =>
  src.replace(
    /let current = storage\.getCurrentUser\(\);[\s\S]*?setCurrentUser\(current\);/,
    `let current = storage.getCurrentUser();
    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const rawEmail = params?.get('user_email') || current?.email || '';
    const isLegacy = !rawEmail || rawEmail.includes('@olivelas-allin.demo') || rawEmail.includes('clara.monteiro') || rawEmail.includes('rafaela');
    const targetEmail = isLegacy ? 'willian.o.jesus@gmail.com' : rawEmail;
    const targetName = isLegacy ? 'Willian Jesus' : (params?.get('user_name') || current?.name || 'Willian Jesus');
    const adminUser: User = {
      ...(loadedUsers.find((u) => u.role === 'admin') || loadedUsers[0]),
      id: 'personal-1',
      name: targetName,
      email: targetEmail,
      role: 'admin',
      isPersonal: true,
    };
    storage.saveCurrentUser(adminUser);
    setCurrentUser(adminUser);`
  )
);

updateProjectFile('personal_treiner/src/pages/auth/LoginPage.tsx', (src) =>
  src
    .replace(/Rafaela Personal/g, 'Olivelas - Personal Trainer')
    .replace(/RAFAELA/g, 'Olivelas - Personal Trainer')
    .replace(/rafaela@personal\.com/g, 'willian.o.jesus@gmail.com')
);

updateProjectFile('personal_treiner/src/components/landing/LandingNavbar.tsx', (src) =>
  src.replace(/>RAFAELA</g, `>Olivelas - Personal Trainer<`)
);

updateProjectFile('personal_treiner/src/components/landing/LandingFooter.tsx', (src) =>
  src.replace(/>RAFAELA</g, `>Olivelas - Personal Trainer<`)
);

// 11. restaurante (4111): Olivelas - Gestão de Restaurantes & KDS
updateProjectFile('restaurante/src/components/ui/logo.tsx', (src) =>
  src
    .replace(/>Olivelas</, `>Olivelas - Gestão de Restaurantes & KDS<`)
    .replace(/>Gastronomia & Gestão</, `>Super Administrador • All In<`)
);

updateProjectFile('restaurante/src/contexts/AuthContext.tsx', (src) =>
  src.replace(
    /const ssoEmail = params\.get\('user_email'\) \|\| 'willian\.o\.jesus@gmail\.com';\s*const ssoName = params\.get\('user_name'\) \|\| 'Willian Jesus \(SSO All In\)';/,
    `const rawEmail = params.get('user_email') || '';
      const isLegacy = !rawEmail || rawEmail.includes('@olivelas-allin.demo') || rawEmail.includes('clara.monteiro');
      const ssoEmail = isLegacy ? 'willian.o.jesus@gmail.com' : rawEmail;
      const ssoName = isLegacy ? 'Willian Jesus' : (params.get('user_name') || 'Willian Jesus');`
  )
);

// 12. rifas (4112): Olivelas - Rifas & Sorteios Digitais
updateProjectFile('rifas/src/components/admin/admin-sidebar.tsx', (src) =>
  src
    .replace(/>RaffleHub</, `>Olivelas - Rifas & Sorteios Digitais<`)
    .replace(/>Console Admin</, `>Super Administrador • All In<`)
);

updateProjectFile('rifas/src/components/layout/app-sidebar.tsx', (src) =>
  src
    .replace(/>RaffleHub</, `>Olivelas - Rifas & Sorteios Digitais<`)
    .replace(/>Enterprise Platform</, `>Super Administrador • All In<`)
);

updateProjectFile('rifas/src/contexts/auth-context.tsx', (src) =>
  src.replace(
    /const ssoEmail = params\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
    `const rawEmail = params.get("user_email") || "";
      const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
      const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
      const ssoName = isLegacy ? "Willian Jesus" : (params.get("user_name") || "Willian Jesus");`
  )
);

// 13. sistema_delivery (4113): Olivelas - Central de Delivery
updateProjectFile('sistema_delivery/src/App.tsx', (src) =>
  src
    .replace(
      /<span className="font-bold text-lg tracking-tight text-slate-900">Olivelas<\/span>\s*<span className="text-\[10px\] uppercase tracking-widest text-emerald-600 font-bold">Delivery Enterprise<\/span>/,
      `<span className="font-bold text-sm tracking-tight text-slate-900">Olivelas - Central de Delivery</span>\n      <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Super Administrador • All In</span>`
    )
    .replace(/>Rafaela Costa</g, `>Willian Jesus<`)
    .replace(/>RC</g, `>WJ<`)
    .replace(/>Super Admin</g, `>Super Administrador<`)
);

// 14. sistema_mercado (4114): Olivelas - Supermercado & Cestas
updateProjectFile('sistema_mercado/src/components/layout/admin-layout.tsx', (src) =>
  src.replace(/Market<span className="text-primary">Flow<\/span>/g, `Olivelas - <span className="text-primary">Supermercado & Cestas</span>`)
);

updateProjectFile('sistema_mercado/src/context/auth-context.tsx', (src) =>
  src.replace(
    /const saved = readSession\(\);[\s\S]*?return saved;/,
    `const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const rawEmail = params?.get('user_email') || '';
    const isLegacy = !rawEmail || rawEmail.includes('@olivelas-allin.demo') || rawEmail.includes('clara.monteiro');
    const ssoEmail = isLegacy ? 'willian.o.jesus@gmail.com' : rawEmail;
    const ssoName = isLegacy ? 'Willian Jesus' : (params?.get('user_name') || 'Willian Jesus');
    const defaultSession: SessionData = {
      user: { id: 'user-willian-global', email: ssoEmail },
      profile: {
        id: 'user-willian-global',
        full_name: ssoName + ' (Super Administrador)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
    writeSession(defaultSession);
    return defaultSession;`
  )
);

// 15. suite_rifa (4115): Olivelas - Suíte Multi-Organização de Rifas
updateProjectFile('suite_rifa/src/components/app/AppShell.tsx', (src) =>
  src.replace(/>RaffleHub</g, `>Olivelas - Suíte Multi-Organização de Rifas<`)
);

updateProjectFile('suite_rifa/src/routes/dashboard.tsx', (src) =>
  src.replace(/Dashboard — RaffleHub/g, 'Olivelas - Suíte Multi-Organização de Rifas')
);

updateProjectFile('suite_rifa/src/hooks/useTenant.ts', (src) =>
  src.replace(
    /const ssoEmail = params\?\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\?\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
    `const rawEmail = params?.get("user_email") || "";
    const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
    const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
    const ssoName = isLegacy ? "Willian Jesus" : (params?.get("user_name") || "Willian Jesus");`
  )
);

// 16. vitrine_digital (4116): Olivelas - Vitrine Digital & Analisador IA
updateProjectFile('vitrine_digital/src/components/EnterpriseNavbar.tsx', (src) =>
  src
    .replace(/Vitrine Digital/g, 'Olivelas - Vitrine Digital & Analisador IA')
    .replace(/Catálogo de Ofertas & Comércios/g, 'Super Administrador • All In')
);

updateProjectFile('vitrine_digital/src/routes/index.tsx', (src) =>
  src.replace(/Lovable AI/g, 'Olivelas AI Vision')
);

updateProjectFile('vitrine_digital/src/lib/auth-context.tsx', (src) =>
  src.replace(
    /const ssoEmail = params\.get\("user_email"\) \|\| "willian\.o\.jesus@gmail\.com";\s*const ssoName = params\.get\("user_name"\) \|\| "Willian Jesus \(SSO All In\)";/,
    `const rawEmail = params.get("user_email") || "";
        const isLegacy = !rawEmail || rawEmail.includes("@olivelas-allin.demo") || rawEmail.includes("clara.monteiro");
        const ssoEmail = isLegacy ? "willian.o.jesus@gmail.com" : rawEmail;
        const ssoName = isLegacy ? "Willian Jesus" : (params.get("user_name") || "Willian Jesus");`
  )
);

console.log('✅ All 16 module UI brands and Super Admin SSO configurations updated.');
