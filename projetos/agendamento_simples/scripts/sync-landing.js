/**
 * SYNC & COMPILE LANDING PAGE SCRIPT
 * Recompila os dados dinâmicos de Serviços, Planos e Horários diretamente no HTML de index.html, servicos.html e contato.html
 * Execução: node scripts/sync-landing.js
 */

const fs = require('fs');
const path = require('path');

// 1. Ler .env se existir
const envPath = path.join(__dirname, '..', '.env');
const env = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
  });
}

const SUPABASE_URL = process.env.SUPABASE_URL || env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || env.SUPABASE_SECRET_KEY;

// 2. Carregar dados de fallback de mock-data.js
const mockFilePath = path.join(__dirname, '..', 'js', 'mock-data.js');
const mockCode = fs.readFileSync(mockFilePath, 'utf8');
const sandbox = {};
const fn = new Function('sandbox', `${mockCode}; sandbox.initialMockData = initialMockData;`);
fn(sandbox);
const mockData = sandbox.initialMockData;

async function fetchSupabaseTable(tableName) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
      headers: {
        'apikey': SUPABASE_SECRET_KEY,
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    // Silently continue to fallback
  }
  return null;
}

function resolveMeta(service, isPageSubdir = false) {
  const text = ((service.name || '') + ' ' + (service.category || '')).toLowerCase();
  const assets = isPageSubdir ? '../assets/' : 'assets/';
  const base = isPageSubdir ? '' : 'pages/';

  if (text.includes('aparelho') || text.includes('ortod')) {
    return { icon: `${assets}icons/icone-aparelho-ortodontico.png`, link: `${base}aparelho-ortodontico.html`, btn: 'Conhecer tratamento →' };
  }
  if (text.includes('limpeza') || text.includes('profilaxia')) {
    return { icon: `${assets}icons/icone-limpeza.png`, link: `${base}limpeza.html`, btn: 'Conhecer tratamento →' };
  }
  if (text.includes('implante')) {
    return { icon: `${assets}icons/icone-implantes.png`, link: `${base}implantes.html`, btn: 'Conhecer tratamento →' };
  }
  if (text.includes('geral') || text.includes('restaura') || text.includes('avalia')) {
    return { icon: `${assets}icons/icone-clinica-geral.png`, link: `${base}clinica-geral.html`, btn: 'Conhecer tratamento →' };
  }
  return { icon: `${assets}icons/icone-clinica-geral.png`, link: `${base}agendar.html?service=${encodeURIComponent(service.name)}`, btn: 'Agendar consulta →' };
}

function buildTreatmentsHtml(services, isPageSubdir = false) {
  return services.filter(s => s.status !== 'inactive' && s.active !== false).map(s => {
    const meta = resolveMeta(s, isPageSubdir);
    const durationBadge = s.duration ? `\n            <span class="badge badge-neutral" style="margin-bottom: var(--space-2);">${s.duration}</span>` : '';
    return `          <article class="treatment-card">
            <div class="treatment-icon">
              <img src="${meta.icon}" alt="Ícone ${s.name}" class="treatment-icon-img">
            </div>${durationBadge}
            <h3 class="treatment-title">${s.name}</h3>
            <p class="treatment-text">
              ${s.description || 'Cuidados odontológicos individualizados com o padrão Dra. Marta Gelsi Dias.'}
            </p>
            <a href="${meta.link}" class="btn btn-outline btn-sm">
              ${meta.btn}
            </a>
          </article>`;
  }).join('\n\n');
}

function buildPlansHtml(plans, isPageSubdir = false) {
  const base = isPageSubdir ? '' : 'pages/';
  return plans.filter(p => p.status !== 'inactive' && p.active !== false).map(p => {
    const isHighlight = !!p.highlight;
    const features = Array.isArray(p.features) ? p.features : (Array.isArray(p.services) ? p.services : (p.features || p.services || '').split(',').map(x => x.trim()).filter(Boolean));
    const featuresHtml = features.length > 0 ? `\n            <div style="margin-bottom: var(--space-4); margin-top: var(--space-3); display: flex; flex-wrap: wrap; gap: 4px;">\n              ${features.map(f => `<span class="badge badge-neutral" style="font-size: 0.7rem;">✓ ${f}</span>`).join('\n              ')}\n            </div>` : '';
    
    return `          <div class="plan-card" style="${isHighlight ? 'border-color: var(--color-primary); box-shadow: var(--shadow-md); position: relative;' : 'position: relative;'}">
            ${isHighlight ? `<div style="position: absolute; top: 14px; right: 14px;">\n              <span class="badge badge-success">Mais Procurado</span>\n            </div>\n            ` : ''}<h3 class="treatment-title" style="margin-right: ${isHighlight ? '90px' : '0'};">${p.name}</h3>
            <span class="plan-price-label">Valor</span>
            <div class="plan-price-value">${p.price || 'Consultar'}</div>
            <p class="treatment-text">${p.description || 'Planejamento e acompanhamento com foco no seu bem-estar bucal.'}</p>${featuresHtml}
            <a href="${base}agendar.html?plan=${encodeURIComponent(p.name)}" class="btn ${isHighlight ? 'btn-primary' : 'btn-outline'} btn-sm">
              Agendar ${p.name.toLowerCase().includes('limpeza') ? 'limpeza' : (p.name.toLowerCase().includes('avaliação') ? 'avaliação' : 'plano')}
            </a>
          </div>`;
  }).join('\n\n');
}

