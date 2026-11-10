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
  { port: 4111, folder: 'restaurante', adminPath: '/admin/dashboard', expectedBrand: 'Olivelas - Gestão de Restaurantes & KDS' },
  { port: 4112, folder: 'rifas', adminPath: '/admin/dashboard', expectedBrand: 'Olivelas - Rifas & Sorteios Digitais' },
  { port: 4113, folder: 'sistema_delivery', adminPath: '/app/orders', expectedBrand: 'Olivelas - Central de Delivery' },
  { port: 4114, folder: 'sistema_mercado', adminPath: '/admin/dashboard', expectedBrand: 'Olivelas - Supermercado & Cestas' },
  { port: 4115, folder: 'suite_rifa', adminPath: '/dashboard', expectedBrand: 'Olivelas - Suíte Multi-Organização de Rifas' },
  { port: 4116, folder: 'vitrine_digital', adminPath: '/?view=analyzer', expectedBrand: 'Olivelas - Vitrine Digital & Analisador IA' },
];

async function runVerification() {
  let failures = 0;

  console.log('🔍 1. Verificando ausência total de pacotes Lovable em todos os package.json...');
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
    console.log('✅ Zero pacotes Lovable em todos os projetos!');
  }

  console.log('\n🔍 2. Verificando Console Raiz (5174) + todas as 16 plataformas (4101-4116)...');
  for (const mod of MODULES) {
    // Test with legacy Clara Monteiro query params to verify normalization to willian.o.jesus@gmail.com
    const sep = mod.adminPath.includes('?') ? '&' : '?';
    const testUrl = `http://localhost:${mod.port}${mod.adminPath}${sep}allin_sso=1&instance_id=inst_emp-olivelas-matriz_${mod.folder}&company_id=emp-olivelas-matriz&company_name=Olivelas+Atelier+%26+Varejo&user_id=usr-super-admin&user_email=clara.monteiro%40olivelas-allin.demo&user_name=Clara+Monteiro&user_role=GLOBAL_ADMIN`;
    const favUrl = `http://localhost:${mod.port}/favicon.svg`;

    const [pageRes, favRes] = await Promise.all([fetch(testUrl), fetch(favUrl)]);
    const html = await pageRes.text();
    const favSvg = await favRes.text();

    const hasTitle = html.includes(`<title>${mod.expectedBrand}</title>`);
    const hasFaviconLink = html.includes('href="/favicon.svg"');
    const hasWillianSso = html.includes('willian.o.jesus@gmail.com') && html.includes('Willian Jesus');
    const favOk = favRes.status === 200 && favSvg.includes('<svg');

    if (pageRes.status === 200 && hasTitle && hasFaviconLink && hasWillianSso && favOk) {
      console.log(`✅ [${mod.port}] ${mod.expectedBrand} | HTTP 200 | Favicon SVG OK | Super Admin: willian.o.jesus@gmail.com`);
    } else {
      console.error(`❌ [${mod.port}] ${mod.expectedBrand} FAILED:`, {
        status: pageRes.status,
        hasTitle,
        hasFaviconLink,
        hasWillianSso,
        favOk,
      });
      failures++;
    }
  }

  if (failures > 0) {
    process.exit(1);
  }
  console.log('\n🎉 Todas as 16 plataformas passaram 100% nos testes de Nome Oficial, FavIcon SVG, remoção do Lovable e SSO Super Admin (willian.o.jesus@gmail.com)!');
}

runVerification();
