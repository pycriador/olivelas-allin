/**
 * CALENDAR LOGIC - VANILLA JAVASCRIPT
 * Suporta visualizações de Mês, Semana e Dia com integração ao Supabase e exclusão no banco
 */

class CalendarApp {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    
    // Suporte a parâmetros de URL (?date=YYYY-MM-DD&view=day|week|month)
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get("date");
    const viewParam = urlParams.get("view");

    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const [y, m, d] = dateParam.split("-").map(Number);
      this.currentDate = new Date(y, m - 1, d);
      this.currentView = viewParam || "day";
    } else {
      this.currentDate = new Date(2026, 8, 21); // Setembro de 2026
      this.currentView = viewParam || "month";
    }
    
    this.appointments = [];
  }

  async init() {
    await this.loadAppointments();
    this.render();
  }

  async loadAppointments() {
    if (window.DatabaseService) {
      this.appointments = await DatabaseService.appointments.getAll();
    } else {
      this.appointments = StorageService.get("appointments", []);
    }
  }

  setView(view) {
    this.currentView = view;
    this.render();
  }

  next() {
    if (this.currentView === "month") {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    } else if (this.currentView === "week") {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() + 1);
    }
    this.render();
  }

  prev() {
    if (this.currentView === "month") {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    } else if (this.currentView === "week") {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setDate(this.currentDate.getDate() - 1);
    }
    this.render();
  }

  today() {
    this.currentDate = new Date(2026, 8, 21);
    this.render();
  }

  getEventClass(serviceName = "") {
    const s = serviceName.toLowerCase();
    if (s.includes("limpeza")) return "event-limpeza";
    if (s.includes("aparelho") || s.includes("ortodôntico")) return "event-aparelho";
    if (s.includes("implante")) return "event-implante";
    if (s.includes("retorno")) return "event-retorno";
    return "event-consulta";
  }

  async render() {
    if (!this.container) return;
    await this.loadAppointments();

    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const month = monthNames[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();
    const day = this.currentDate.getDate();

    let titleText = `${month} de ${year}`;
    if (this.currentView === "day") {
      titleText = `${day} de ${month} de ${year}`;
    }

    const curY = this.currentDate.getFullYear();
    const curM = String(this.currentDate.getMonth() + 1).padStart(2, "0");
    const curD = String(this.currentDate.getDate()).padStart(2, "0");
    const dateInputVal = `${curY}-${curM}-${curD}`;

    this.container.innerHTML = `
      <div class="calendar-container">
        <div class="calendar-header">
          <div class="calendar-nav">
            <button type="button" class="btn btn-outline btn-sm" id="cal-btn-prev">Anterior</button>
            <button type="button" class="btn btn-outline btn-sm" id="cal-btn-today">Hoje</button>
            <button type="button" class="btn btn-outline btn-sm" id="cal-btn-next">Próximo</button>
            <span class="calendar-title">${titleText}</span>
            <input type="date" class="form-input" id="cal-date-picker" value="${dateInputVal}" style="padding: 4px 8px; height: 32px; font-size: 0.8125rem; width: auto;" title="Pular para data específica">
          </div>

          <div class="calendar-view-toggle">
            <button type="button" class="calendar-view-btn ${this.currentView === 'month' ? 'active' : ''}" data-view="month">Mês</button>
            <button type="button" class="calendar-view-btn ${this.currentView === 'week' ? 'active' : ''}" data-view="week">Semana</button>
            <button type="button" class="calendar-view-btn ${this.currentView === 'day' ? 'active' : ''}" data-view="day">Dia</button>
          </div>
        </div>

        <div id="calendar-body-content"></div>
      </div>
    `;

    // Bind nav buttons
    this.container.querySelector("#cal-btn-prev").onclick = () => this.prev();
    this.container.querySelector("#cal-btn-next").onclick = () => this.next();
    this.container.querySelector("#cal-btn-today").onclick = () => this.today();

    const picker = this.container.querySelector("#cal-date-picker");
    if (picker) {
      picker.onchange = (e) => {
        if (e.target.value) {
          const [py, pm, pd] = e.target.value.split("-").map(Number);
          this.currentDate = new Date(py, pm - 1, pd);
          this.render();
        }
      };
    }

    this.container.querySelectorAll(".calendar-view-btn").forEach(btn => {
      btn.onclick = () => this.setView(btn.getAttribute("data-view"));
    });

    const bodyEl = this.container.querySelector("#calendar-body-content");
    if (this.currentView === "month") {
      this.renderMonthView(bodyEl);
    } else if (this.currentView === "week") {
      this.renderWeekView(bodyEl);
    } else {
      this.renderDayView(bodyEl);
    }
  }

  renderMonthView(container) {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0=Dom
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    let html = `
      <div class="calendar-month-grid">
        ${weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join("")}
    `;

    // Dias do mês anterior
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      html += `
        <div class="calendar-day-cell other-month">
          <span class="calendar-day-number">${dayNum}</span>
        </div>
      `;
    }

    // Dias do mês atual
    for (let d = 1; d <= totalDays; d++) {
      const isToday = (d === 21 && month === 8 && year === 2026);
      const dayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayApts = this.appointments.filter(a => a.date === dayStr);

      const eventsHtml = dayApts.map(a => `
        <div class="event-chip ${this.getEventClass(a.service)}" data-apt-id="${a.id}" title="${a.time} - ${a.patientName} (${a.service}) • Clique para ver ou excluir">
          <strong>${a.time}</strong> ${a.patientName}
        </div>
      `).join("");

      html += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="calendar-day-number cal-day-jump" data-jump-date="${dayStr}" title="Clique para ver o dia detalhado" style="cursor: pointer;">${d}</span>
            ${dayApts.length > 0 ? `<span class="badge cal-day-jump" data-jump-date="${dayStr}" style="font-size: 0.65rem; padding: 1px 5px; cursor: pointer;" title="Ver ${dayApts.length} consultas deste dia">${dayApts.length}</span>` : ''}
          </div>
          <div class="calendar-events-list">
            ${eventsHtml}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
    this.bindEventClicks(container);
  }

  renderWeekView(container) {
    const weekdays = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    let html = `
      <div class="calendar-month-grid" style="grid-template-columns: repeat(7, 1fr);">
        ${weekdays.map(d => `<div class="calendar-weekday">${d}</div>`).join("")}
    `;

    // Início da semana (Segunda-feira)
    const curr = new Date(this.currentDate);
    const dayOfWeek = curr.getDay(); // 0 = Dom, 1 = Seg, ...
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${dayNum}`;
      const dayApts = this.appointments.filter(a => a.date === dateStr);
      const isToday = (d.getFullYear() === 2026 && d.getMonth() === 8 && d.getDate() === 21);

      const eventsHtml = dayApts.map(a => `
        <div class="event-chip ${this.getEventClass(a.service)}" data-apt-id="${a.id}" title="Clique para ver ou excluir">
          <strong>${a.time}</strong> ${a.patientName} — <span class="text-xs">${a.service}</span>
        </div>
      `).join("");

      html += `
        <div class="calendar-day-cell ${isToday ? 'today' : ''}" style="min-height: 240px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span class="calendar-day-number cal-day-jump" data-jump-date="${dateStr}" style="cursor: pointer; width: auto; padding: 2px 6px; border-radius: var(--radius-sm);" title="Ver detalhes deste dia">
              ${d.getDate()} ${d.toLocaleDateString('pt-BR', { month: 'short' })}
            </span>
            ${dayApts.length > 0 ? `<span class="badge badge-info cal-day-jump" data-jump-date="${dateStr}" style="cursor: pointer; font-size: 0.6875rem;">${dayApts.length}</span>` : ''}
          </div>
          <div class="calendar-events-list">
            ${eventsHtml || '<span class="text-xs text-muted" style="opacity: 0.6;">Sem consultas</span>'}
          </div>
        </div>
      `;
    }

    html += `</div>`;
    container.innerHTML = html;
    this.bindEventClicks(container);
  }

  renderDayView(container) {
    const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];
    const year = this.currentDate.getFullYear();
    const month = String(this.currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(this.currentDate.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    const dayApts = this.appointments.filter(a => a.date === dateStr);

    const formattedDate = this.currentDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-6); background: #ffffff; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <span class="text-xs text-muted" style="text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Visualização do Dia</span>
          <h2 style="font-size: var(--font-size-lg); color: var(--color-burgundy); margin: 2px 0 0 0; text-transform: capitalize;">
            ${formattedDate}
          </h2>
        </div>
        <div class="flex items-center gap-3">
          <span class="badge ${dayApts.length > 0 ? 'badge-info' : 'badge-secondary'}" style="font-size: 0.8125rem; padding: 4px 10px;">
            ${dayApts.length} ${dayApts.length === 1 ? 'consulta agendada' : 'consultas agendadas'}
          </span>
          <a href="agendamentos.html" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 4px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Novo Agendamento
          </a>
        </div>
      </div>

      <div class="calendar-time-schedule">
    `;

    hours.forEach(hour => {
      const hourApts = dayApts.filter(a => a.time.startsWith(hour.slice(0, 2)));

      const eventsHtml = hourApts.map(a => `
        <div class="day-appointment-card ${this.getEventClass(a.service)}" data-apt-id="${a.id}">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
            <div style="font-weight: 700; font-size: 1rem; color: var(--color-burgundy); min-width: 50px;">
              ${a.time}
            </div>
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1;">
              <strong style="color: var(--color-text-main); font-size: 0.9375rem;">${a.patientName}</strong>
              <span class="text-xs text-secondary" style="margin-left: 8px;">• ${a.service} (${a.duration || '30 min'})</span>
            </div>
            <div>
              ${UIComponents.renderStatusBadge(a.status)}
            </div>
          </div>
          <div class="flex items-center gap-2" style="flex-shrink: 0;">
            <button type="button" class="btn btn-ghost btn-sm cal-view-btn" data-view-apt-id="${a.id}" title="Ver prontuário e detalhes">
              Ver Detalhes
            </button>
            <button type="button" class="cal-delete-btn" data-delete-apt-id="${a.id}" title="Excluir agendamento do banco de dados">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Excluir
            </button>
          </div>
        </div>
      `).join("");

      html += `
        <div class="time-row">
          <div class="time-col-hour">${hour}</div>
          <div class="time-col-events">
            ${eventsHtml || '<span class="text-xs text-muted" style="opacity: 0.45; font-style: italic;">Horário livre</span>'}
          </div>
        </div>
      `;
    });

    html += `</div>`;
    container.innerHTML = html;
    this.bindEventClicks(container);
  }

  bindEventClicks(container) {
    // 1. Botões diretos de exclusão no dia (cal-delete-btn)
    container.querySelectorAll(".cal-delete-btn[data-delete-apt-id]").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-delete-apt-id");
        this.deleteAppointment(id);
      };
    });

    // 2. Botão "Ver Detalhes"
    container.querySelectorAll(".cal-view-btn[data-view-apt-id]").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-view-apt-id");
        this.openEventModal(id);
      };
    });

    // 3. Clique nos cards e chips de consulta
    container.querySelectorAll("[data-apt-id]").forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest(".cal-delete-btn") || e.target.closest(".cal-view-btn")) return;
        const id = el.getAttribute("data-apt-id");
        this.openEventModal(id);
      };
    });

    // 4. Clique nos números de dia para navegar diretamente para a visão diária
    container.querySelectorAll(".cal-day-jump[data-jump-date]").forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const dateStr = el.getAttribute("data-jump-date");
        if (dateStr) {
          const [y, m, d] = dateStr.split("-").map(Number);
          this.currentDate = new Date(y, m - 1, d);
          this.setView("day");
        }
      };
    });
  }

  openEventModal(aptId) {
    const apt = this.appointments.find(a => a.id === aptId);
    if (!apt) return;

    let modal = document.getElementById("calendar-event-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "calendar-event-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <span class="badge badge-info">${apt.id}</span>
            <h3 class="modal-title" style="margin-top: 4px;">Detalhes do Agendamento</h3>
          </div>
          <button type="button" class="btn btn-ghost btn-icon" data-modal-close aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-4);">
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase;">Paciente</span>
              <p class="text-bold">${apt.patientName}</p>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase;">Status</span>
              <div>${UIComponents.renderStatusBadge(apt.status)}</div>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase;">Procedimento</span>
              <p class="text-bold text-primary">${apt.service}</p>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase;">Profissional</span>
              <p class="text-bold">${apt.professional || "Dra. Marta Gelsi Dias"}</p>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase;">Data</span>
              <p class="text-bold">${Navigation.formatDate(apt.date)}</p>
            </div>
            <div>
              <span class="text-xs text-muted" style="text-transform: uppercase;">Horário & Duração</span>
              <p class="text-bold">${apt.time} (${apt.duration})</p>
            </div>
          </div>
          <div>
            <span class="text-xs text-muted" style="text-transform: uppercase;">Observações</span>
            <p class="text-secondary" style="margin-top: 2px;">${apt.notes || "Sem observações registradas."}</p>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; width: 100%; flex-wrap: wrap; gap: 8px;">
          <button type="button" class="btn btn-danger" id="modal-delete-apt-btn" style="display: inline-flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            Excluir do Banco
          </button>
          <div class="flex gap-2">
            <button type="button" class="btn btn-outline" data-modal-close>Fechar</button>
            <a href="whatsapp.html?phone=&name=${encodeURIComponent(apt.patientName)}" class="btn btn-whatsapp">Mensagem WhatsApp</a>
          </div>
        </div>
      </div>
    `;

    const deleteBtn = modal.querySelector("#modal-delete-apt-btn");
    if (deleteBtn) {
      deleteBtn.onclick = () => {
        this.deleteAppointment(apt.id);
      };
    }

    Modal.open(modal);
  }

  async deleteAppointment(aptId) {
    const apt = this.appointments.find(a => a.id === aptId);
    if (!apt) {
      Toast.error("Agendamento não encontrado.");
      return;
    }

    Modal.confirm({
      title: "Excluir Agendamento do Banco de Dados?",
      message: `Tem certeza que deseja excluir o agendamento de <strong>${apt.patientName}</strong> (${apt.service} no dia ${Navigation.formatDate(apt.date)} às ${apt.time})?<br><br><span class="text-xs text-danger">Esta ação apagará permanentemente o registro no banco de dados e liberará o horário na agenda.</span>`,
      confirmText: "Sim, excluir do banco",
      cancelText: "Cancelar",
      danger: true,
      onConfirm: async () => {
        try {
          if (window.DatabaseService) {
            await DatabaseService.appointments.delete(apt.id);
          } else {
            const list = StorageService.get("appointments", []);
            StorageService.set("appointments", list.filter(a => a.id !== apt.id));
            StorageService.logActivity("DELETE_APPOINTMENT", `Agendamento cancelado: ${apt.patientName}`, apt.id);
          }

          Toast.success(`Agendamento de ${apt.patientName} excluído com sucesso do banco!`);

          // Fecha modal de detalhes caso esteja aberto
          const detailsModal = document.getElementById("calendar-event-modal");
          if (detailsModal) {
            Modal.close(detailsModal);
          }

          // Recarrega do banco e renderiza novamente
          await this.render();
        } catch (err) {
          console.error("Erro ao excluir agendamento do banco:", err);
          Toast.error("Erro ao tentar excluir o agendamento.");
        }
      }
    });
  }
}