function formatSchedulesLines(schedules) {
  if (Array.isArray(schedules)) {
    const weekdays = schedules.filter(s => ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira'].includes(s.day));
    const allWeekdaysSame = weekdays.length > 0 && weekdays.every(s => s.active && s.startTime === weekdays[0].startTime && s.endTime === weekdays[0].endTime);
    const saturday = schedules.find(s => s.day === 'Sábado');
    const sunday = schedules.find(s => s.day === 'Domingo');

    const lines = [];
    if (allWeekdaysSame) {
      lines.push({ label: 'Segunda a Sexta', hours: `${weekdays[0].startTime} às ${weekdays[0].endTime}` });
    } else {
      weekdays.forEach(s => {
        lines.push({ label: s.day.replace('-feira', ''), hours: s.active ? `${s.startTime} às ${s.endTime}` : 'Fechado' });
      });
    }
    if (saturday) lines.push({ label: 'Sábado', hours: saturday.active ? `${saturday.startTime} às ${saturday.endTime}` : 'Fechado' });
    if (sunday) lines.push({ label: 'Domingo', hours: sunday.active ? `${sunday.startTime} às ${sunday.endTime}` : 'Fechado' });
    return lines;
  }
  return [
    { label: 'Segunda a Sexta', hours: '08:00 às 18:00' },
    { label: 'Sábado', hours: '08:00 às 12:00' },
    { label: 'Domingo', hours: 'Fechado' }
  ];
}

async function runSync() {
  console.log('--- RECOMPILANDO LANDING PAGE COM DADOS ATUALIZADOS ---');

  // Obter serviços (do Supabase ou Fallback)
  let services = await fetchSupabaseTable('services');
  if (!services) {
    console.log('ℹ️ Usando serviços locais de fallback.');
    services = mockData.services;
  } else {
    console.log(`✅ ${services.length} serviços obtidos do Supabase.`);
  }

  // Obter planos
  let plans = await fetchSupabaseTable('plans');
  if (!plans) {
    console.log('ℹ️ Usando planos locais de fallback.');
    plans = mockData.plans;
  } else {
    console.log(`✅ ${plans.length} planos obtidos do Supabase.`);
  }

  // Obter horários
  let settings = await fetchSupabaseTable('clinic_settings');
  let rawSchedules = mockData.schedules;
  if (settings && settings[0] && settings[0].business_hours) {
    rawSchedules = settings[0].business_hours;
    console.log('✅ Horários obtidos do Supabase.');
  }

  const hoursLines = formatSchedulesLines(rawSchedules);

  // 1. Atualizar index.html
  const indexPath = path.join(__dirname, '..', 'index.html');
  if (fs.existsSync(indexPath)) {
    let indexHtml = fs.readFileSync(indexPath, 'utf8');

    // Substituir tratamentos
    const treatmentsHtml = buildTreatmentsHtml(services, false);
    const treatmentsRegex = /(<div class="treatments-grid"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;
    if (treatmentsRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(treatmentsRegex, `$1\n${treatmentsHtml}\n        $3`);
    }

    // Substituir planos
    const plansHtml = buildPlansHtml(plans, false);
    const plansRegex = /(<div class="plans-grid"[^>]*id="landing-plans-container"[^>]*>)([\s\S]*?)(<\/div>\s*<\/div>\s*<\/section>)/;
    if (plansRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(plansRegex, `$1\n${plansHtml}\n        $3`);
    }

    // Substituir horários no footer usando marcador
    const hoursFooterHtml = hoursLines.map(line => `            <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px;"><strong style="color: #ffffff;">${line.label}:</strong> <span>${line.hours}</span></div>`).join('\n');
    const hoursRegex = /(<!-- LANDING_HOURS -->)[\s\S]*?(<!-- \/LANDING_HOURS -->)/;
    if (hoursRegex.test(indexHtml)) {
      indexHtml = indexHtml.replace(hoursRegex, `$1\n${hoursFooterHtml}\n            $2`);
    }

    fs.writeFileSync(indexPath, indexHtml, 'utf8');
    console.log('✅ index.html reescrito e sincronizado com sucesso.');
  }

  // 2. Atualizar pages/servicos.html
  const servicosPath = path.join(__dirname, '..', 'pages', 'servicos.html');
  if (fs.existsSync(servicosPath)) {
    let servicosHtml = fs.readFileSync(servicosPath, 'utf8');
    const pageTreatmentsHtml = buildTreatmentsHtml(services, true);
    const srvRegex = /(<div class="treatments-grid"[^>]*>)([\s\S]*?)(<\/div>\s*<div style="margin-top:)/;
    if (srvRegex.test(servicosHtml)) {
      servicosHtml = servicosHtml.replace(srvRegex, `$1\n${pageTreatmentsHtml}\n      $3`);
      fs.writeFileSync(servicosPath, servicosHtml, 'utf8');
      console.log('✅ pages/servicos.html sincronizado com sucesso.');
    }
  }

  // 3. Atualizar pages/contato.html
  const contatoPath = path.join(__dirname, '..', 'pages', 'contato.html');
  if (fs.existsSync(contatoPath)) {
    let contatoHtml = fs.readFileSync(contatoPath, 'utf8');
    const contactHoursHtml = hoursLines.map(line => `<div><strong>${line.label}:</strong> ${line.hours}</div>`).join('');
    const contRegex = /(<!-- CONTACT_HOURS -->)[\s\S]*?(<!-- \/CONTACT_HOURS -->)/;
    if (contRegex.test(contatoHtml)) {
      contatoHtml = contatoHtml.replace(contRegex, `$1${contactHoursHtml}$2`);
      fs.writeFileSync(contatoPath, contatoHtml, 'utf8');
      console.log('✅ pages/contato.html sincronizado com sucesso.');
    }
  }

  console.log('✨ Sincronização e recompilação concluídas com sucesso!');
}

runSync();
