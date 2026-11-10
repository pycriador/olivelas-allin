#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const PROJETOS_DIR = path.join(ROOT_DIR, 'projetos');
const SINGLE_SERVER_SCRIPT = path.join(__dirname, 'serve-single-module.mjs');

export const MODULE_SERVERS = [
  {
    folder: 'agendamento_simples',
    moduleSlug: 'allin_agendamento_simples',
    brandName: 'Olivelas - Consultório & Odonto',
    port: 4101,
    adminPath: '/pages/dashboard.html',
    type: 'vanilla',
  },
  {
    folder: 'agendamentos',
    moduleSlug: 'allin_agendamentos_pro',
    brandName: 'Olivelas - Clínicas & Agendamentos',
    port: 4102,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'app_condominio',
    moduleSlug: 'allin_condominio',
    brandName: 'Olivelas - Gestão de Condomínios',
    port: 4103,
    adminPath: '/',
    type: 'spa',
  },
  {
    folder: 'art_hub',
    moduleSlug: 'allin_art_hub',
    brandName: 'Olivelas - Art Hub & Catálogo IA',
    port: 4104,
    adminPath: '/admin',
    type: 'nitro',
  },
  {
    folder: 'casa_organizada',
    moduleSlug: 'allin_casa_organizada',
    brandName: 'Olivelas - Casa Organizada & Rotinas',
    port: 4105,
    adminPath: '/',
    type: 'spa',
  },
  {
    folder: 'contratos',
    moduleSlug: 'allin_contratos',
    brandName: 'Olivelas - Automação de Contratos',
    port: 4106,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'especificacoes',
    moduleSlug: 'allin_especificacoes',
    brandName: 'Olivelas - Engenharia de Especificações',
    port: 4107,
    adminPath: '/projects',
    type: 'nitro',
  },
  {
    folder: 'gestao_estoque',
    moduleSlug: 'allin_gestao_estoque',
    brandName: 'Olivelas - Gestão de Estoque & PDV',
    port: 4108,
    adminPath: '/dashboard',
    type: 'spa',
  },
  {
    folder: 'ordem_de_servico',
    moduleSlug: 'allin_ordem_servico',
    brandName: 'Olivelas - Ordens de Serviço & Assistência',
    port: 4109,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'personal_treiner',
    moduleSlug: 'allin_personal_trainer',
    brandName: 'Olivelas - Personal Trainer',
    port: 4110,
    adminPath: '/personal/dashboard',
    type: 'spa',
  },
  {
    folder: 'restaurante',
    moduleSlug: 'allin_restaurante',
    brandName: 'Olivelas - Gestão de Restaurantes & KDS',
    port: 4111,
    adminPath: '/app',
    type: 'spa',
  },
  {
    folder: 'rifas',
    moduleSlug: 'allin_rifas',
    brandName: 'Olivelas - Rifas & Sorteios Digitais',
    port: 4112,
    adminPath: '/admin/dashboard',
    type: 'nitro',
  },
  {
    folder: 'sistema_delivery',
    moduleSlug: 'allin_delivery',
    brandName: 'Olivelas - Central de Delivery',
    port: 4113,
    adminPath: '/app/orders',
    type: 'spa',
  },
  {
    folder: 'sistema_mercado',
    moduleSlug: 'allin_mercado',
    brandName: 'Olivelas - Supermercado & Cestas',
    port: 4114,
    adminPath: '/admin/dashboard',
    type: 'spa',
  },
  {
    folder: 'suite_rifa',
    moduleSlug: 'allin_suite_rifa',
    brandName: 'Olivelas - Suíte Multi-Organização de Rifas',
    port: 4115,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'vitrine_digital',
    moduleSlug: 'allin_vitrine_digital',
    brandName: 'Olivelas - Vitrine Digital & Analisador IA',
    port: 4116,
    adminPath: '/?view=analyzer',
    type: 'nitro',
  },
  // 21 Novos Projetos do Ecossistema (4117–4137)
  {
    folder: 'album_figurinhas',
    moduleSlug: 'allin_album_figurinhas',
    brandName: 'Olivelas - Álbum de Figurinhas Digital',
    port: 4117,
    adminPath: '/admin',
    type: 'nitro',
  },
  {
    folder: 'artes_caneca',
    moduleSlug: 'allin_artes_caneca',
    brandName: 'Olivelas - Estúdio de Artes & Canecas',
    port: 4118,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'casa_organizada_ai',
    moduleSlug: 'allin_casa_organizada_ai',
    brandName: 'Olivelas - Casa Organizada AI & Automação',
    port: 4119,
    adminPath: '/app',
    type: 'nitro',
  },
  {
    folder: 'cesta_cafe_manha',
    moduleSlug: 'allin_cesta_cafe_manha',
    brandName: 'Olivelas - Cestas de Café & Presentes',
    port: 4120,
    adminPath: '/painel',
    type: 'nitro',
  },
  {
    folder: 'collection_vault',
    moduleSlug: 'allin_collection_vault',
    brandName: 'Olivelas - Collection Vault & Acervos',
    port: 4121,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'dashboard_bi',
    moduleSlug: 'allin_dashboard_bi',
    brandName: 'Olivelas - Dashboard BI & Analytics',
    port: 4122,
    adminPath: '/dashboards',
    type: 'nitro',
  },
  {
    folder: 'forms',
    moduleSlug: 'allin_forms',
    brandName: 'Olivelas - IAM Forms & Pesquisas',
    port: 4123,
    adminPath: '/app',
    type: 'spa',
  },
  {
    folder: 'forms_pro',
    moduleSlug: 'allin_forms_pro',
    brandName: 'Olivelas - Forms Pro Enterprise',
    port: 4124,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'gerenciador_tunnel_apps',
    moduleSlug: 'allin_gerenciador_tunnel_apps',
    brandName: 'Olivelas - Gerenciador de Túneis & Apps',
    port: 4125,
    adminPath: '/',
    type: 'spa',
  },
  {
    folder: 'iam_suite',
    moduleSlug: 'allin_iam_suite',
    brandName: 'Olivelas - IAM Suite & Governança',
    port: 4126,
    adminPath: '/dashboard',
    type: 'nitro',
  },
  {
    folder: 'inventario_jogos',
    moduleSlug: 'allin_inventario_jogos',
    brandName: 'Olivelas - Inventário de Jogos & Mídias',
    port: 4127,
    adminPath: '/app',
    type: 'spa',
  },
  {
    folder: 'link_promo',
    moduleSlug: 'allin_link_promo',
    brandName: 'Olivelas - Link Promo & Afiliados',
    port: 4128,
    adminPath: '/app',
    type: 'spa',
  },
  {
    folder: 'loja_simples_hortifruti',
    moduleSlug: 'allin_loja_simples_hortifruti',
    brandName: 'Olivelas - Hortifruti & Feira Fresca',
    port: 4129,
    adminPath: '/admin/index.html',
    type: 'vanilla',
    isStaticPage: true,
  },
  {
    folder: 'loja_simples_vendas',
    moduleSlug: 'allin_loja_simples_vendas',
    brandName: 'Olivelas - Loja Simples de Vendas',
    port: 4130,
    adminPath: '/index.html',
    type: 'vanilla',
    isStaticPage: true,
  },
  {
    folder: 'qrcode_maker',
    moduleSlug: 'allin_qrcode_maker',
    brandName: 'Olivelas - Estúdio QR Code & PIX',
    port: 4131,
    adminPath: '/',
    type: 'spa',
    isStaticPage: true,
  },
  {
    folder: 'site_simpes_vendas_velas',
    moduleSlug: 'allin_site_simpes_vendas_velas',
    brandName: 'Olivelas - Boutique de Velas Artesanais',
    port: 4132,
    adminPath: '/index.html',
    type: 'vanilla',
    isStaticPage: true,
  },
  {
    folder: 'site_simples_personal_trainer',
    moduleSlug: 'allin_site_simples_personal_trainer',
    brandName: 'Olivelas - Landing Personal Trainer',
    port: 4133,
    adminPath: '/index.html',
    type: 'vanilla',
    isStaticPage: true,
  },
  {
    folder: 'site_simples_produtos_naturais',
    moduleSlug: 'allin_site_simples_produtos_naturais',
    brandName: 'Olivelas - Empório Produtos Naturais',
    port: 4134,
    adminPath: '/index.html',
    type: 'vanilla',
    isStaticPage: true,
  },
  {
    folder: 'site_simples_ti',
    moduleSlug: 'allin_site_simples_ti',
    brandName: 'Olivelas - Consultoria & Soluções de TI',
    port: 4135,
    adminPath: '/index.html',
    type: 'vanilla',
    isStaticPage: true,
  },
  {
    folder: 'sync_google_drive',
    moduleSlug: 'allin_sync_google_drive',
    brandName: 'Olivelas - Sync Google Drive & Backup',
    port: 4136,
    adminPath: '/',
    type: 'spa',
  },
  {
    folder: 'visualizador_dashboad_ai',
    moduleSlug: 'allin_visualizador_dashboad_ai',
    brandName: 'Olivelas - Visualizador Dashboard AI',
    port: 4137,
    adminPath: '/',
    type: 'spa',
  },
];

const children = [];

console.log('🚀 Iniciando Orquestrador de Instâncias Olivelas All In (37 módulos nas portas 4101–4137)...');

for (const mod of MODULE_SERVERS) {
  const payload = JSON.stringify({
    ...mod,
    projectDir: path.join(PROJETOS_DIR, mod.folder),
  });

  const child = spawn(process.execPath, [SINGLE_SERVER_SCRIPT, payload], {
    cwd: path.join(PROJETOS_DIR, mod.folder),
    stdio: 'inherit',
  });

  children.push(child);
}

function shutdown() {
  for (const child of children) {
    try {
      child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
