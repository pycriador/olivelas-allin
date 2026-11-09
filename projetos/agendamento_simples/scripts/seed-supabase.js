/**
 * SEED SUPABASE SCRIPT
 * Popula os dados iniciais do consultório da Dra. Marta Gelsi Dias no Supabase
 * Execução: node scripts/seed-supabase.js
 */

const fs = require('fs');
const path = require('path');

// 1. Carregar variáveis de ambiente do .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error("ERRO: SUPABASE_URL e SUPABASE_SECRET_KEY devem estar definidos no arquivo .env");
  process.exit(1);
}

console.log('--- SEEDING SUPABASE DATABASE ---');
console.log('Target URL:', SUPABASE_URL);

// 2. Extrair initialMockData de js/mock-data.js
const mockFilePath = path.join(__dirname, '..', 'js', 'mock-data.js');
const mockCode = fs.readFileSync(mockFilePath, 'utf8');
const sandbox = {};
const fn = new Function('sandbox', `${mockCode}; sandbox.initialMockData = initialMockData;`);
fn(sandbox);
const mockData = sandbox.initialMockData;

async function postTable(tableName, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${tableName}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SECRET_KEY,
      'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(rows)
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Erro ao popular ${tableName} (status ${res.status}):`, err);
    return false;
  }
  console.log(`✅ ${tableName}: ${rows.length} registros sincronizados.`);
  return true;
}

async function runSeed() {
  try {
    // A. Pacientes
    const patients = (mockData.patients || []).map(p => ({
      id: p.id,
      name: p.name,
      cpf: p.cpf || null,
      phone: p.phone || null,
      email: p.email || null,
      address: p.address || {},
      status: p.status || 'active',
      notes: p.notes || null,
      last_appointment: p.lastAppointment || null
    }));
    await postTable('patients', patients);

    // B. Serviços
    const services = (mockData.services || []).map(s => ({
      id: s.id,
      name: s.name,
      category: s.category || null,
      duration: s.duration || null,
      price: s.price || 'Consultar',
      status: s.status || 'active',
      description: s.description || null
    }));
    await postTable('services', services);

    // C. Planos
    const plans = (mockData.plans || []).map(p => ({
      id: p.id,
      name: p.name,
      category: p.category || null,
      price: p.price || null,
      installments: p.installments || null,
      status: p.status || 'active',
      description: p.description || null,
      features: p.features || []
    }));
    await postTable('plans', plans);

    // D. Agendamentos
    const appointments = (mockData.appointments || []).map(a => ({
      id: a.id,
      date: a.date,
      time: a.time,
      duration: a.duration || '30 min',
      patient_id: a.patientId || null,
      patient_name: a.patientName,
      service: a.service,
      professional: a.professional || 'Dra. Marta Gelsi Dias',
      status: a.status || 'confirmed',
      origin: a.origin || 'Online',
      notes: a.notes || null,
      google_event_id: a.googleEventId || null
    }));
    await postTable('appointments', appointments);

    // E. Configurações da Clínica
    const s = mockData.settings || {};
    const settingsRow = [{
      id: 'main',
      clinic_name: s.clinicName || 'Dra. Marta Gelsi Dias — Odontologia',
      dentist_name: s.dentistName || 'Dra. Marta Gelsi Dias',
      cro: s.cro || 'CRO 71482',
      phone: s.phone || '(11) 99577-0004',
      whatsapp: s.whatsapp || '11995770004',
      email: s.email || 'contato@dramartagelsi.com.br',
      address: s.address || {},
      business_hours: s.businessHours || {}
    }];
    await postTable('clinic_settings', settingsRow);

    // F. Mensagens
    const messages = (mockData.messages || []).map(m => ({
      id: m.id,
      patient_id: m.patientId || null,
      patient_name: m.patientName || null,
      phone: m.phone || null,
      channel: m.channel || 'whatsapp',
      direction: m.direction || 'outbound',
      content: m.content || '',
      status: m.status || 'sent'
    }));
    await postTable('messages', messages);

    console.log('\n✨ Carga de dados concluída com sucesso no Supabase!');
  } catch (err) {
    console.error('Falha geral no seed:', err);
  }
}

runSeed();
