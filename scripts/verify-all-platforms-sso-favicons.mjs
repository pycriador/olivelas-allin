#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const MODULES = [
  { port: 4101, folder: 'agendamento_simples', adminPath: '/pages/dashboard.html', expectedBrand: 'Olivelas - Consultório & Odonto' },
  { port: 4102, folder: 'agendamentos', adminPath: '/dashboard', expectedBrand: 'Olivelas - Clínicas & Agendamentos' },
  { port: 4103, folder: 'app_condominio', adminPath: '/', expectedBrand: 'Olivelas - Gestão de Condomínios' },
  { port: 4104, folder: 'art_hub', adminPath: '/admin', expectedBrand: 'Olivelas - Art Hub & Catálogo IA' },
  { port: 4105, folder: 'casa_organizada', adminPath: '/', expectedBrand: 'Olivelas - Casa Organizada & Rotinas' },
  { port: 4106, folder: 'contratos', adminPath: '/dashboard', expectedBrand: 'Olivelas - Automação de Contratos' },
  { port: 4107, folder: 'especificacoes', adminPath: '/projects', expectedBrand: 'Olivelas - Engenharia de Especificações' },
  { port: 4108, folder: 'gestao_estoque', adminPath: '/dashboard', expectedBrand: 'Olivelas - Gestão de Estoque & PDV' },
  { port: 4109, folder: 'ordem_de_servico', adminPath: '/dashboard', expectedBrand: 'Olivelas - Ordens de Serviço & Assistência' },
  { port: 4110, folder: 'personal_treiner', adminPath: '/personal/dashboard', expectedBrand: 'Olivelas - Personal Trainer' },
  { port: 4111, folder: 'restaurante', adminPath: '/app', expectedBrand: 'Olivelas - Gestão de Restaurantes & KDS' },
  { port: 4112, folder: 'rifas', adminPath: '/admin/dashboard', expectedBrand: 'Olivelas - Rifas & Sorteios Digitais' },
  { port: 4113, folder: 'sistema_delivery', adminPath: '/app/orders', expectedBrand: 'Olivelas - Central de Delivery' },
  { port: 4114, folder: 'sistema_mercado', adminPath: '/admin/dashboard', expectedBrand: 'Olivelas - Supermercado & Cestas' },
  { port: 4115, folder: 'suite_rifa', adminPath: '/dashboard', expectedBrand: 'Olivelas - Suíte Multi-Organização de Rifas' },
  { port: 4116, folder: 'vitrine_digital', adminPath: '/?view=analyzer', expectedBrand: 'Olivelas - Vitrine Digital & Analisador IA' },
  { port: 4117, folder: 'album_figurinhas', adminPath: '/admin', expectedBrand: 'Olivelas - Álbum de Figurinhas Digital' },
  { port: 4118, folder: 'artes_caneca', adminPath: '/dashboard', expectedBrand: 'Olivelas - Estúdio de Artes & Canecas' },
  { port: 4119, folder: 'casa_organizada_ai', adminPath: '/app', expectedBrand: 'Olivelas - Casa Organizada AI & Automação' },
  { port: 4120, folder: 'cesta_cafe_manha', adminPath: '/painel', expectedBrand: 'Olivelas - Cestas de Café & Presentes' },
  { port: 4121, folder: 'collection_vault', adminPath: '/dashboard', expectedBrand: 'Olivelas - Collection Vault & Acervos' },
  { port: 4122, folder: 'dashboard_bi', adminPath: '/dashboards', expectedBrand: 'Olivelas - Dashboard BI & Analytics' },
  { port: 4123, folder: 'forms', adminPath: '/app', expectedBrand: 'Olivelas - IAM Forms & Pesquisas' },
  { port: 4124, folder: 'forms_pro', adminPath: '/dashboard', expectedBrand: 'Olivelas - Forms Pro Enterprise' },
  { port: 4125, folder: 'gerenciador_tunnel_apps', adminPath: '/', expectedBrand: 'Olivelas - Gerenciador de Túneis & Apps' },
  { port: 4126, folder: 'iam_suite', adminPath: '/dashboard', expectedBrand: 'Olivelas - IAM Suite & Governança' },
  { port: 4127, folder: 'inventario_jogos', adminPath: '/app', expectedBrand: 'Olivelas - Inventário de Jogos & Mídias' },
  { port: 4128, folder: 'link_promo', adminPath: '/app', expectedBrand: 'Olivelas - Link Promo & Afiliados' },
  { port: 4129, folder: 'loja_simples_hortifruti', adminPath: '/admin/index.html', expectedBrand: 'Olivelas - Hortifruti & Feira Fresca' },
  { port: 4130, folder: 'loja_simples_vendas', adminPath: '/index.html', expectedBrand: 'Olivelas - Loja Simples de Vendas' },
  { port: 4131, folder: 'qrcode_maker', adminPath: '/', expectedBrand: 'Olivelas - Estúdio QR Code & PIX' },
  { port: 4132, folder: 'site_simpes_vendas_velas', adminPath: '/index.html', expectedBrand: 'Olivelas - Boutique de Velas Artesanais' },
  { port: 4133, folder: 'site_simples_personal_trainer', adminPath: '/index.html', expectedBrand: 'Olivelas - Landing Personal Trainer' },
  { port: 4134, folder: 'site_simples_produtos_naturais', adminPath: '/index.html', expectedBrand: 'Olivelas - Empório Produtos Naturais' },
  { port: 4135, folder: 'site_simples_ti', adminPath: '/index.html', expectedBrand: 'Olivelas - Consultoria & Soluções de TI' },
  { port: 4136, folder: 'sync_google_drive', adminPath: '/', expectedBrand: 'Olivelas - Sync Google Drive & Backup' },
  { port: 4137, folder: 'visualizador_dashboad_ai', adminPath: '/', expectedBrand: 'Olivelas - Visualizador Dashboard AI' },
];

