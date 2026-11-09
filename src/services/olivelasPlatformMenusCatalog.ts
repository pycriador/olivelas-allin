import { isSupabaseConfigured, supabase } from '../lib/supabase/client';
import {
  OlivelasEcosystemModuleSpec,
  OlivelasModuleFieldSpec,
  OlivelasProjectSchemaName,
} from './olivelasEcosystemService';

export interface TableMenuCatalogItem {
  tableName: string;
  menuLabel: string;
  singularLabel: string;
  description: string;
  fields: OlivelasModuleFieldSpec[];
  seedRecords: Record<string, unknown>[];
}

export interface OlivelasPlatformSettings {
  platformDisplayName: string;
  unitDocumentCnpj: string;
  supportEmail: string;
  whatsappNumber: string;
  operatingHours: string;
  timezone: string;
  currency: 'BRL' | 'USD' | 'EUR';
  enableWhatsappAutomation: boolean;
  enableAiCopilotAutoIndex: boolean;
  enableStrictHbacAudit: boolean;
  enablePublicShowcaseLink: boolean;
  slaAlertThresholdMinutes: number;
  serviceFeePercent: number;
  maxDailyCapacity: number;
  pixKey: string;
  webhookEndpointUrl: string;
  whatsappConfirmationTemplate: string;
  customDomainRules: string;
  updatedAt: string;
  updatedBy: string;
}

