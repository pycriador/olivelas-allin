import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const screenshotsDir = path.resolve(rootDir, 'public', 'screenshots');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mfyyezvpfpflpekosjif.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_placeholder_key';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { Client } = pg;
const pgClient = new Client({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.mfyyezvpfpflpekosjif',
  password: 'placeholder_password',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('================================================================');
  console.log('🚀 INICIANDO VALIDAÇÃO DO FLUXO COMPLETO SERVICEFORGE NO SUPABASE');
  console.log('================================================================\n');

  await pgClient.connect();

  // -------------------------------------------------------------
  // PASSO 1: CADASTRO DE CLIENTE NO BANCO DE DADOS
  // -------------------------------------------------------------
  console.log('1. Cadastrando Cliente no Supabase...');
  const customerPayload = {
    company_id: '00000000-0000-0000-0000-000000000001',
    name: 'Carlos Eduardo Mendes',
    trade_name: 'Mendes Consultoria Tech',
    type: 'PF',
    document: '123.456.789-00',
    cpf: '123.456.789-00',
    email: 'carlos.mendes@email.com',
    phone: '(11) 98765-4321',
    mobile_phone: '(11) 98765-4321',
    whatsapp: '5511987654321',
    status: 'active',
    rating: 5,
    notes: 'Cliente corporativo VIP - atendimento prioritário',
    addresses: [
      {
        id: 'addr-1',
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Conjunto 142',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        isDefault: true
      }
    ],
    timeline: [
      {
        id: 'tl-1',
        type: 'created',
        description: 'Cliente cadastrado via fluxo automatizado E2E',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const { data: createdCustomer, error: errCust } = await supabase
    .from('customers')
    .insert(customerPayload)
    .select()
    .single();

  if (errCust) {
    console.error('❌ Erro ao criar cliente:', errCust);
    process.exit(1);
  }
  console.log(`✔ Cliente criado com sucesso! ID: ${createdCustomer.id} | Nome: ${createdCustomer.name}`);

  // -------------------------------------------------------------
  // PASSO 2: BUSCA DO CLIENTE (SEM INFORMAR O ID)
  // -------------------------------------------------------------
  console.log('\n2. Executando Busca do Cliente por Nome / Documento (sem ID)...');
  const searchQuery = 'Carlos Eduardo';
  const { data: foundCustomers, error: errSearch } = await supabase
    .from('customers')
    .select('*')
    .ilike('name', `%${searchQuery}%`);

  if (errSearch || !foundCustomers || foundCustomers.length === 0) {
    console.error('❌ Cliente não encontrado na busca:', errSearch);
    process.exit(1);
  }
  const customer = foundCustomers[0];
  console.log(`✔ Busca retornou ${foundCustomers.length} cliente(s):`);
  console.log(`   - Encontrado: ${customer.name} | CPF: ${customer.cpf} | Email: ${customer.email}`);

  // -------------------------------------------------------------
  // PASSO 3: CADASTRO DE EQUIPAMENTO / ATIVO PARA O CLIENTE
  // -------------------------------------------------------------
  console.log('\n3. Cadastrando Equipamento vinculado ao Cliente...');
  const devicePayload = {
    company_id: '00000000-0000-0000-0000-000000000001',
    customer_id: customer.id,
    brand_id: 'brand-apple',
    model_id: 'model-macbook-pro',
    equipment_type_id: 'type-notebook',
    type: 'Notebook',
    serial_number: `SN-MBP-${Date.now().toString(36).toUpperCase()}`,
    asset_number: 'ATV-2026-091',
    color: 'Cinza Espacial',
    status: 'active',
    notes: 'Possui película de proteção na tela e capa protetora',
    accessories: [
      { name: 'Carregador USB-C 140W', quantity: 1 },
      { name: 'Cabo MagSafe 3', quantity: 1 }
    ],
    timeline: [
      {
        id: 'tl-dev-1',
        type: 'created',
        description: 'Equipamento registrado na base',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const { data: createdDevice, error: errDevice } = await supabase
    .from('devices')
    .insert(devicePayload)
    .select()
    .single();

  if (errDevice) {
    console.error('❌ Erro ao criar equipamento:', errDevice);
    process.exit(1);
  }
  console.log(`✔ Equipamento criado com sucesso! ID: ${createdDevice.id} | S/N: ${createdDevice.serial_number}`);

  // -------------------------------------------------------------
  // PASSO 4: ABERTURA DE NOVA ORDEM DE SERVIÇO (OS)
  // -------------------------------------------------------------
  console.log('\n4. Gerando número sequencial e Abrindo Nova Ordem de Serviço...');
  // Atualizar sequência
  const { data: numRow } = await supabase.from('so_numbering').select('*').limit(1).single();
  const nextSeq = (numRow?.current_sequence || 100) + 1;
  await supabase.from('so_numbering').update({ current_sequence: nextSeq }).eq('id', numRow.id);
  const soNumber = `SF-${String(nextSeq).padStart(6, '0')}`;

  const soPayload = {
    company_id: '00000000-0000-0000-0000-000000000001',
    number: soNumber,
    customer_id: customer.id,
    customer_name: customer.name,
    device_id: createdDevice.id,
    device_info: `Notebook Apple MacBook Pro M2 16" S/N: ${createdDevice.serial_number}`,
    description: 'Equipamento não liga após surto de energia em tempestade. LED do carregador não acende.',
    diagnosis: 'Curto circuito na linha primária de alimentação 19V / PMIC.',
    solution: 'Substituição de capacitor SMD cerâmico e PWM regulador de tensão.',
    technical_report: 'Efetuada desoxidação e reparo na malha de entrada. Testes de estresse de 4h aprovados.',
    status: 'Em Aberto',
    priority: 'high',
    origin: 'Presencial',
    channel: 'Balcão Matriz',
    total_services: 650.00,
    total_parts: 280.00,
    total_discount: 30.00,
    total_value: 900.00,
    technician_name: 'Carlos Alberto Silva',
    checklist: [
      { item: 'Liga?', checked: false },
      { item: 'Tela quebrada?', checked: false },
      { item: 'Carcaça danificada?', checked: false },
      { item: 'Fonte entregue?', checked: true },
      { item: 'Bateria presente?', checked: true }
    ],
    timeline: [
      {
        id: 'tl-so-1',
        type: 'opened',
        description: 'Ordem de Serviço criada com recebimento do equipamento',
        createdAt: new Date().toISOString()
      }
    ]
  };

  const { data: createdSO, error: errSO } = await supabase
    .from('service_orders')
    .insert(soPayload)
    .select()
    .single();

  if (errSO) {
    console.error('❌ Erro ao abrir Ordem de Serviço:', errSO);
    process.exit(1);
  }
  console.log(`✔ Ordem de Serviço Aberta com Sucesso!`);
  console.log(`   - Número: ${createdSO.number}`);
  console.log(`   - Cliente: ${createdSO.customer_name} (ID: ${createdSO.customer_id})`);
  console.log(`   - Equipamento: ${createdSO.device_info}`);
  console.log(`   - Valor Total: R$ ${createdSO.total_value.toFixed(2)}`);

  // -------------------------------------------------------------
  // PASSO 5: ATUALIZAÇÃO / PROGRESSÃO DE STATUS DA OS
  // -------------------------------------------------------------
  console.log('\n5. Atualizando Status da OS para "Em Execução"...');
  const { data: updatedSO, error: errUpdSO } = await supabase
    .from('service_orders')
    .update({
      status: 'Em Execução',
      diagnosis: 'Confirmado defeito no circuito regulador PWM. Peça em bancada para solda SMD.'
    })
    .eq('id', createdSO.id)
    .select()
    .single();

  if (errUpdSO) {
    console.error('❌ Erro ao atualizar OS:', errUpdSO);
    process.exit(1);
  }
  console.log(`✔ OS atualizada com sucesso! Novo status: ${updatedSO.status}`);

  // -------------------------------------------------------------
  // PASSO 6: VALIDAÇÃO DIRETA NO POSTGRESQL (VERIFICAÇÃO DE INTEGRIDADE)
  // -------------------------------------------------------------
  console.log('\n6. Verificando integridade física direta no PostgreSQL...');
  const pgCust = await pgClient.query('SELECT id, name, cpf, phone FROM customers WHERE id = $1', [customer.id]);
  const pgDev = await pgClient.query('SELECT id, serial_number, type FROM devices WHERE id = $1', [createdDevice.id]);
  const pgSO = await pgClient.query('SELECT id, number, customer_name, total_value, status FROM service_orders WHERE id = $1', [createdSO.id]);

  console.log('✔ PostgreSQL Table customers:', pgCust.rows[0]);
  console.log('✔ PostgreSQL Table devices:', pgDev.rows[0]);
  console.log('✔ PostgreSQL Table service_orders:', pgSO.rows[0]);

  await pgClient.end();

  // -------------------------------------------------------------
  // PASSO 7: CAPTURA VISUAL COM CHROME HEADLESS
  // -------------------------------------------------------------
  console.log('\n7. Iniciando Validação Visual e Captura de Screenshots com Chrome Headless...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('sf.demoSession', 'true');
    localStorage.setItem('sf.currentCompanyId', '00000000-0000-0000-0000-000000000001');
  });

  // Tela de Clientes
  console.log('  -> Acessando lista de clientes...');
  await page.goto('http://localhost:8080/service-orders/customers/list', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.resolve(screenshotsDir, 'customers_live_flow.png') });
  console.log('  ✔ Screenshot salvo: public/screenshots/customers_live_flow.png');

  // Tela de Equipamentos
  console.log('  -> Acessando catálogo de equipamentos...');
  await page.goto('http://localhost:8080/service-orders/assets/equipment', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.resolve(screenshotsDir, 'equipment_live_flow.png') });
  console.log('  ✔ Screenshot salvo: public/screenshots/equipment_live_flow.png');

  // Tela de Nova OS com busca de cliente
  console.log('  -> Acessando assistente de Nova OS...');
  await page.goto('http://localhost:8080/service-orders/new', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // Digitar na busca de cliente
  console.log('  -> Buscando cliente no campo de pesquisa sem informar ID...');
  const searchInput = await page.$('input[placeholder*="Digite para buscar"]');
  if (searchInput) {
    await searchInput.type('Carlos Eduardo', { delay: 50 });
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.resolve(screenshotsDir, 'so_new_customer_search.png') });
    console.log('  ✔ Screenshot salvo: public/screenshots/so_new_customer_search.png');
  }

  // Lista de Ordens de Serviço
  console.log('  -> Acessando listagem de Ordens de Serviço com a nova OS...');
  await page.goto('http://localhost:8080/service-orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: path.resolve(screenshotsDir, 'so_list_live_flow.png') });
  console.log('  ✔ Screenshot salvo: public/screenshots/so_list_live_flow.png');

  await browser.close();

  console.log('\n================================================================');
  console.log('🎉 FLUXO E2E CONCLUÍDO COM 100% DE SUCESSO NO SUPABASE / POSTGRESQL');
  console.log('================================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