async function runVerification() {
  let failures = 0;

  console.log('🔍 1. Verificando ausência total de pacotes Lovable em todos os 37 projetos...');
  const projetosDir = path.join(ROOT_DIR, 'projetos');
  for (const dir of fs.readdirSync(projetosDir)) {
    const pkgPath = path.join(projetosDir, dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const content = fs.readFileSync(pkgPath, 'utf8');
      if (content.toLowerCase().includes('lovable')) {
        console.error(`❌ [Lovable Found] ${dir}/package.json still references lovable!`);
        failures++;
      }
    }
  }
  if (failures === 0) {
    console.log('✅ Zero pacotes Lovable em todos os 37 projetos!');
  }

  console.log('\n🔍 2. Verificando todas as 37 plataformas (4101–4137)...');
  for (const mod of MODULES) {
    const sep = mod.adminPath.includes('?') ? '&' : '?';
    const testUrl = `http://localhost:${mod.port}${mod.adminPath}${sep}allin_sso=1&instance_id=inst_emp-olivelas-matriz_${mod.folder}&company_id=emp-olivelas-matriz&company_name=Olivelas+Atelier+%26+Varejo&user_id=usr-super-admin&user_email=clara.monteiro%40olivelas-allin.demo&user_name=Clara+Monteiro&user_role=GLOBAL_ADMIN`;
    const favUrl = `http://localhost:${mod.port}/favicon.svg`;

    const [pageRes, favRes] = await Promise.all([fetch(testUrl), fetch(favUrl)]);
    const html = await pageRes.text();
    const favSvg = await favRes.text();

    const hasTitle = html.includes(`<title>${mod.expectedBrand}</title>`);
    const hasFaviconLink = html.includes('href="/favicon.svg"');
    const hasWillianSso = html.includes('willian.o.jesus@gmail.com') && html.includes('Willian Jesus');
    const hasNoMalformedHead = !html.includes('</svg>"') && !/<link[^>]*rel=["']icon["'][^>]*>\s*<path/i.test(html);
    const favOk = favRes.status === 200 && favSvg.includes('<svg');

    if (pageRes.status === 200 && hasTitle && hasFaviconLink && hasWillianSso && hasNoMalformedHead && favOk) {
      console.log(`✅ [${mod.port}] ${mod.expectedBrand} | HTTP 200 | Favicon SVG OK | Super Admin: willian.o.jesus@gmail.com`);
    } else {
      console.error(`❌ [${mod.port}] ${mod.expectedBrand} FAILED:`, {
        status: pageRes.status,
        hasTitle,
        hasFaviconLink,
        hasWillianSso,
        hasNoMalformedHead,
        favOk,
      });
      failures++;
    }
  }

  // Also verify local API endpoints on 4125, 4136, 4137
  const [tunnelRes, gdriveRes, dashAiRes] = await Promise.all([
    fetch('http://localhost:4125/api/settings/status').then((r) => r.json()),
    fetch('http://localhost:4136/api/auth/status').then((r) => r.json()),
    fetch('http://localhost:4137/api/auth/me').then((r) => r.json()),
  ]);
  if (
    tunnelRes.adminEmail === 'willian.o.jesus@gmail.com' &&
    gdriveRes.user?.email === 'willian.o.jesus@gmail.com' &&
    dashAiRes.user?.email === 'willian.o.jesus@gmail.com'
  ) {
    console.log('✅ APIs locais (4125, 4136, 4137) autenticadas com Global Admin: willian.o.jesus@gmail.com');
  } else {
    console.error('❌ Falha nas APIs locais (4125, 4136, 4137):', { tunnelRes, gdriveRes, dashAiRes });
    failures++;
  }

  if (failures > 0) {
    process.exit(1);
  }
  console.log('\n🎉 Todas as 37 plataformas passaram 100% nos testes de Nome Oficial, FavIcon SVG, remoção do Lovable e SSO Super Admin (willian.o.jesus@gmail.com)!');
}

runVerification();
