/**
 * MOCK DATA - DRA. MARTA GELSI DIAS
 * Conjunto de dados demonstrativos iniciais
 */

const initialMockData = {
  // 1. Pacientes
  patients: [
    {
      id: "PAT-001",
      name: "Ana Souza",
      phone: "(11) 98765-4321",
      email: "ana.souza@exemplo.com",
      cpf: "123.456.789-01",
      address: {
        street: "Rua Demonstrativa",
        number: "100",
        complement: "Apto 42",
        neighborhood: "Centro",
        city: "São Paulo",
        state: "SP",
        zipCode: "01001-000"
      },
      status: "active",
      lastAppointment: "2026-09-14",
      notes: "Paciente em acompanhamento ortodôntico preventivo."
    },
    {
      id: "PAT-002",
      name: "Carlos Eduardo Santos",
      phone: "(11) 97654-3210",
      email: "carlos.santos@exemplo.com",
      cpf: "234.567.890-12",
      address: {
        street: "Avenida Exemplo",
        number: "550",
        complement: "",
        neighborhood: "Jardins",
        city: "São Paulo",
        state: "SP",
        zipCode: "01400-000"
      },
      status: "active",
      lastAppointment: "2026-09-02",
      notes: "Interesse em avaliação para implante dentário unitário."
    },
    {
      id: "PAT-003",
      name: "Beatriz Lima",
      phone: "(11) 96543-2109",
      email: "beatriz.lima@exemplo.com",
      cpf: "345.678.901-23",
      address: {
        street: "Alameda das Flores",
        number: "88",
        complement: "Bloco B",
        neighborhood: "Pinheiros",
        city: "São Paulo",
        state: "SP",
        zipCode: "05400-000"
      },
      status: "active",
      lastAppointment: "2026-08-28",
      notes: "Retorno semestral para profilaxia e limpeza."
    },
    {
      id: "PAT-004",
      name: "Rodrigo Mendes",
      phone: "(11) 95432-1098",
      email: "rodrigo.mendes@exemplo.com",
      cpf: "456.789.012-34",
      address: {
        street: "Rua das Palmeiras",
        number: "310",
        complement: "",
        neighborhood: "Moema",
        city: "São Paulo",
        state: "SP",
        zipCode: "04500-000"
      },
      status: "inactive",
      lastAppointment: "2026-06-15",
      notes: "Finalizou tratamento preliminar de cárie."
    },
    {
      id: "PAT-005",
      name: "Juliana Ferreira",
      phone: "(11) 94321-0987",
      email: "juliana.ferreira@exemplo.com",
      cpf: "567.890.123-45",
      address: {
        street: "Rua Bela Vista",
        number: "1020",
        complement: "Conjunto 12",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        zipCode: "01300-000"
      },
      status: "active",
      lastAppointment: "2026-09-19",
      notes: "Manutenção mensal de alinhador ortodôntico."
    }
  ],

  // 2. Agendamentos
  appointments: [
    {
      id: "APT-001",
      patientId: "PAT-001",
      patientName: "Ana Souza",
      service: "Limpeza Dental",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-21",
      time: "08:00",
      duration: "45 min",
      status: "Confirmado",
      origin: "WhatsApp",
      notes: "Paciente pontual, profilaxia de rotina.",
      googleEventId: "mock-google-event-001"
    },
    {
      id: "APT-002",
      patientId: "PAT-002",
      patientName: "Carlos Eduardo Santos",
      service: "Avaliação Odontológica",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-21",
      time: "09:00",
      duration: "30 min",
      status: "Pendente",
      origin: "Site",
      notes: "Primeira consulta, planejamento inicial.",
      googleEventId: "mock-google-event-002"
    },
    {
      id: "APT-003",
      patientId: "PAT-005",
      patientName: "Juliana Ferreira",
      service: "Manutenção de Aparelho",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-21",
      time: "10:30",
      duration: "30 min",
      status: "Confirmado",
      origin: "WhatsApp",
      notes: "Ajuste e troca de arcos.",
      googleEventId: "mock-google-event-003"
    },
    {
      id: "APT-004",
      patientId: "PAT-003",
      patientName: "Beatriz Lima",
      service: "Clínica Geral",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-21",
      time: "14:00",
      duration: "45 min",
      status: "Confirmado",
      origin: "Telefone",
      notes: "Revisão geral da arcada superior.",
      googleEventId: "mock-google-event-004"
    },
    {
      id: "APT-005",
      patientId: "PAT-004",
      patientName: "Rodrigo Mendes",
      service: "Retorno",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-22",
      time: "09:30",
      duration: "20 min",
      status: "Pendente",
      origin: "Administrativo",
      notes: "Aguardando confirmação por WhatsApp.",
      googleEventId: "mock-google-event-005"
    },
    {
      id: "APT-006",
      patientId: "PAT-002",
      patientName: "Carlos Eduardo Santos",
      service: "Implante Dentário",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-23",
      time: "11:00",
      duration: "90 min",
      status: "Confirmado",
      origin: "Administrativo",
      notes: "Consulta de planejamento e moldagem.",
      googleEventId: "mock-google-event-006"
    },
    {
      id: "APT-007",
      patientId: "PAT-001",
      patientName: "Ana Souza",
      service: "Aparelho Ortodôntico",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-24",
      time: "15:00",
      duration: "60 min",
      status: "Confirmado",
      origin: "Site",
      notes: "Colocação de brackets inferiores.",
      googleEventId: "mock-google-event-007"
    },
    {
      id: "APT-008",
      patientId: "PAT-003",
      patientName: "Beatriz Lima",
      service: "Limpeza Dental",
      professional: "Dra. Marta Gelsi Dias",
      date: "2026-09-25",
      time: "16:00",
      duration: "45 min",
      status: "Pendente",
      origin: "WhatsApp",
      notes: "Lembrete automático programado.",
      googleEventId: "mock-google-event-008"
    }
  ],

  // 3. Serviços Oferecidos
  services: [
    {
      id: "SRV-001",
      name: "Avaliação Odontológica",
      category: "Clínica Geral",
      description: "Avaliação inicial completa e planejamento personalizado do tratamento.",
      duration: "30 min",
      price: "Consultar",
      status: "active"
    },
    {
      id: "SRV-002",
      name: "Limpeza Dental",
      category: "Prevenção",
      description: "Prevenção, higiene profunda e acompanhamento da saúde dos dentes e gengivas.",
      duration: "45 min",
      price: "Consultar",
      status: "active"
    },
    {
      id: "SRV-003",
      name: "Aparelho Ortodôntico",
      category: "Ortodontia",
      description: "Tratamentos ortodônticos para alinhamento e correção da posição dos dentes.",
      duration: "60 min",
      price: "Consultar",
      status: "active"
    },
    {
      id: "SRV-004",
      name: "Manutenção de Aparelho",
      category: "Ortodontia",
      description: "Acompanhamento periódico, ajuste de tensão e troca de componentes ortodônticos.",
      duration: "30 min",
      price: "Consultar",
      status: "active"
    },
    {
      id: "SRV-005",
      name: "Implante Dentário",
      category: "Implantodontia",
      description: "Soluções seguras para reposição de dentes e recuperação da função e estética.",
      duration: "90 min",
      price: "Consultar",
      status: "active"
    },
    {
      id: "SRV-006",
      name: "Retorno",
      category: "Clínica Geral",
      description: "Consulta rápida de pós-procedimento e acompanhamento da evolução clínica.",
      duration: "20 min",
      price: "Consultar",
      status: "active"
    }
  ],

  // 4. Planos / Combos Demonstrativos
  plans: [
    {
      id: "PLN-001",
      name: "Avaliação Odontológica",
      description: "Avaliação inicial e planejamento do tratamento com radiografia e diagnóstico clínico.",
      services: ["Avaliação Odontológica", "Planejamento"],
      price: "Consultar",
      periodicity: "Única",
      highlight: false,
      active: true
    },
    {
      id: "PLN-002",
      name: "Limpeza Dental Preventiva",
      description: "Limpeza profilática semestral e avaliação periódica contínua da saúde bucal.",
      services: ["Limpeza Dental", "Aplicação de Flúor", "Avaliação"],
      price: "Consultar",
      periodicity: "Semestral",
      highlight: true,
      active: true
    },
    {
      id: "PLN-003",
      name: "Aparelho Ortodôntico",
      description: "Avaliação, documentação e acompanhamento ortodôntico com manutenções regulares.",
      services: ["Instalação", "Manutenção Mensal"],
      price: "Consultar",
      periodicity: "Mensal",
      highlight: false,
      active: true
    },
    {
      id: "PLN-004",
      name: "Implante Dentário",
      description: "Avaliação tomográfica e planejamento cirúrgico para implante seguro e estético.",
      services: ["Avaliação Cirúrgica", "Planejamento de Implante"],
      price: "Consultar",
      periodicity: "Por procedimento",
      highlight: false,
      active: true
    }
  ],

  // 5. Templates de Mensagens
  messages: [
    {
      id: "MSG-001",
      category: "Confirmação de consulta",
      title: "Confirmação de Agendamento",
      content: "Olá, {{nome}}! Sua consulta com a Dra. Marta Gelsi Dias está confirmada para {{data}} às {{hora}}. Local: Consultório Odontológico. Em caso de dúvidas ou necessidade de reagendamento, responda a esta mensagem.",
      active: true
    },
    {
      id: "MSG-002",
      category: "Lembrete",
      title: "Lembrete 24h antes",
      content: "Olá, {{nome}}! Lembramos que sua consulta com a Dra. Marta Gelsi Dias será amanhã, dia {{data}}, às {{hora}}. Por favor, chegue com 10 minutos de antecedência.",
      active: true
    },
    {
      id: "MSG-003",
      category: "Cancelamento",
      title: "Cancelamento de Agendamento",
      content: "Olá, {{nome}}. Seu agendamento para o dia {{data}} às {{hora}} foi cancelado com sucesso. Para escolher uma nova data, entre em contato conosco por este canal.",
      active: true
    },
    {
      id: "MSG-004",
      category: "Reagendamento",
      title: "Reagendamento de Consulta",
      content: "Olá, {{nome}}! Sua consulta foi reagendada para {{data}} às {{hora}} com a Dra. Marta Gelsi Dias. Esperamos você!",
      active: true
    },
    {
      id: "MSG-005",
      category: "Pós-consulta",
      title: "Acompanhamento Pós-Procedimento",
      content: "Olá, {{nome}}! Como você está se sentindo após o seu atendimento hoje com a Dra. Marta Gelsi Dias? Caso sinta qualquer desconforto ou tenha dúvidas, conte conosco.",
      active: true
    }
  ],

  // 6. Horários de Disponibilidade
  schedules: [
    { day: "Segunda-feira", active: true, startTime: "08:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
    { day: "Terça-feira", active: true, startTime: "08:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
    { day: "Quarta-feira", active: true, startTime: "08:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
    { day: "Quinta-feira", active: true, startTime: "08:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
    { day: "Sexta-feira", active: true, startTime: "08:00", endTime: "18:00", breakStart: "12:00", breakEnd: "13:00" },
    { day: "Sábado", active: true, startTime: "08:00", endTime: "12:00", breakStart: "", breakEnd: "" },
    { day: "Domingo", active: false, startTime: "00:00", endTime: "00:00", breakStart: "", breakEnd: "" }
  ],

  // 7. Configurações da Clínica
  settings: {
    clinicName: "Dra. Marta Gelsi Dias — Odontologia",
    professionalName: "Dra. Marta Gelsi Dias",
    title: "Cirurgiã-Dentista",
    cro: "71482",
    slogan: "Seu sorriso em boas mãos!",
    healthPlans: "Atendemos convênios",
    phone: "11 99577-0004",
    phoneFormatted: "(11) 99577-0004",
    whatsappUrl: "https://wa.me/5511995770004",
    email: "contato@dramartagelsi.com.br",
    address: "São Paulo - SP (Atendimento com hora marcada)",
    defaultDuration: "30",
    intervalDuration: "10",
    cancelNoticeHours: "24",
    googleCalendar: {
      connected: true,
      calendarId: "primary",
      accountEmail: "dra.marta.gelsi@demo.com",
      lastSyncAt: "Hoje às 08:30",
      syncStatus: "synced",
      eventsCount: 8
    }
  },

  // 8. Auditoria Mock
  auditLogs: [
    {
      id: "LOG-001",
      action: "SISTEMA",
      description: "Inicialização dos dados demonstrativos da plataforma",
      user: "Administrador",
      timestamp: "2026-09-21 08:00:00",
      entityId: "SYS-INIT"
    },
    {
      id: "LOG-002",
      action: "LOGIN",
      description: "Acesso ao painel administrativo",
      user: "admin@demo.com",
      timestamp: "2026-09-21 08:15:22",
      entityId: "AUTH-001"
    },
    {
      id: "LOG-003",
      action: "CREATE_PATIENT",
      description: "Paciente cadastrado: Ana Souza",
      user: "Administrador",
      timestamp: "2026-09-21 08:20:10",
      entityId: "PAT-001"
    },
    {
      id: "LOG-004",
      action: "CREATE_APPOINTMENT",
      description: "Agendamento criado para Limpeza Dental - Ana Souza",
      user: "Administrador",
      timestamp: "2026-09-21 08:25:40",
      entityId: "APT-001"
    },
    {
      id: "LOG-005",
      action: "SYNC_CALENDAR",
      description: "Sincronização mock realizada com Google Calendar",
      user: "Administrador",
      timestamp: "2026-09-21 08:30:00",
      entityId: "GCAL-SYNC"
    }
  ]
};
