/**
 * LANDING SYNC SERVICE - DRA. MARTA GELSI DIAS
 * Sincroniza dinamicamente os Serviços, Planos e Horários do Supabase na Landing Page e páginas públicas.
 */

const LandingSync = {
  // Determina prefixo de caminhos baseado na localização do arquivo
  get basePath() {
    return window.location.pathname.includes('/pages/') ? '' : 'pages/';
  },

  get assetsPath() {
    return window.location.pathname.includes('/pages/') ? '../assets/' : 'assets/';
  },

  /**
   * Determina o ícone e link de tratamento com base no nome e categoria do serviço
   */
  resolveTreatmentMeta(service) {
    const text = ((service.name || '') + ' ' + (service.category || '')).toLowerCase();
    const assets = LandingSync.assetsPath;
    const base = LandingSync.basePath;

    if (text.includes('aparelho') || text.includes('ortod')) {
      return {
        icon: `${assets}icons/icone-aparelho-ortodontico.png`,
        link: `${base}aparelho-ortodontico.html`,
        buttonText: 'Conhecer tratamento →'
      };
    }
    if (text.includes('limpeza') || text.includes('profilaxia')) {
      return {
        icon: `${assets}icons/icone-limpeza.png`,
        link: `${base}limpeza.html`,
        buttonText: 'Conhecer tratamento →'
      };
    }
    if (text.includes('implante')) {
      return {
        icon: `${assets}icons/icone-implantes.png`,
        link: `${base}implantes.html`,
        buttonText: 'Conhecer tratamento →'
      };
    }
    if (text.includes('geral') || text.includes('restaura') || text.includes('avalia')) {
      return {
        icon: `${assets}icons/icone-clinica-geral.png`,
        link: `${base}clinica-geral.html`,
        buttonText: 'Conhecer tratamento →'
      };
    }

    // Outros serviços cadastrados pelo administrador
    return {
      icon: `${assets}icons/icone-clinica-geral.png`,
      link: `${base}agendar.html?service=${encodeURIComponent(service.name)}`,
      buttonText: 'Agendar consulta →'
    };
  },

  /**
   * Sincroniza e renderiza os Tratamentos/Serviços
   */
  async syncTreatments() {
    const container = document.getElementById('landing-treatments-container') || document.querySelector('.treatments-grid');
    if (!container) return;

    try {
      if (typeof DatabaseService === 'undefined') return;
      const allServices = await DatabaseService.services.getAll();
      const activeServices = allServices.filter(s => s.status !== 'inactive' && s.active !== false);

      if (!activeServices || activeServices.length === 0) return;

      container.innerHTML = activeServices.map(s => {
        const meta = LandingSync.resolveTreatmentMeta(s);
        const durationBadge = s.duration ? `<span class="badge badge-neutral" style="margin-bottom: var(--space-2);">${s.duration}</span>` : '';
        return `
          <article class="treatment-card">
            <div class="treatment-icon">
              <img src="${meta.icon}" alt="Ícone ${s.name}" class="treatment-icon-img">
            </div>
            ${durationBadge}
            <h3 class="treatment-title">${s.name}</h3>
            <p class="treatment-text">
              ${s.description || 'Atendimento odontológico individualizado com o padrão de cuidado da Dra. Marta Gelsi Dias.'}
            </p>
            <a href="${meta.link}" class="btn btn-outline btn-sm">
              ${meta.buttonText}
            </a>
          </article>
        `;
      }).join('');
    } catch (err) {
      console.warn('[LandingSync] Erro ao carregar serviços dinâmicos:', err);
    }
  },

  /**
   * Sincroniza e renderiza os Planos & Avaliações
   */
  async syncPlans() {
    const container = document.getElementById('landing-plans-container');
    if (!container) return;

    try {
      if (typeof DatabaseService === 'undefined') return;
      const allPlans = await DatabaseService.plans.getAll();
      const activePlans = allPlans.filter(p => p.status !== 'inactive' && p.active !== false);

      if (!activePlans || activePlans.length === 0) return;

      const base = LandingSync.basePath;

      container.innerHTML = activePlans.map(p => {
        const isHighlight = !!p.highlight;
        const features = Array.isArray(p.features) ? p.features : (Array.isArray(p.services) ? p.services : (p.features || p.services || '').split(',').map(x => x.trim()).filter(Boolean));
        const featuresHtml = features.length > 0 ? `
          <div style="margin-bottom: var(--space-4); margin-top: var(--space-3); display: flex; flex-wrap: wrap; gap: 4px;">
            ${features.map(f => `<span class="badge badge-neutral" style="font-size: 0.7rem;">✓ ${f}</span>`).join('')}
          </div>
        ` : '';

        return `
          <div class="plan-card" style="${isHighlight ? 'border-color: var(--color-primary); box-shadow: var(--shadow-md); position: relative;' : 'position: relative;'}">
            ${isHighlight ? `
              <div style="position: absolute; top: 14px; right: 14px;">
                <span class="badge badge-success">Mais Procurado</span>
              </div>
            ` : ''}
            <h3 class="treatment-title" style="margin-right: ${isHighlight ? '90px' : '0'};">${p.name}</h3>
            <span class="plan-price-label">Valor</span>
            <div class="plan-price-value">${p.price || 'Consultar'}</div>
            <p class="treatment-text">${p.description || 'Planejamento e acompanhamento com foco no seu bem-estar bucal.'}</p>
            ${featuresHtml}
            <a href="${base}agendar.html?plan=${encodeURIComponent(p.name)}" class="btn ${isHighlight ? 'btn-primary' : 'btn-outline'} btn-sm">
              Agendar ${p.name.toLowerCase().includes('limpeza') ? 'limpeza' : (p.name.toLowerCase().includes('avaliação') ? 'avaliação' : 'plano')}
            </a>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.warn('[LandingSync] Erro ao carregar planos dinâmicos:', err);
    }
  },

  /**
   * Formata os horários de funcionamento salvos no Supabase / StorageService
   */
  formatSchedules(schedules) {
    if (!schedules) {
      return [
        { label: 'Segunda a Sexta', hours: '08:00 às 18:00' },
        { label: 'Sábado', hours: '08:00 às 12:00' },
        { label: 'Domingo', hours: 'Fechado' }
      ];
    }

    if (Array.isArray(schedules)) {
      const activeDays = schedules.filter(s => s.active);
      if (activeDays.length === 0) {
        return [{ label: 'Atendimento', hours: 'Consulte disponibilidade via WhatsApp' }];
      }

      // Agrupa dias da semana com mesmo horário
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

      if (saturday) {
        lines.push({ label: 'Sábado', hours: saturday.active ? `${saturday.startTime} às ${saturday.endTime}` : 'Fechado' });
      }
      if (sunday) {
        lines.push({ label: 'Domingo', hours: sunday.active ? `${sunday.startTime} às ${sunday.endTime}` : 'Fechado' });
      }

      return lines;
    }

    // Se veio como objeto direto (ex: do schema SQL padrão)
    if (typeof schedules === 'object') {
      return [
        { label: 'Segunda a Sexta', hours: schedules.weekdays || '08:00 às 19:00' },
        { label: 'Sábado', hours: schedules.saturday || '08:00 às 13:00' },
        { label: 'Domingo', hours: schedules.sunday || 'Fechado' }
      ];
    }

    return [{ label: 'Segunda a Sexta', hours: '08:00 às 18:00' }];
  },

  /**
   * Sincroniza e renderiza os Horários de Atendimento no footer e na página de contato
   */
  async syncHours() {
    const landingHoursContainer = document.getElementById('landing-hours-container');
    const contactHoursContainer = document.getElementById('contact-hours-container');
    if (!landingHoursContainer && !contactHoursContainer) return;

    try {
      let rawHours = null;
      if (typeof DatabaseService !== 'undefined') {
        const settings = await DatabaseService.settings.get();
        if (settings && settings.business_hours) {
          rawHours = settings.business_hours;
        }
      }
      if (!rawHours && typeof StorageService !== 'undefined') {
        rawHours = StorageService.get('schedules', null);
      }
      if (!rawHours && typeof initialMockData !== 'undefined') {
        rawHours = initialMockData.schedules;
      }

      const formattedLines = LandingSync.formatSchedules(rawHours);

      // Renderiza no rodapé da Landing Page
      if (landingHoursContainer) {
        landingHoursContainer.innerHTML = formattedLines.map(line => `
          <div style="display: flex; justify-content: space-between; gap: 12px; margin-bottom: 4px;">
            <strong style="color: #ffffff;">${line.label}:</strong>
            <span>${line.hours}</span>
          </div>
        `).join('');
      }

      // Renderiza na página de Contato
      if (contactHoursContainer) {
        contactHoursContainer.innerHTML = formattedLines.map(line => `
          <div><strong>${line.label}:</strong> ${line.hours}</div>
        `).join('');
      }
    } catch (err) {
      console.warn('[LandingSync] Erro ao sincronizar horários:', err);
    }
  },

  /**
   * Inicialização unificada
   */
  async init() {
    await Promise.all([
      LandingSync.syncTreatments(),
      LandingSync.syncPlans(),
      LandingSync.syncHours()
    ]);
  }
};

// Executa ao carregar o DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LandingSync.init());
} else {
  LandingSync.init();
}

window.LandingSync = LandingSync;
