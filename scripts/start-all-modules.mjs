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
];

const children = [];

console.log('🚀 Iniciando Orquestrador de Instâncias Olivelas All In (16 módulos nas portas 4101–4116)...');

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