const TABLE_LABELS_PT: Record<string, { menuLabel: string; singularLabel: string; description: string }> = {
  // agendamento_simples
  clinic_settings: {
    menuLabel: 'Dados do Consultório',
    singularLabel: 'Configuração Clínica',
    description: 'Parâmetros clínicos, horários de funcionamento, RT e integração WhatsApp.',
  },
  plans: {
    menuLabel: 'Planos & Convênios',
    singularLabel: 'Plano / Convênio',
    description: 'Tabelas de convênios odontológicos, descontos e coberturas.',
  },
  services: {
    menuLabel: 'Catálogo de Procedimentos',
    singularLabel: 'Procedimento Clínico',
    description: 'Procedimentos odontológicos e estéticos com duração e valor de tabela.',
  },
  patients: {
    menuLabel: 'Prontuário de Pacientes',
    singularLabel: 'Paciente',
    description: 'Cadastro completo de pacientes, histórico clínico, convênio e contatos.',
  },
  appointments: {
    menuLabel: 'Agenda de Consultas',
    singularLabel: 'Agendamento',
    description: 'Consultas agendadas, confirmações, encaixes e status de atendimento.',
  },
  messages: {
    menuLabel: 'Disparos WhatsApp & SMS',
    singularLabel: 'Mensagem de Confirmação',
    description: 'Histórico e fila de lembretes automáticos enviados aos pacientes.',
  },
  audit_logs: {
    menuLabel: 'Auditoria Clínica',
    singularLabel: 'Log de Auditoria',
    description: 'Registro imutável de acessos e alterações em prontuários e agendas.',
  },

  // agendamentos
  professionals: {
    menuLabel: 'Corpo Clínico & Profissionais',
    singularLabel: 'Profissional',
    description: 'Médicos, terapeutas e especialistas com registro profissional (CRM/CRO/CREFITO).',
  },
  locations: {
    menuLabel: 'Salas & Consultórios',
    singularLabel: 'Sala / Unidade',
    description: 'Consultórios, salas de procedimento e blocos de atendimento.',
  },
  appointment_types: {
    menuLabel: 'Especialidades & Tipos',
    singularLabel: 'Modalidade de Consulta',
    description: 'Tipos de atendimento, tempos de grade e regras de preparo.',
  },
  clients: {
    menuLabel: 'Pacientes & Clientes',
    singularLabel: 'Cliente / Paciente',
    description: 'Base unificada de pacientes atendidos na clínica multiprofissional.',
  },
  schedules: {
    menuLabel: 'Grades & Escalas Médicas',
    singularLabel: 'Escala de Horário',
    description: 'Janelas de disponibilidade semanal, turnos e bloqueios de agenda.',
  },
  waiting_list: {
    menuLabel: 'Fila de Espera Inteligente',
    singularLabel: 'Registro de Espera',
    description: 'Pacientes aguardando encaixe prioritário por desistência ou abertura de vaga.',
  },

  // app_condominio
  condominiums: {
    menuLabel: 'Condomínios & Torres',
    singularLabel: 'Condomínio',
    description: 'Empreendimentos, blocos, CNPJ condominial e dados do síndico.',
  },
  units: {
    menuLabel: 'Unidades & Moradores',
    singularLabel: 'Unidade / Apartamento',
    description: 'Apartamentos, proprietários, inquilinos, vagas de garagem e animais.',
  },
  resources: {
    menuLabel: 'Áreas Comuns & Espaços',
    singularLabel: 'Área Comum',
    description: 'Salão de festas, espaço gourmet, churrasqueira, quadras e regras de uso.',
  },
  reservations: {
    menuLabel: 'Reservas de Espaços',
    singularLabel: 'Reserva de Área',
    description: 'Calendário de reservas de áreas comuns por unidade com taxa de limpeza.',
  },
  announcements: {
    menuLabel: 'Mural & Comunicados',
    singularLabel: 'Comunicado Oficial',
    description: 'Avisos da administração, convocações de assembleia e manutenções.',
  },
  occurrences: {
    menuLabel: 'Livro de Ocorrências',
    singularLabel: 'Ocorrência Predial',
    description: 'Chamados de manutenção, portaria, barulho e solicitações ao síndico.',
  },
  bills: {
    menuLabel: 'Boletos & Financeiro',
    singularLabel: 'Boleto Condominial',
    description: 'Cotas condominiais mensais, fundo de reserva, PIX e controle de inadimplência.',
  },

  // art_hub
  collections: {
    menuLabel: 'Coleções & Exposições',
    singularLabel: 'Coleção Artística',
    description: 'Curadoria de coleções temáticas, séries limitadas e mostras.',
  },
  artworks: {
    menuLabel: 'Acervo de Obras de Arte',
    singularLabel: 'Obra de Arte',
    description: 'Obras catalogadas com dimensões, técnica, precificação e análise Gemini IA.',
  },
  ai_prompts: {
    menuLabel: 'Prompts Curatoriais IA',
    singularLabel: 'Prompt de Curadoria',
    description: 'Templates de engenharia de prompt para análise visual e geração de metadados.',
  },
  ai_queue: {
    menuLabel: 'Fila de Processamento IA',
    singularLabel: 'Job de Visão IA',
    description: 'Fila batch de imagens aguardando extração de tags e descrição curatorial.',
  },

  // casa_organizada
  household_profiles: {
    menuLabel: 'Perfis da Residência',
    singularLabel: 'Perfil Doméstico',
    description: 'Configuração da casa, moradores, pets, crianças e rotina familiar.',
  },
  global_default_tasks: {
    menuLabel: 'Biblioteca de Rotinas Base',
    singularLabel: 'Rotina Padrão',
    description: 'Modelos prontos de organização diária, semanal e mensal por cômodo.',
  },
  custom_tasks: {
    menuLabel: 'Checklists & Tarefas da Casa',
    singularLabel: 'Tarefa Doméstica',
    description: 'Roteiro personalizado de tarefas por ambiente e frequência.',
  },
  task_completions: {
    menuLabel: 'Histórico & Gamificação',
    singularLabel: 'Execução Concluída',
    description: 'Registro diário de tarefas cumpridas, pontuação XP e sequência (streak).',
  },

  // contratos
  workspaces: {
    menuLabel: 'Workspaces & Escritórios',
    singularLabel: 'Workspace',
    description: 'Ambientes departamentais, diretoria jurídica e configurações de governança.',
  },
  projects: {
    menuLabel: 'Projetos & Dossiês',
    singularLabel: 'Projeto / Dossiê',
    description: 'Agrupamento de minutas, operações societárias ou pacotes de engenharia.',
  },
  clauses: {
    menuLabel: 'Biblioteca de Cláusulas LGPD',
    singularLabel: 'Cláusula Padrão',
    description: 'Cláusulas jurídicas homologadas com variáveis dinâmicas e nível de risco.',
  },
  generated_documents: {
    menuLabel: 'Contratos & Instrumentos',
    singularLabel: 'Contrato Gerado',
    description: 'Minutas contratuais completas, score de risco IA e status de assinatura.',
  },

  // especificacoes
  sprints: {
    menuLabel: 'Sprints & Roadmaps',
    singularLabel: 'Sprint de Engenharia',
    description: 'Ciclos ágeis de entrega, metas técnicas e velocidade da equipe.',
  },
  specifications: {
    menuLabel: 'Especificações SDD & ADRs',
    singularLabel: 'Especificação Técnica',
    description: 'Documentos estruturados de arquitetura (ADR, RFC, Spec de Produto).',
  },
  snippets: {
    menuLabel: 'Snippets SQL & TypeScript',
    singularLabel: 'Snippet de Código',
    description: 'Trechos de código reutilizáveis, migrations SQL e contratos JSON.',
  },

  // gestao_estoque
  stores: {
    menuLabel: 'Lojas, Matriz & Filiais',
    singularLabel: 'Unidade / Loja',
    description: 'Hierarquia de unidades físicas, centros de distribuição e estoques locais.',
  },
  store_users: {
    menuLabel: 'Operadores de Caixa & Loja',
    singularLabel: 'Operador de Loja',
    description: 'Vínculo de colaboradores e permissões de PDV/estoque por filial.',
  },
  categories: {
    menuLabel: 'Categorias & Departamentos',
    singularLabel: 'Categoria de Produto',
    description: 'Árvore mercadológica, margem alvo e regras fiscais por departamento.',
  },
  suppliers: {
    menuLabel: 'Fornecedores Homologados',
    singularLabel: 'Fornecedor',
    description: 'Parceiros comerciais, lead time de entrega, CNPJ e condições de compra.',
  },
  products: {
    menuLabel: 'Catálogo de Produtos (SKUs)',
    singularLabel: 'Produto / SKU',
    description: 'Itens de estoque e cardápio com preço de custo, venda, código EAN e saldo.',
  },
  stock_batches: {
    menuLabel: 'Lotes & Validades (FEFO)',
    singularLabel: 'Lote de Estoque',
    description: 'Rastreabilidade por lote, data de fabricação, vencimento e alocação FEFO.',
  },
  orders: {
    menuLabel: 'Vendas, Pedidos & Comandas',
    singularLabel: 'Pedido / Venda',
    description: 'Transações comerciais, vendas PDV, comandas e reservas pagas via PIX.',
  },

  // ordem_de_servico
  customers: {
    menuLabel: 'Clientes & Contratantes',
    singularLabel: 'Cliente',
    description: 'Cadastro de clientes pessoa física e jurídica atendidos na assistência.',
  },
  devices: {
    menuLabel: 'Equipamentos & Seriais',
    singularLabel: 'Equipamento / Dispositivo',
    description: 'Base de equipamentos por número de série/IMEI, marca, modelo e histórico.',
  },
  technicians: {
    menuLabel: 'Técnicos de Bancada',
    singularLabel: 'Técnico Especialista',
    description: 'Equipe técnica, especialidade de laboratório e percentual de comissão.',
  },
  service_orders: {
    menuLabel: 'Ordens de Serviço (O.S.)',
    singularLabel: 'Ordem de Serviço',
    description: 'Controle completo de bancada, diagnóstico, peças, mão de obra e garantia.',
  },

  // personal_treiner
  trainers: {
    menuLabel: 'Treinadores & Coaches',
    singularLabel: 'Personal Trainer',
    description: 'Profissionais de educação física (CREF), especialidades e carteira de alunos.',
  },
  students: {
    menuLabel: 'Alunos & Atletas',
    singularLabel: 'Aluno(a)',
    description: 'Alunos ativos, avaliação antropométrica, objetivos, peso, BF% e streaks.',
  },
  exercises: {
    menuLabel: 'Biblioteca de Exercícios',
    singularLabel: 'Exercício Biomecânico',
    description: 'Catálogo de exercícios por grupamento muscular, equipamento e cadência.',
  },
  workout_plans: {
    menuLabel: 'Fichas & Periodização',
    singularLabel: 'Plano de Treino',
    description: 'Divisões A/B/C/D/E, séries, repetições, RPE e prescrição individualizada.',
  },
  nutrition_plans: {
    menuLabel: 'Planos Nutricionais & Macros',
    singularLabel: 'Protocolo Nutricional',
    description: 'Cardápios esportivos, metas de calorias (kcal), proteínas, carboidratos e lipídios.',
  },

  // restaurante
  restaurants: {
    menuLabel: 'Unidades & Praças KDS',
    singularLabel: 'Restaurante / Praça',
    description: 'Configuração do restaurante, praças de cozinha (Quente, Fria, Bar) e taxa de serviço.',
  },
  restaurant_tables: {
    menuLabel: 'Mapa de Mesas & Salão',
    singularLabel: 'Mesa do Salão',
    description: 'Mesas numeradas, capacidade de lugares, QR Code de autoatendimento e status.',
  },

  // rifas & suite_rifa
  campaigns: {
    menuLabel: 'Campanhas & Sorteios',
    singularLabel: 'Campanha de Sorteio',
    description: 'Sorteios oficiais, prêmio principal, valor da cota, bilhetes vendidos e extração.',
  },
  organizations: {
    menuLabel: 'Organizações & Sub-Tenants',
    singularLabel: 'Organização Promotora',
    description: 'Tenants promotores de campanhas, plano SaaS (Free/Pro/Enterprise) e limites.',
  },

  // sistema_delivery
  couriers: {
    menuLabel: 'Frota de Entregadores',
    singularLabel: 'Entregador / Courier',
    description: 'Motoboys e ciclistas parceiros, placa/veículo, status online e entregas do turno.',
  },
  delivery_orders: {
    menuLabel: 'Pedidos de Delivery',
    singularLabel: 'Pedido de Entrega',
    description: 'Pedidos em tempo real nos 6 estágios logísticos, endereço, frete e entregador.',
  },

  // sistema_mercado
  breakfast_baskets: {
    menuLabel: 'Cestas Matinais & Kits',
    singularLabel: 'Cesta Comemorativa',
    description: 'Cestas de café da manhã P/M/G, kits corporativos, composição e pronta-entrega.',
  },
  catalog_requests: {
    menuLabel: 'Encomendas & Pedidos Online',
    singularLabel: 'Encomenda de Cesta',
    description: 'Solicitações de clientes com horário de entrega agendado e mensagem de cartão.',
  },

  // vitrine_digital
  art_submissions: {
    menuLabel: 'Produtos & Encartes na Vitrine',
    singularLabel: 'Submissão de Vitrine',
    description: 'Peças e fotos enviadas para a vitrine digital com headline SEO e moderação.',
  },
  image_analysis: {
    menuLabel: 'Laudos Fotográficos Vision IA',
    singularLabel: 'Análise Visual IA',
    description: 'Notas técnicas de iluminação, nitidez, fundo e recomendações da IA.',
  },
};

export function getTableCatalogMetadata(
  moduleSpec: OlivelasEcosystemModuleSpec,
  tableName: string,
): TableMenuCatalogItem {
  const meta = TABLE_LABELS_PT[tableName] || {
    menuLabel: `Cadastro: ${tableName}`,
    singularLabel: tableName,
    description: `Registros operacionais da tabela ${moduleSpec.dbSchema}.${tableName} no Supabase.`,
  };

  if (tableName === moduleSpec.primaryTable) {
    return {
      tableName,
      menuLabel: meta.menuLabel,
      singularLabel: meta.singularLabel,
      description: meta.description,
      fields: moduleSpec.fields,
      seedRecords: moduleSpec.seedRecords,
    };
  }

  // Campos e seeds inteligentes para tabelas secundárias do schema
  const secondarySeeds = buildSecondaryTableDefaults(moduleSpec, tableName);
  return {
    tableName,
    menuLabel: meta.menuLabel,
    singularLabel: meta.singularLabel,
    description: meta.description,
    fields: secondarySeeds.fields,
    seedRecords: secondarySeeds.records,
  };
}

function buildSecondaryTableDefaults(
  moduleSpec: OlivelasEcosystemModuleSpec,
  tableName: string,
): { fields: OlivelasModuleFieldSpec[]; records: Record<string, unknown>[] } {
  const cid = 'emp-olivelas-matriz';

  switch (tableName) {
    case 'stores':
      return {
        fields: [
          { key: 'code', label: 'Código da Unidade', type: 'text', placeholder: 'Ex.: FILIAL-JARDINS' },
          { key: 'name', label: 'Nome da Loja / Filial', type: 'text', placeholder: 'Ex.: Olivelas Flagship Jardins' },
          { key: 'type', label: 'Tipo de Unidade', type: 'select', options: [{ value: 'MATRIZ', label: 'Matriz / CD Central' }, { value: 'FILIAL', label: 'Filial / Ponto de Venda' }] },
          { key: 'city', label: 'Cidade / UF', type: 'text', placeholder: 'Ex.: São Paulo / SP' },
          { key: 'status', label: 'Status Operacional', type: 'select', options: [{ value: 'active', label: 'Operando Online' }, { value: 'inventory', label: 'Em Balanço' }] },
        ],
        records: [
          { id: 'store_matriz', company_id: cid, code: 'MATRIZ-SP', name: 'Olivelas Matriz & CD Central', type: 'MATRIZ', city: 'São Paulo / SP', status: 'active' },
          { id: 'store_filial_01', company_id: cid, code: 'FILIAL-JARDINS', name: 'Olivelas Boutique Jardins', type: 'FILIAL', city: 'São Paulo / SP', status: 'active' },
          { id: 'store_filial_02', company_id: cid, code: 'FILIAL-CAMPINAS', name: 'Olivelas Store Iguatemi Campinas', type: 'FILIAL', city: 'Campinas / SP', status: 'active' },
        ],
      };

    case 'categories':
      return {
        fields: [
          { key: 'code', label: 'Código', type: 'text', placeholder: 'Ex.: CAT-AROMA' },
          { key: 'name', label: 'Nome da Categoria', type: 'text', placeholder: 'Ex.: Velas & Difusores Botânicos' },
          { key: 'target_margin_percent', label: 'Margem Alvo (%)', type: 'number', placeholder: '62' },
          { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Ativa no PDV' }, { value: 'inactive', label: 'Inativa' }] },
        ],
        records: [
          { id: 'cat_01', company_id: cid, code: 'CAT-VELAS', name: 'Velas Aromáticas Artesanais', target_margin_percent: 65, status: 'active' },
          { id: 'cat_02', company_id: cid, code: 'CAT-DIFUSORES', name: 'Difusores & Home Spray', target_margin_percent: 62, status: 'active' },
          { id: 'cat_03', company_id: cid, code: 'CAT-KITS', name: 'Kits Presente & Corporativos', target_margin_percent: 58, status: 'active' },
        ],
      };

    case 'suppliers':
      return {
        fields: [
          { key: 'trade_name', label: 'Fornecedor / Razão Social', type: 'text', placeholder: 'Ex.: Essências Provence Brasil Ltda.' },
          { key: 'cnpj', label: 'CNPJ', type: 'text', placeholder: 'Ex.: 45.192.830/0001-19' },
          { key: 'lead_time_days', label: 'Lead Time (Dias)', type: 'number', placeholder: '5' },
          { key: 'contact_phone', label: 'Telefone / WhatsApp Comercial', type: 'text', placeholder: 'Ex.: (11) 98812-4400' },
          { key: 'status', label: 'Homologação', type: 'select', options: [{ value: 'approved', label: 'Homologado ISO/Qualidade' }, { value: 'review', label: 'Em Avaliação' }] },
        ],
        records: [
          { id: 'sup_01', company_id: cid, trade_name: 'Essências Grasse & Provence Importadora', cnpj: '45.192.830/0001-19', lead_time_days: 5, contact_phone: '(11) 98812-4400', status: 'approved' },
          { id: 'sup_02', company_id: cid, trade_name: 'Vidraria Cristais do Atlântico S.A.', cnpj: '18.402.991/0001-74', lead_time_days: 7, contact_phone: '(11) 97741-2090', status: 'approved' },
        ],
      };

    case 'stock_batches':
      return {
        fields: [
          { key: 'batch_code', label: 'Código do Lote (FEFO)', type: 'text', placeholder: 'Ex.: LOTE-2026-11A' },
          { key: 'product_name', label: 'Produto Vinculado', type: 'text', placeholder: 'Ex.: Vela Aromática Bourbon Vanilla 320g' },
          { key: 'expiry_date', label: 'Data de Validade', type: 'text', placeholder: 'Ex.: 2027-11-30' },
          { key: 'quantity_available', label: 'Saldo do Lote (UN)', type: 'number', placeholder: '85' },
          { key: 'status', label: 'Prioridade FEFO', type: 'select', options: [{ value: 'fefo_priority', label: '1ª Saída (Prioridade FEFO)' }, { value: 'reserve', label: 'Estoque Reserva' }] },
        ],
        records: [
          { id: 'batch_01', company_id: cid, batch_code: 'LOTE-2026-11A', product_name: 'Vela Aromática Olivelas Bourbon Vanilla 320g', expiry_date: '2027-06-30', quantity_available: 85, status: 'fefo_priority' },
          { id: 'batch_02', company_id: cid, batch_code: 'LOTE-2026-12B', product_name: 'Difusor de Ambientes Figo & Âmbar 250ml', expiry_date: '2027-10-15', quantity_available: 60, status: 'reserve' },
        ],
      };

    case 'patients':
    case 'clients':
    case 'customers':
      return {
        fields: [
          { key: 'full_name', label: 'Nome Completo / Razão Social', type: 'text', placeholder: 'Ex.: Mariana Costa Ribeiro' },
          { key: 'document', label: 'CPF / CNPJ', type: 'text', placeholder: 'Ex.: 384.920.118-40' },
          { key: 'phone', label: 'WhatsApp / Telefone', type: 'text', placeholder: 'Ex.: (11) 99412-8831' },
          { key: 'plan_or_segment', label: 'Convênio / Segmento', type: 'text', placeholder: 'Ex.: Olivelas Prime / VIP' },
          { key: 'status', label: 'Status Cadastral', type: 'select', options: [{ value: 'active', label: 'Ativo' }, { value: 'vip', label: 'Cliente VIP / Recorrente' }] },
        ],
        records: [
          { id: 'cli_01', company_id: cid, full_name: 'Mariana Costa Ribeiro', document: '384.920.118-40', phone: '(11) 99412-8831', plan_or_segment: 'Olivelas Prime', status: 'vip' },
          { id: 'cli_02', company_id: cid, full_name: 'Eduardo Albuquerque Prado', document: '219.440.881-09', phone: '(11) 98122-3390', plan_or_segment: 'Particular / Corporativo', status: 'active' },
        ],
      };

    case 'services':
    case 'appointment_types':
      return {
        fields: [
          { key: 'code', label: 'Código TUSS / Interno', type: 'text', placeholder: 'Ex.: PROC-104' },
          { key: 'name', label: 'Nome do Procedimento / Serviço', type: 'text', placeholder: 'Ex.: Profilaxia Ultrassônica + Escaneamento 3D' },
          { key: 'duration_minutes', label: 'Duração (Minutos)', type: 'number', placeholder: '45' },
          { key: 'price', label: 'Valor de Tabela (R$)', type: 'currency', placeholder: '280' },
          { key: 'status', label: 'Disponibilidade', type: 'select', options: [{ value: 'active', label: 'Disponível na Agenda' }, { value: 'paused', label: 'Suspenso' }] },
        ],
        records: [
          { id: 'srv_01', company_id: cid, code: 'PROC-101', name: 'Profilaxia Ultrassônica & Checkup Digital', duration_minutes: 45, price: 220, status: 'active' },
          { id: 'srv_02', company_id: cid, code: 'PROC-205', name: 'Clareamento Dental a Laser + Moldeira', duration_minutes: 60, price: 890, status: 'active' },
        ],
      };

    case 'plans':
      return {
        fields: [
          { key: 'name', label: 'Nome do Plano / Convênio', type: 'text', placeholder: 'Ex.: Olivelas Odonto Executive' },
          { key: 'discount_percent', label: 'Cobertura / Desconto (%)', type: 'number', placeholder: '30' },
          { key: 'monthly_fee', label: 'Mensalidade Base (R$)', type: 'currency', placeholder: '149.90' },
          { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Vigente' }, { value: 'inactive', label: 'Encerrado' }] },
        ],
        records: [
          { id: 'pln_01', company_id: cid, name: 'Olivelas Odonto Prime', discount_percent: 40, monthly_fee: 149.9, status: 'active' },
          { id: 'pln_02', company_id: cid, name: 'Convênio Empresarial Diamond', discount_percent: 100, monthly_fee: 299.0, status: 'active' },
        ],
      };

    case 'units':
      return {
        fields: [
          { key: 'unit_code', label: 'Bloco & Apartamento', type: 'text', placeholder: 'Ex.: Torre A - Apto 1402' },
          { key: 'resident_name', label: 'Condômino / Responsável', type: 'text', placeholder: 'Ex.: Dr. Roberto Vasconcelos' },
          { key: 'parking_spots', label: 'Vagas de Garagem', type: 'number', placeholder: '3' },
          { key: 'status', label: 'Situação Financeira', type: 'select', options: [{ value: 'regular', label: 'Adimplente em Dia' }, { value: 'pending', label: 'Pendente de Conciliação' }] },
        ],
        records: [
          { id: 'unit_101', company_id: cid, unit_code: 'Torre A - Apto 1402', resident_name: 'Roberto Vasconcelos', parking_spots: 3, status: 'regular' },
          { id: 'unit_102', company_id: cid, unit_code: 'Torre B - Cobertura 2101', resident_name: 'Patrícia Lemos', parking_spots: 4, status: 'regular' },
        ],
      };

    case 'reservations':
      return {
        fields: [
          { key: 'space_name', label: 'Área Comum Reservada', type: 'text', placeholder: 'Ex.: Espaço Gourmet & Parrilla' },
          { key: 'unit_code', label: 'Unidade Solicitante', type: 'text', placeholder: 'Ex.: Torre A - Apto 1402' },
          { key: 'event_date', label: 'Data da Reserva', type: 'text', placeholder: 'Ex.: 2026-11-15 (19h às 23h)' },
          { key: 'fee_amount', label: 'Taxa de Conservação (R$)', type: 'currency', placeholder: '180' },
          { key: 'status', label: 'Status da Reserva', type: 'select', options: [{ value: 'confirmed', label: 'Confirmada & Liberada na Portaria' }, { value: 'pending', label: 'Aguardando Termo' }] },
        ],
        records: [
          { id: 'res_01', company_id: cid, space_name: 'Salão Gourmet & Adega Climatizada', unit_code: 'Torre A - Apto 1402', event_date: '2026-11-15 (19h-23h)', fee_amount: 180, status: 'confirmed' },
          { id: 'res_02', company_id: cid, space_name: 'Quadra de Beach Tennis Oficial', unit_code: 'Torre B - Cobertura 2101', event_date: '2026-11-16 (09h-11h)', fee_amount: 0, status: 'confirmed' },
        ],
      };

    case 'bills':
      return {
        fields: [
          { key: 'competence', label: 'Competência Mensal', type: 'text', placeholder: 'Ex.: 11/2026' },
          { key: 'unit_code', label: 'Unidade', type: 'text', placeholder: 'Ex.: Torre A - Apto 1402' },
          { key: 'amount', label: 'Valor do Boleto / PIX (R$)', type: 'currency', placeholder: '1480' },
          { key: 'status', label: 'Situação de Pagamento', type: 'select', options: [{ value: 'paid', label: 'Liquidado via PIX/Boleto' }, { value: 'open', label: 'A Vencer' }, { value: 'overdue', label: 'Em Atraso' }] },
        ],
        records: [
          { id: 'bill_01', company_id: cid, competence: '11/2026', unit_code: 'Torre A - Apto 1402', amount: 1480, status: 'paid' },
          { id: 'bill_02', company_id: cid, competence: '11/2026', unit_code: 'Torre B - Cobertura 2101', amount: 2290, status: 'open' },
        ],
      };

    case 'clauses':
      return {
        fields: [
          { key: 'code', label: 'Código da Cláusula', type: 'text', placeholder: 'Ex.: CL-LGPD-04' },
          { key: 'title', label: 'Título Jurídico', type: 'text', placeholder: 'Ex.: Proteção de Dados Pessoais e Operador LGPD' },
          { key: 'category', label: 'Ramo / Natureza', type: 'text', placeholder: 'Ex.: Compliance & Privacidade' },
          { key: 'risk_level', label: 'Risco Mitigado', type: 'select', options: [{ value: 'low', label: 'Baixo (Padrão)' }, { value: 'high', label: 'Crítico (Obrigatória)' }] },
        ],
        records: [
          { id: 'cls_01', company_id: cid, code: 'CL-LGPD-01', title: 'Responsabilidade Solidária e Tratamento de Dados (Art. 42 LGPD)', category: 'Privacidade & Dados', risk_level: 'high' },
          { id: 'cls_02', company_id: cid, code: 'CL-SLA-02', title: 'Acordo de Nível de Serviço (Disponibilidade 99,9% Mensal)', category: 'Operações SaaS', risk_level: 'low' },
        ],
      };

    case 'exercises':
      return {
        fields: [
          { key: 'name', label: 'Nome do Exercício', type: 'text', placeholder: 'Ex.: Agachamento Livre com Barra Olímpica' },
          { key: 'muscle_group', label: 'Grupamento Muscular', type: 'text', placeholder: 'Ex.: Quadríceps & Glúteos' },
          { key: 'default_sets', label: 'Prescrição Padrão (Séries x Reps)', type: 'text', placeholder: 'Ex.: 4x 8-10 (RPE 8.5)' },
          { key: 'equipment', label: 'Equipamento', type: 'text', placeholder: 'Ex.: Gaiola / Barra Olímpica' },
        ],
        records: [
          { id: 'ex_01', company_id: cid, name: 'Supino Inclinado com Halteres', muscle_group: 'Peitoral Superior', default_sets: '4x 10-12 (RPE 8.5)', equipment: 'Banco 30° + Halteres' },
          { id: 'ex_02', company_id: cid, name: 'Agachamento Livre Barra Olímpica', muscle_group: 'Membros Inferiores', default_sets: '5x 8 (RPE 9.0)', equipment: 'Power Rack' },
          { id: 'ex_03', company_id: cid, name: 'Remada Curvada Pronada', muscle_group: 'Dorsais', default_sets: '4x 10 (RPE 8.5)', equipment: 'Barra Olímpica' },
        ],
      };

    case 'workout_plans':
      return {
        fields: [
          { key: 'title', label: 'Nome do Microciclo / Ficha', type: 'text', placeholder: 'Ex.: Hipertrofia ABCDE - Fase Intensificação' },
          { key: 'student_name', label: 'Aluno Vinculado', type: 'text', placeholder: 'Ex.: Carlos Eduardo Mendes' },
          { key: 'weekly_sessions', label: 'Sessões por Semana', type: 'number', placeholder: '5' },
          { key: 'status', label: 'Status da Ficha', type: 'select', options: [{ value: 'active', label: 'Em Execução no App' }, { value: 'completed', label: 'Ciclo Finalizado' }] },
        ],
        records: [
          { id: 'wp_01', company_id: cid, title: 'Periodização Ondulatória ABC (Força & Hipertrofia)', student_name: 'Carlos Eduardo Mendes', weekly_sessions: 5, status: 'active' },
          { id: 'wp_02', company_id: cid, title: 'Preparação Específica 21km + Fortalecimento Core', student_name: 'Fernanda Vasconcelos', weekly_sessions: 4, status: 'active' },
        ],
      };

    case 'nutrition_plans':
      return {
        fields: [
          { key: 'title', label: 'Protocolo Nutricional', type: 'text', placeholder: 'Ex.: Dieta Normocalórica Alta Proteína (2.600 kcal)' },
          { key: 'student_name', label: 'Aluno(a)', type: 'text', placeholder: 'Ex.: Carlos Eduardo Mendes' },
          { key: 'daily_kcal', label: 'Meta Diária (kcal)', type: 'number', placeholder: '2600' },
          { key: 'macros_split', label: 'Divisão de Macros (P / C / G)', type: 'text', placeholder: 'Ex.: 210g Prot • 280g Carb • 70g Gord' },
        ],
        records: [
          { id: 'nut_01', company_id: cid, title: 'Recomposição Corporal High-Protein', student_name: 'Carlos Eduardo Mendes', daily_kcal: 2650, macros_split: '215g Prot • 290g Carb • 68g Gord' },
          { id: 'nut_02', company_id: cid, title: 'Endurance & Carbo Loading Pré-Prova', student_name: 'Fernanda Vasconcelos', daily_kcal: 2180, macros_split: '140g Prot • 310g Carb • 52g Gord' },
        ],
      };

    case 'restaurant_tables':
      return {
        fields: [
          { key: 'table_number', label: 'Número da Mesa', type: 'number', placeholder: '14' },
          { key: 'hall_zone', label: 'Ambiente / Salão', type: 'text', placeholder: 'Ex.: Varanda Gourmet / Salão Principal' },
          { key: 'capacity', label: 'Lugares', type: 'number', placeholder: '4' },
          { key: 'current_bill', label: 'Consumo Parcial (R$)', type: 'currency', placeholder: '462' },
          { key: 'status', label: 'Status da Mesa', type: 'select', options: [{ value: 'occupied', label: 'Em Atendimento' }, { value: 'free', label: 'Livre & Higienizada' }, { value: 'closing', label: 'Aguardando Fechamento PIX' }] },
        ],
        records: [
          { id: 'tbl_01', company_id: cid, table_number: 1, hall_zone: 'Salão Principal', capacity: 4, current_bill: 318.5, status: 'occupied' },
          { id: 'tbl_02', company_id: cid, table_number: 2, hall_zone: 'Varanda Jardim', capacity: 2, current_bill: 0, status: 'free' },
          { id: 'tbl_14', company_id: cid, table_number: 14, hall_zone: 'Deck VIP', capacity: 6, current_bill: 462.0, status: 'occupied' },
        ],
      };

    case 'couriers':
      return {
        fields: [
          { key: 'full_name', label: 'Nome do Entregador', type: 'text', placeholder: 'Ex.: Rodrigo Nascimento' },
          { key: 'vehicle_plate', label: 'Veículo / Placa', type: 'text', placeholder: 'Ex.: Honda CG 160 • BRA-4E21' },
          { key: 'completed_today', label: 'Entregas no Turno', type: 'number', placeholder: '18' },
          { key: 'status', label: 'Disponibilidade GPS', type: 'select', options: [{ value: 'available', label: 'Disponível na Base' }, { value: 'in_route', label: 'Em Rota de Entrega' }] },
        ],
        records: [
          { id: 'cou_01', company_id: cid, full_name: 'Rodrigo Nascimento', vehicle_plate: 'Honda CG 160 • BRA-4E21', completed_today: 18, status: 'in_route' },
          { id: 'cou_02', company_id: cid, full_name: 'Lucas Ferreira Lima', vehicle_plate: 'Yamaha Factor • OLV-9A11', completed_today: 14, status: 'available' },
        ],
      };

    default:
      return {
        fields: [
          { key: 'name', label: `Identificação (${tableName})`, type: 'text', placeholder: `Ex.: Registro Principal de ${tableName}` },
          { key: 'description', label: 'Descrição / Detalhamento Operacional', type: 'text', placeholder: 'Especificação completa do item' },
          { key: 'reference_value', label: 'Valor / Capacidade de Referência', type: 'number', placeholder: '100' },
          {
            key: 'status',
            label: 'Status no Sistema',
            type: 'select',
            options: [
              { value: 'active', label: 'Ativo e Homologado' },
              { value: 'pending', label: 'Em Revisão' },
            ],
          },
        ],
        records: [
          {
            id: `${tableName.slice(0, 4)}_01`,
            company_id: cid,
            name: `${TABLE_LABELS_PT[tableName]?.singularLabel || tableName} Oficial #01 — ${moduleSpec.shortName}`,
            description: `Registro operacional ativo em ${moduleSpec.dbSchema}.${tableName}`,
            reference_value: 100,
            status: 'active',
          },
          {
            id: `${tableName.slice(0, 4)}_02`,
            company_id: cid,
            name: `${TABLE_LABELS_PT[tableName]?.singularLabel || tableName} Oficial #02 — ${moduleSpec.shortName}`,
            description: `Configuração secundária sincronizada com o banco PostgreSQL`,
            reference_value: 250,
            status: 'active',
          },
        ],
      };
  }
}

const SETTINGS_CACHE_PREFIX = 'olivelas_platform_settings_v1_';

export function getDefaultPlatformSettings(moduleSpec: OlivelasEcosystemModuleSpec): OlivelasPlatformSettings {
  return {
    platformDisplayName: `${moduleSpec.brandName} — Unidade Matriz`,
    unitDocumentCnpj: '48.921.304/0001-88',
    supportEmail: `operacoes.${moduleSpec.dbSchema}@olivelasallin.com.br`,
    whatsappNumber: '+55 (11) 99800-4400',
    operatingHours: 'Segunda a Sábado • 08:00 às 22:00',
    timezone: 'America/Sao_Paulo (GMT-3)',
    currency: 'BRL',
    enableWhatsappAutomation: true,
    enableAiCopilotAutoIndex: true,
    enableStrictHbacAudit: true,
    enablePublicShowcaseLink: true,
    slaAlertThresholdMinutes: 30,
    serviceFeePercent: 10,
    maxDailyCapacity: 500,
    pixKey: `pix.${moduleSpec.dbSchema}@olivelas.com.br`,
    webhookEndpointUrl: `https://api.olivelasallin.com.br/webhooks/${moduleSpec.dbSchema}`,
    whatsappConfirmationTemplate: `Olá {{cliente}}, confirmamos seu atendimento em ${moduleSpec.brandName}. Protocolo: #{{id}}.`,
    customDomainRules: `Operação padronizada no schema PostgreSQL ${moduleSpec.dbSchema} com SSO via public.profiles e auditoria HBAC ativa.`,
    updatedAt: new Date().toISOString(),
    updatedBy: 'helena.vasconcelos@olivelasallin.com.br',
  };
}

export async function loadModulePlatformSettings(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId: string,
): Promise<OlivelasPlatformSettings> {
  const defaults = getDefaultPlatformSettings(moduleSpec);
  const storageKey = `${SETTINGS_CACHE_PREFIX}${moduleSpec.dbSchema}_${companyId}`;

  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem(storageKey);
      if (cached) {
        return { ...defaults, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
  }

  if (isSupabaseConfigured) {
    try {
      const entityId = `platform_settings_${moduleSpec.dbSchema}_${companyId}`;
      const { data, error } = await supabase
        .schema('public')
        .from('allin_entity_store')
        .select('payload')
        .eq('entity_type', 'module_platform_settings')
        .eq('entity_id', entityId)
        .maybeSingle();

      if (!error && data?.payload) {
        const merged = { ...defaults, ...(data.payload as Partial<OlivelasPlatformSettings>) };
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey, JSON.stringify(merged));
        }
        return merged;
      }
    } catch {
      // fallback to defaults
    }
  }

  return defaults;
}

export async function saveModulePlatformSettings(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId: string,
  settings: OlivelasPlatformSettings,
  actorEmail: string,
): Promise<{ settings: OlivelasPlatformSettings; persistedInSupabase: boolean }> {
  const updated: OlivelasPlatformSettings = {
    ...settings,
    updatedAt: new Date().toISOString(),
    updatedBy: actorEmail,
  };
  const storageKey = `${SETTINGS_CACHE_PREFIX}${moduleSpec.dbSchema}_${companyId}`;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  if (!isSupabaseConfigured) {
    return { settings: updated, persistedInSupabase: false };
  }

  try {
    const entityId = `platform_settings_${moduleSpec.dbSchema}_${companyId}`;
    const { error } = await supabase
      .schema('public')
      .from('allin_entity_store')
      .upsert(
        {
          entity_type: 'module_platform_settings',
          entity_id: entityId,
          company_id: companyId,
          payload: updated,
          is_archived: false,
          updated_at: updated.updatedAt,
        },
        { onConflict: 'entity_type,entity_id' },
      );

    return { settings: updated, persistedInSupabase: !error };
  } catch {
    return { settings: updated, persistedInSupabase: false };
  }
}

export function getSecondaryTableLocalRecords(
  schema: OlivelasProjectSchemaName,
  tableName: string,
  fallback: Record<string, unknown>[],
): Record<string, unknown>[] {
  if (typeof window === 'undefined') return [...fallback];
  const key = `olivelas_allin_table_cache_v1_${schema}_${tableName}`;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [...fallback];
}

export function setSecondaryTableLocalRecords(
  schema: OlivelasProjectSchemaName,
  tableName: string,
  records: Record<string, unknown>[],
): void {
  if (typeof window === 'undefined') return;
  const key = `olivelas_allin_table_cache_v1_${schema}_${tableName}`;
  try {
    window.localStorage.setItem(key, JSON.stringify(records));
  } catch {
    // ignore
  }
}
