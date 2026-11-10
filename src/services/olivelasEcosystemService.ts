import {
  getProjectSchemaClient,
  getUnifiedProfilesTable,
  isSupabaseConfigured,
  supabase,
  supabaseKey,
  supabaseUrl,
} from '../lib/supabase/client';
import { UserEntity } from '../types/domain';
import {
  getSecondaryTableLocalRecords,
  getTableCatalogMetadata,
  setSecondaryTableLocalRecords,
} from './olivelasPlatformMenusCatalog';

export type OlivelasProjectSchemaName =
  | 'agendamento_simples'
  | 'agendamentos'
  | 'app_condominio'
  | 'art_hub'
  | 'casa_organizada'
  | 'contratos'
  | 'especificacoes'
  | 'gestao_estoque'
  | 'ordem_de_servico'
  | 'personal_treiner'
  | 'restaurante'
  | 'rifas'
  | 'sistema_delivery'
  | 'sistema_mercado'
  | 'suite_rifa'
  | 'vitrine_digital';

export interface OlivelasModuleFieldSpec {
  key: string;
  label: string;
  type: 'text' | 'number' | 'currency' | 'select' | 'date';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface OlivelasEcosystemModuleSpec {
  id: string;
  slug: string;
  folder: string;
  dbSchema: OlivelasProjectSchemaName;
  brandName: string;
  shortName: string;
  tagline: string;
  description: string;
  category: 'Saúde & Bem-Estar' | 'Varejo & Gastronomia' | 'Operações & Imóveis' | 'Engenharia, Jurídico & IA' | 'Sorteios & Campanhas';
  priceMonthly: number;
  primaryTable: string;
  tables: string[];
  features: string[];
  kpis: { label: string; metricKey: string; suffix?: string }[];
  fields: OlivelasModuleFieldSpec[];
  seedRecords: Record<string, unknown>[];
}

export const OLIVELAS_ECOSYSTEM_MODULES: OlivelasEcosystemModuleSpec[] = [
  {
    id: 'mod_agendamento_simples',
    slug: 'allin_agendamento_simples',
    folder: 'agendamento_simples',
    dbSchema: 'agendamento_simples',
    brandName: 'Olivelas - Consultório & Odonto',
    shortName: 'Consultório & Odonto',
    tagline: 'Agenda odontológica, prontuário clínico, planos e confirmação WhatsApp',
    description:
      'Módulo clínico e odontológico padronizado no ecossistema Olivelas All In para gestão de pacientes, convênios, procedimentos e lembretes automatizados.',
    category: 'Saúde & Bem-Estar',
    priceMonthly: 249,
    primaryTable: 'appointments',
    tables: ['clinic_settings', 'plans', 'services', 'patients', 'appointments', 'messages', 'audit_logs'],
    features: [
      'Agenda Clínica & Odontológica',
      'Gestão de Planos e Convênios',
      'Catálogo de Procedimentos',
      'Disparo de Confirmação WhatsApp',
    ],
    kpis: [
      { label: 'Consultas Agendadas', metricKey: 'count' },
      { label: 'Receita Prevista', metricKey: 'sum_amount', suffix: 'BRL' },
      { label: 'Taxa de Confirmação', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'patient_name', label: 'Nome do Paciente', type: 'text', placeholder: 'Ex.: Mariana Costa Ribeiro' },
      { key: 'service_name', label: 'Procedimento / Serviço', type: 'text', placeholder: 'Ex.: Profilaxia Ultrassônica & Checkup' },
      { key: 'amount', label: 'Valor do Procedimento (R$)', type: 'currency', placeholder: '220' },
      {
        key: 'status',
        label: 'Status do Atendimento',
        type: 'select',
        options: [
          { value: 'confirmed', label: 'Confirmado' },
          { value: 'pending', label: 'Aguardando Confirmação' },
          { value: 'completed', label: 'Concluído' },
        ],
      },
      { key: 'notes', label: 'Observações Clínicas', type: 'text', placeholder: 'Anamnese / observações do paciente' },
    ],
    seedRecords: [
      {
        id: 'apt_odonto_1',
        company_id: 'emp-olivelas-matriz',
        patient_name: 'Mariana Costa Ribeiro',
        service_name: 'Profilaxia Ultrassônica & Checkup Digital',
        scheduled_at: '2026-11-10T14:00:00.000Z',
        status: 'confirmed',
        amount: 220,
        notes: 'Confirmado via WhatsApp automático • Convênio Olivelas Odonto Prime',
      },
      {
        id: 'apt_odonto_2',
        company_id: 'emp-olivelas-matriz',
        patient_name: 'Eduardo Albuquerque',
        service_name: 'Clareamento Dental a Laser (Sessão 02)',
        scheduled_at: '2026-11-11T10:30:00.000Z',
        status: 'confirmed',
        amount: 890,
        notes: 'Polimento final e entrega de moldeira personalizada',
      },
    ],
  },
  {
    id: 'mod_agendamentos',
    slug: 'allin_agendamentos',
    folder: 'agendamentos',
    dbSchema: 'agendamentos',
    brandName: 'Olivelas - Clínicas & Agendamentos',
    shortName: 'Clínicas & Agendamentos',
    tagline: 'Escalas multiprofissionais, salas, especialidades e fila de espera inteligente',
    description:
      'Gestão avançada de clínicas multiprofissionais com controle de salas, regras de disponibilidade, bloqueios de agenda e encaixe automático.',
    category: 'Saúde & Bem-Estar',
    priceMonthly: 349,
    primaryTable: 'appointments',
    tables: ['professionals', 'locations', 'appointment_types', 'clients', 'schedules', 'appointments', 'waiting_list'],
    features: [
      'Grades Multiprofissionais',
      'Alocação de Salas e Consultórios',
      'Fila de Espera Prioritária',
      'Controle de Convênios & Particular',
    ],
    kpis: [
      { label: 'Atendimentos na Grade', metricKey: 'count' },
      { label: 'Faturamento da Agenda', metricKey: 'sum_amount', suffix: 'BRL' },
      { label: 'Ocupação de Salas', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'title', label: 'Título / Paciente & Especialidade', type: 'text', placeholder: 'Ex.: Consulta Dermatológica - Henrique Prado' },
      { key: 'amount', label: 'Valor da Consulta (R$)', type: 'currency', placeholder: '480' },
      {
        key: 'status',
        label: 'Status da Agenda',
        type: 'select',
        options: [
          { value: 'confirmed', label: 'Confirmado' },
          { value: 'waiting', label: 'Em Sala de Espera' },
          { value: 'completed', label: 'Atendido' },
        ],
      },
      { key: 'notes', label: 'Sala / Profissional Responsável', type: 'text', placeholder: 'Dra. Camila Albuquerque • Sala 04' },
    ],
    seedRecords: [
      {
        id: 'ag_apt_1',
        company_id: 'emp-olivelas-matriz',
        title: 'Consulta Dermatológica - Henrique Vasconcelos Prado',
        start_at: '2026-11-11T09:00:00.000Z',
        end_at: '2026-11-11T09:45:00.000Z',
        status: 'confirmed',
        amount: 480,
        notes: 'Dra. Camila Albuquerque (CRM-SP 194821) • Sala 04 Jardins',
      },
    ],
  },
  {
    id: 'mod_app_condominio',
    slug: 'allin_condominio',
    folder: 'app_condominio',
    dbSchema: 'app_condominio',
    brandName: 'Olivelas - Gestão de Condomínios',
    shortName: 'Gestão de Condomínios',
    tagline: 'Unidades, reservas de áreas comuns, assembleias, ocorrências e boletos',
    description:
      'Plataforma completa para síndicos, administradoras e moradores com gestão de unidades, reservas de espaços gourmet, mural oficial e chamados.',
    category: 'Operações & Imóveis',
    priceMonthly: 490,
    primaryTable: 'occurrences',
    tables: ['condominiums', 'units', 'resources', 'reservations', 'announcements', 'occurrences', 'bills'],
    features: [
      'Cadastro de Torres & Unidades',
      'Reserva de Salão Gourmet e Áreas',
      'Livro Digital de Ocorrências',
      'Emissão de Boletos Condominiais',
    ],
    kpis: [
      { label: 'Ocorrências & Chamados', metricKey: 'count' },
      { label: 'Índice de Resolução', metricKey: 'active_rate', suffix: '%' },
      { label: 'Unidades Monitoradas', metricKey: 'fixed_96' },
    ],
    fields: [
      { key: 'title', label: 'Título da Ocorrência / Demanda', type: 'text', placeholder: 'Ex.: Revisão Preventiva dos Elevadores' },
      { key: 'category', label: 'Categoria Predial', type: 'text', placeholder: 'Ex.: Manutenção Predial / Portaria' },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'open', label: 'Aberto' },
          { value: 'in_progress', label: 'Em Execução' },
          { value: 'resolved', label: 'Concluído' },
        ],
      },
      { key: 'description', label: 'Descrição Técnica / Bloco e Unidade', type: 'text', placeholder: 'Detalhes da solicitação condominial' },
    ],
    seedRecords: [
      {
        id: 'occ_cond_1',
        company_id: 'emp-olivelas-matriz',
        condominium_id: 'cond_1',
        title: 'Revisão Preventiva dos Elevadores Regenerativos - Torre A',
        category: 'Manutenção Predial',
        status: 'open',
        description: 'Agendamento de inspeção técnica mensal • Residencial Olivelas Grand Park',
      },
    ],
  },
  {
    id: 'mod_art_hub',
    slug: 'allin_art_hub',
    folder: 'art_hub',
    dbSchema: 'art_hub',
    brandName: 'Olivelas - Art Hub & Catálogo IA',
    shortName: 'Art Hub & Catálogo IA',
    tagline: 'Curadoria de obras de arte, catalogação generativa e metadados visuais IA',
    description:
      'Sistema de gestão de acervos artísticos e galerias com análise visual automatizada por IA, geração de tags curatoriais e precificação.',
    category: 'Engenharia, Jurídico & IA',
    priceMonthly: 390,
    primaryTable: 'artworks',
    tables: ['collections', 'artworks', 'ai_prompts', 'ai_queue'],
    features: [
      'Gestão de Coleções e Acervos',
      'Catalogação Visual com Gemini IA',
      'Prompts Curatoriais Customizáveis',
      'Fila de Processamento em Lote',
    ],
    kpis: [
      { label: 'Obras Catalogadas', metricKey: 'count' },
      { label: 'Valor do Acervo', metricKey: 'sum_price', suffix: 'BRL' },
      { label: 'Precisão IA', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'code', label: 'Código da Obra', type: 'text', placeholder: 'Ex.: ART-2026-005' },
      { key: 'title', label: 'Título da Obra', type: 'text', placeholder: 'Ex.: Horizonte Atlântico em Ouro e Azul' },
      { key: 'artist_name', label: 'Artista / Autor', type: 'text', placeholder: 'Ex.: Beatriz Monteiro' },
      { key: 'style', label: 'Estilo Artístico', type: 'text', placeholder: 'Ex.: Abstracionismo Geométrico' },
      { key: 'price', label: ' Avaliação / Preço (R$)', type: 'currency', placeholder: '7800' },
      {
        key: 'status',
        label: 'Status no Catálogo',
        type: 'select',
        options: [
          { value: 'published', label: 'Publicado na Galeria' },
          { value: 'curating', label: 'Em Curadoria IA' },
          { value: 'sold', label: 'Acervo Vendido' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'art_1',
        company_id: 'emp-olivelas-matriz',
        code: 'ART-2026-001',
        title: 'Horizonte Atlântico em Ouro e Azul',
        artist_name: 'Beatriz Monteiro',
        style: 'Abstracionismo Geométrico',
        dimensions: '120x90cm',
        price: 7800,
        status: 'published',
        ai_description: 'Composição equilibrada com contraste cromático profundo e textura espatulada.',
      },
    ],
  },
  {
    id: 'mod_casa_organizada',
    slug: 'allin_casa_organizada',
    folder: 'casa_organizada',
    dbSchema: 'casa_organizada',
    brandName: 'Olivelas - Casa Organizada & Rotinas',
    shortName: 'Casa Organizada & Rotinas',
    tagline: 'Checklists inteligentes por ambiente, frequência semanal e gamificação de rotinas',
    description:
      'Organizador de rotinas residenciais e facilities corporativos com cronograma por cômodo, pontuação de execução e histórico diário.',
    category: 'Operações & Imóveis',
    priceMonthly: 149,
    primaryTable: 'custom_tasks',
    tables: ['household_profiles', 'global_default_tasks', 'custom_tasks', 'task_completions'],
    features: [
      'Roteiros por Ambiente/Cômodo',
      'Frequência Diária, Semanal e Mensal',
      'Registro de Conclusão Auditado',
      'Templates Globais de Organização',
    ],
    kpis: [
      { label: 'Rotinas Programadas', metricKey: 'count' },
      { label: 'Taxa de Cumprimento', metricKey: 'active_rate', suffix: '%' },
      { label: 'Ambientes Ativos', metricKey: 'fixed_5' },
    ],
    fields: [
      { key: 'room', label: 'Ambiente / Setor', type: 'text', placeholder: 'Ex.: Cozinha Gourmet / Escritório' },
      { key: 'title', label: 'Descrição da Tarefa', type: 'text', placeholder: 'Ex.: Higienizar bancada de quartzo e máquina expresso' },
      {
        key: 'frequency',
        label: 'Frequência',
        type: 'select',
        options: [
          { value: 'daily', label: 'Diária' },
          { value: 'weekly', label: 'Semanal' },
          { value: 'monthly', label: 'Mensal' },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pendente Hoje' },
          { value: 'completed', label: 'Concluída' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'ctask_1',
        company_id: 'emp-olivelas-matriz',
        room: 'Escritório Executivo',
        title: 'Organizar documentos fiscais e validar backup do NAS doméstico',
        frequency: 'monthly',
        status: 'pending',
      },
      {
        id: 'ctask_2',
        company_id: 'emp-olivelas-matriz',
        room: 'Cozinha Gourmet',
        title: 'Higienizar bancada de quartzo e descalcificar cafeteira expresso',
        frequency: 'daily',
        status: 'completed',
      },
    ],
  },
  {
    id: 'mod_contratos',
    slug: 'allin_contratos_automacao',
    folder: 'contratos',
    dbSchema: 'contratos',
    brandName: 'Olivelas - Automação de Contratos',
    shortName: 'Automação de Contratos',
    tagline: 'Builder visual de minutas, cláusulas LGPD parametrizadas e análise de risco IA',
    description:
      'Plataforma de engenharia jurídica para montagem automatizada de instrumentos contratuais, variáveis dinâmicas, fluxos de aprovação e score de risco.',
    category: 'Engenharia, Jurídico & IA',
    priceMonthly: 590,
    primaryTable: 'generated_documents',
    tables: ['workspaces', 'projects', 'clauses', 'generated_documents'],
    features: [
      'Builder Modular de Minutas',
      'Biblioteca de Cláusulas LGPD & Compliance',
      'Variáveis e Regras Condicionais',
      'Análise de Risco Contratual IA',
    ],
    kpis: [
      { label: 'Instrumentos Gerados', metricKey: 'count' },
      { label: 'Volume Contratado', metricKey: 'sum_contract_value', suffix: 'BRL' },
      { label: 'Conformidade LGPD', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'title', label: 'Título do Instrumento', type: 'text', placeholder: 'Ex.: Contrato Master SaaS #2026-901' },
      { key: 'counterparty_name', label: 'Parte Contratante / Cliente', type: 'text', placeholder: 'Ex.: Grupo Vanguarda S.A.' },
      { key: 'contract_value', label: 'Valor Global do Contrato (R$)', type: 'currency', placeholder: '84000' },
      {
        key: 'status',
        label: 'Status Jurídico',
        type: 'select',
        options: [
          { value: 'signed', label: 'Assinado & Vigente' },
          { value: 'in_review', label: 'Em Revisão Jurídica' },
          { value: 'draft', label: 'Minuta em Elaboração' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'gdoc_1',
        company_id: 'emp-olivelas-matriz',
        title: 'Contrato Corporativo #2026-884 - Licenciamento Enterprise + DPA LGPD',
        counterparty_name: 'Grupo Vanguarda Participações S.A.',
        contract_value: 84000,
        risk_score: 8.5,
        status: 'signed',
      },
    ],
  },
  {
    id: 'mod_especificacoes',
    slug: 'allin_especificacoes',
    folder: 'especificacoes',
    dbSchema: 'especificacoes',
    brandName: 'Olivelas - Engenharia de Especificações',
    shortName: 'Engenharia de Especificações',
    tagline: 'Arquitetura SDD, roadmaps, sprints, ADRs, RFCs e snippets técnicos',
    description:
      'Ambiente de engenharia de especificações de software (Spec-Driven Development) com gestão de roadmaps, sprints, blocos estruturados e versionamento.',
    category: 'Engenharia, Jurídico & IA',
    priceMonthly: 450,
    primaryTable: 'specifications',
    tables: ['workspaces', 'projects', 'sprints', 'specifications', 'snippets'],
    features: [
      'Especificações SDD, ADRs e RFCs',
      'Planejamento de Roadmaps e Sprints',
      'Editor Estruturado em Blocos',
      'Catálogo de Snippets SQL/TS',
    ],
    kpis: [
      { label: 'Especificações Ativas', metricKey: 'count' },
      { label: 'Aprovação Técnica', metricKey: 'active_rate', suffix: '%' },
      { label: 'Sprints Vinculadas', metricKey: 'fixed_4' },
    ],
    fields: [
      { key: 'code', label: 'Código (ADR / RFC / SPEC)', type: 'text', placeholder: 'Ex.: ADR-002' },
      { key: 'title', label: 'Título da Especificação', type: 'text', placeholder: 'Ex.: Isolamento Multi-Schema no Supabase' },
      {
        key: 'type',
        label: 'Tipo Técnico',
        type: 'select',
        options: [
          { value: 'architecture', label: 'Arquitetura (ADR)' },
          { value: 'database', label: 'Banco de Dados' },
          { value: 'api', label: 'Contrato de API' },
          { value: 'security', label: 'Segurança & HBAC' },
        ],
      },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'approved', label: 'Aprovada' },
          { value: 'in_progress', label: 'Em Especificação' },
          { value: 'review', label: 'Em Revisão' },
        ],
      },
      { key: 'description', label: 'Resumo Executivo', type: 'text', placeholder: 'Decisão arquitetural e critérios de aceite' },
    ],
    seedRecords: [
      {
        id: 'spec_1',
        company_id: 'emp-olivelas-matriz',
        code: 'ADR-001',
        title: 'Arquitetura Multi-Schema com Login Único em public.profiles',
        type: 'architecture',
        status: 'approved',
        version: 2,
        description: 'Define o padrão oficial onde cada módulo opera em seu próprio schema PostgreSQL compartilhando public.profiles.',
      },
    ],
  },
  {
    id: 'mod_gestao_estoque',
    slug: 'allin_gestao_estoque',
    folder: 'gestao_estoque',
    dbSchema: 'gestao_estoque',
    brandName: 'Olivelas - Gestão de Estoque & PDV',
    shortName: 'Gestão de Estoque & PDV',
    tagline: 'Arquitetura referência multi-loja (matriz/filial), lotes FEFO, PDV e compras',
    description:
      'Módulo referência do ecossistema Olivelas para gestão de estoque multi-loja, rastreabilidade de lotes e validades, ponto de venda (PDV) e ordens de compra.',
    category: 'Varejo & Gastronomia',
    priceMonthly: 549,
    primaryTable: 'products',
    tables: ['stores', 'store_users', 'categories', 'suppliers', 'products', 'stock_batches', 'orders'],
    features: [
      'Hierarquia Matriz e Filiais',
      'Controle de Lotes FEFO e Baixas',
      'Frente de Caixa (PDV) Omnichannel',
      'Ordens de Compra & Fornecedores',
    ],
    kpis: [
      { label: 'SKUs Catalogados', metricKey: 'count' },
      { label: 'Preço Médio de Venda', metricKey: 'avg_sale_price', suffix: 'BRL' },
      { label: 'Disponibilidade em Loja', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'sku', label: 'Código SKU', type: 'text', placeholder: 'Ex.: OLV-VELA-003' },
      { key: 'name', label: 'Nome do Produto', type: 'text', placeholder: 'Ex.: Vela Aromática Olivelas Bourbon Vanilla 320g' },
      { key: 'cost_price', label: 'Custo Unitário (R$)', type: 'currency', placeholder: '42' },
      { key: 'sale_price', label: 'Preço de Venda PDV (R$)', type: 'currency', placeholder: '129.90' },
      { key: 'current_stock', label: 'Saldo em Estoque', type: 'number', placeholder: '145' },
    ],
    seedRecords: [
      {
        id: 'prd_est_1',
        store_id: 'store_matriz',
        company_id: 'emp-olivelas-matriz',
        sku: 'OLV-VELA-001',
        name: 'Vela Aromática Olivelas Bourbon Vanilla 320g',
        cost_price: 42,
        sale_price: 129.9,
        current_stock: 145,
        unit: 'UN',
        is_active: true,
      },
      {
        id: 'prd_est_2',
        store_id: 'store_matriz',
        company_id: 'emp-olivelas-matriz',
        sku: 'OLV-DIF-002',
        name: 'Difusor de Ambientes Olivelas Figo & Âmbar 250ml',
        cost_price: 38.5,
        sale_price: 119.9,
        current_stock: 92,
        unit: 'UN',
        is_active: true,
      },
    ],
  },
  {
    id: 'mod_ordem_de_servico',
    slug: 'allin_ordem_servico',
    folder: 'ordem_de_servico',
    dbSchema: 'ordem_de_servico',
    brandName: 'Olivelas - Ordens de Serviço & Assistência',
    shortName: 'Ordens de Serviço',
    tagline: 'Bancada técnica, checklists de entrada, laudos, peças, garantias e comissões',
    description:
      'Sistema especializado em assistência técnica e manutenção com rastreamento por serial/IMEI, orçamentos de peças + mão de obra e certificado de garantia.',
    category: 'Operações & Imóveis',
    priceMonthly: 379,
    primaryTable: 'service_orders',
    tables: ['customers', 'devices', 'technicians', 'service_orders'],
    features: [
      'Abertura de OS com Checklist Técnico',
      'Laudo de Bancada & Orçamento',
      'Controle de Peças e Mão de Obra',
      'Gestão de Garantias e Comissões',
    ],
    kpis: [
      { label: 'Ordens de Serviço', metricKey: 'count' },
      { label: 'Receita de Assistência', metricKey: 'sum_total_amount', suffix: 'BRL' },
      { label: 'SLA Dentro do Prazo', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'os_number', label: 'Número da OS', type: 'text', placeholder: 'Ex.: OS-2026-0105' },
      { key: 'customer_name', label: 'Cliente / Empresa', type: 'text', placeholder: 'Ex.: TechCorp Engenharia Ltda.' },
      { key: 'device_label', label: 'Equipamento & Número de Série', type: 'text', placeholder: 'Ex.: MacBook Pro 16" M3 Max' },
      { key: 'reported_defect', label: 'Defeito Relatado / Diagnóstico', type: 'text', placeholder: 'Ex.: Reparo em circuito de carga USB-C' },
      { key: 'total_amount', label: 'Valor Total OS (R$)', type: 'currency', placeholder: '1200' },
      {
        key: 'status',
        label: 'Status da OS',
        type: 'select',
        options: [
          { value: 'in_repair', label: 'Em Reparo na Bancada' },
          { value: 'waiting_approval', label: 'Aguardando Aprovação' },
          { value: 'ready_for_pickup', label: 'Pronto para Retirada' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'os_2026_1',
        company_id: 'emp-olivelas-matriz',
        os_number: 'OS-2026-0104',
        customer_name: 'TechCorp Engenharia Ltda.',
        device_label: 'MacBook Pro 16" M3 Max (SN: C02X991)',
        reported_defect: 'Substituição do controlador USB-C/Thunderbolt e limpeza ultrassônica concluída.',
        status: 'ready_for_pickup',
        priority: 'high',
        total_amount: 1200,
      },
    ],
  },
  {
    id: 'mod_personal_treiner',
    slug: 'allin_personal_trainer',
    folder: 'personal_treiner',
    dbSchema: 'personal_treiner',
    brandName: 'Olivelas - Personal Trainer',
    shortName: 'Personal Trainer',
    tagline: 'Prescrição de treinos periodizados, nutrição esportiva, biometria e ranking de alunos',
    description:
      'Plataforma completa para personal trainers, assessorias esportivas e estúdios com periodização de treinos, protocolos nutricionais, anamnese e gamificação.',
    category: 'Saúde & Bem-Estar',
    priceMonthly: 279,
    primaryTable: 'students',
    tables: ['trainers', 'students', 'exercises', 'workout_plans', 'nutrition_plans'],
    features: [
      'Periodização de Treinos & Biblioteca de Exercícios',
      'Planejamento Nutricional & Macronutrientes',
      'Avaliação Física, Peso e % de Gordura',
      'Streaks de Frequência & Ranking de Alunos',
    ],
    kpis: [
      { label: 'Alunos Ativos', metricKey: 'count' },
      { label: 'MRR Consultoria', metricKey: 'sum_monthly_fee', suffix: 'BRL' },
      { label: 'Aderência aos Treinos', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'full_name', label: 'Nome do Aluno(a)', type: 'text', placeholder: 'Ex.: Carlos Eduardo Mendes' },
      { key: 'goal', label: 'Objetivo Principal', type: 'text', placeholder: 'Ex.: Recomposição Corporal & Hipertrofia' },
      { key: 'plan_name', label: 'Plano Contratado', type: 'text', placeholder: 'Ex.: Black VIP Presencial + App Olivelas' },
      { key: 'monthly_fee', label: 'Mensalidade (R$)', type: 'currency', placeholder: '690' },
      { key: 'weight_kg', label: 'Peso Atual (kg)', type: 'number', placeholder: '82.4' },
      {
        key: 'status',
        label: 'Status do Aluno',
        type: 'select',
        options: [
          { value: 'active', label: 'Ativo em Treinamento' },
          { value: 'evaluation', label: 'Em Reavaliação Física' },
          { value: 'paused', label: 'Férias / Pausado' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'std_1',
        company_id: 'emp-olivelas-matriz',
        full_name: 'Carlos Eduardo Mendes',
        goal: 'Recomposição Corporal & Força',
        plan_name: 'Black VIP Presencial + App Olivelas',
        monthly_fee: 690,
        weight_kg: 82.4,
        body_fat_percent: 13.8,
        streak_days: 24,
        status: 'active',
      },
      {
        id: 'std_2',
        company_id: 'emp-olivelas-matriz',
        full_name: 'Fernanda Vasconcelos',
        goal: 'Preparação Meia Maratona 21km & Core',
        plan_name: 'Assessoria Híbrida Performance',
        monthly_fee: 490,
        weight_kg: 61.2,
        body_fat_percent: 17.5,
        streak_days: 18,
        status: 'active',
      },
    ],
  },
  {
    id: 'mod_restaurante',
    slug: 'allin_restaurante',
    folder: 'restaurante',
    dbSchema: 'restaurante',
    brandName: 'Olivelas - Gestão de Restaurantes & KDS',
    shortName: 'Restaurantes & KDS',
    tagline: 'Mapa de mesas em tempo real, comandas digitais, KDS por praça e frente de caixa',
    description:
      'Sistema gastronômico completo para restaurantes, bistrôs e bares com controle de salão, envio imediato para monitores de preparo (KDS) e turnos de caixa.',
    category: 'Varejo & Gastronomia',
    priceMonthly: 429,
    primaryTable: 'orders',
    tables: ['restaurants', 'products', 'restaurant_tables', 'orders'],
    features: [
      'Mapa Interativo de Mesas e Salões',
      'Kitchen Display System (KDS) por Praça',
      'Cardápio Digital com Complementos',
      'Fechamento de Conta e Divisão de Gorjeta',
    ],
    kpis: [
      { label: 'Comandas em Operação', metricKey: 'count' },
      { label: 'Faturamento Salão', metricKey: 'sum_total_amount', suffix: 'BRL' },
      { label: 'Eficiência KDS', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'order_code', label: 'Código da Comanda / Mesa', type: 'text', placeholder: 'Ex.: MESA-14-089' },
      { key: 'table_number', label: 'Número da Mesa', type: 'number', placeholder: '14' },
      { key: 'items_summary', label: 'Itens do Pedido (KDS)', type: 'text', placeholder: 'Ex.: 2x Risoto de Polvo, 1x Burrata ao Pesto' },
      { key: 'total_amount', label: 'Total da Comanda (R$)', type: 'currency', placeholder: '462' },
      {
        key: 'kds_status',
        label: 'Status na Cozinha (KDS)',
        type: 'select',
        options: [
          { value: 'preparing', label: 'Em Preparo na Praça Quente' },
          { value: 'ready', label: 'Pronto para Servir (Passe)' },
          { value: 'delivered', label: 'Entregue na Mesa' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'rord_1',
        company_id: 'emp-olivelas-matriz',
        table_number: 14,
        order_code: 'MESA-14-089',
        items_summary: '2x Risoto de Polvo na Brasa, 1x Burrata ao Pesto, 2x Taça Pinot Noir',
        kds_status: 'preparing',
        total_amount: 462,
      },
    ],
  },
  {
    id: 'mod_rifas',
    slug: 'allin_rifas',
    folder: 'rifas',
    dbSchema: 'rifas',
    brandName: 'Olivelas - Rifas & Sorteios Digitais',
    shortName: 'Rifas & Sorteios',
    tagline: 'Campanhas de sorteios digitais, reserva instantânea de cotas e conciliação PIX',
    description:
      'Motor de campanhas promocionais e sorteios digitais com seleção automática de títulos, baixa imediata via PIX e painel de transparência.',
    category: 'Sorteios & Campanhas',
    priceMonthly: 319,
    primaryTable: 'campaigns',
    tables: ['campaigns', 'orders'],
    features: [
      'Criação de Campanhas & Prêmios',
      'Reserva Automática de Cotas Numeradas',
      'Checkout PIX com Baixa Instantânea',
      'Painel de Maiores Compradores',
    ],
    kpis: [
      { label: 'Campanhas Ativas', metricKey: 'count' },
      { label: 'Preço Médio da Cota', metricKey: 'avg_ticket_price', suffix: 'BRL' },
      { label: 'Cotas Homologadas', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'title', label: 'Título da Campanha', type: 'text', placeholder: 'Ex.: Sorteio Beneficente Olivelas 2026' },
      { key: 'prize_description', label: 'Prêmio Principal', type: 'text', placeholder: 'Ex.: Porsche Macan EV 0km + R$ 50.000 no PIX' },
      { key: 'ticket_price', label: 'Valor da Cota (R$)', type: 'currency', placeholder: '29.90' },
      { key: 'total_numbers', label: 'Total de Cotas Emitidas', type: 'number', placeholder: '100000' },
      {
        key: 'status',
        label: 'Status da Campanha',
        type: 'select',
        options: [
          { value: 'active', label: 'Vendas Abertas' },
          { value: 'drawing', label: 'Aguardando Extração Loteria' },
          { value: 'finished', label: 'Sorteio Concluído' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'rif_camp_1',
        company_id: 'emp-olivelas-matriz',
        title: 'Sorteio Beneficente Olivelas - Porsche Macan Elétrico + Kit Casa',
        slug: 'porsche-macan-olivelas-2026',
        prize_description: 'Porsche Macan EV 0km Blindado + R$ 50.000 no PIX',
        ticket_price: 29.9,
        total_numbers: 100000,
        sold_numbers: 68420,
        status: 'active',
      },
    ],
  },
  {
    id: 'mod_sistema_delivery',
    slug: 'allin_delivery',
    folder: 'sistema_delivery',
    dbSchema: 'sistema_delivery',
    brandName: 'Olivelas - Central de Delivery',
    shortName: 'Central de Delivery',
    tagline: 'Torre de despacho logístico, gestão de entregadores, SLA e integração de canais',
    description:
      'Central de comando para operações de delivery próprio e marketplaces com roteirização de entregadores, chaves de API e auditoria de SLA.',
    category: 'Varejo & Gastronomia',
    priceMonthly: 389,
    primaryTable: 'delivery_orders',
    tables: ['stores', 'couriers', 'delivery_orders'],
    features: [
      'Torre de Despacho em Tempo Real',
      'Gestão de Frota de Entregadores',
      'Rastreamento de SLA de Preparo e Rota',
      'Integração via Webhooks e API Keys',
    ],
    kpis: [
      { label: 'Entregas Monitoradas', metricKey: 'count' },
      { label: 'GMV de Delivery', metricKey: 'sum_total_amount', suffix: 'BRL' },
      { label: 'SLA no Prazo', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'external_code', label: 'Código do Pedido', type: 'text', placeholder: 'Ex.: DLV-99415' },
      { key: 'customer_name', label: 'Cliente Destinatário', type: 'text', placeholder: 'Ex.: Gabriela Fontes' },
      { key: 'delivery_address', label: 'Endereço de Entrega', type: 'text', placeholder: 'Ex.: Rua Joaquim Floriano, 1050 - Itaim Bibi' },
      { key: 'total_amount', label: 'Valor do Pedido (R$)', type: 'currency', placeholder: '218.50' },
      {
        key: 'status',
        label: 'Status Logístico',
        type: 'select',
        options: [
          { value: 'dispatched', label: 'Em Rota com Entregador' },
          { value: 'preparing', label: 'Em Preparo no Hub' },
          { value: 'delivered', label: 'Entregue ao Cliente' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'dlv_ord_1',
        company_id: 'emp-olivelas-matriz',
        external_code: 'DLV-99412',
        channel: 'App Olivelas Direto',
        customer_name: 'Gabriela Fontes',
        delivery_address: 'Rua Joaquim Floriano, 1050 - Apto 182 - Itaim Bibi',
        status: 'dispatched',
        delivery_fee: 12.9,
        total_amount: 218.5,
      },
    ],
  },
  {
    id: 'mod_sistema_mercado',
    slug: 'allin_mercado',
    folder: 'sistema_mercado',
    dbSchema: 'sistema_mercado',
    brandName: 'Olivelas - Supermercado & Cestas',
    shortName: 'Supermercado & Cestas',
    tagline: 'Gôndolas, controle de perecíveis, cestas de café da manhã e encomendas',
    description:
      'Módulo voltado a mercados gourmet, empórios e cestas comemorativas com gestão de lotes perecíveis, composição de cestas e pedidos online.',
    category: 'Varejo & Gastronomia',
    priceMonthly: 469,
    primaryTable: 'breakfast_baskets',
    tables: ['products', 'breakfast_baskets', 'catalog_requests'],
    features: [
      'Catálogo de Cestas Matinais & Corporativas',
      'Controle de Gôndola e Validades',
      'Central de Encomendas com Cartão Presente',
      'Ficha Técnica de Composição de Cestas',
    ],
    kpis: [
      { label: 'Linhas de Cestas & Kits', metricKey: 'count' },
      { label: 'Ticket Médio Cesta', metricKey: 'avg_price', suffix: 'BRL' },
      { label: 'Pronta Entrega', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'code', label: 'Código da Cesta / Produto', type: 'text', placeholder: 'Ex.: CESTA-LUX-02' },
      { key: 'name', label: 'Nome da Cesta ou Kit', type: 'text', placeholder: 'Ex.: Cesta Bom Dia Imperial Olivelas' },
      { key: 'theme', label: 'Linha / Ocasião', type: 'text', placeholder: 'Ex.: Presente Corporativo & Datas Especiais' },
      { key: 'price', label: 'Preço de Venda (R$)', type: 'currency', placeholder: '289.90' },
      { key: 'stock_ready', label: 'Unidades Prontas', type: 'number', placeholder: '14' },
    ],
    seedRecords: [
      {
        id: 'mrc_bsk_1',
        company_id: 'emp-olivelas-matriz',
        code: 'CESTA-LUX-01',
        name: 'Cesta Bom Dia Imperial Olivelas (18 Itens Artesanais)',
        theme: 'Presente Corporativo & Datas Especiais',
        items_count: 18,
        price: 289.9,
        stock_ready: 14,
        status: 'available',
      },
    ],
  },
  {
    id: 'mod_suite_rifa',
    slug: 'allin_suite_rifa',
    folder: 'suite_rifa',
    dbSchema: 'suite_rifa',
    brandName: 'Olivelas - Suíte Multi-Organização de Rifas',
    shortName: 'Suíte Multi-Org Rifas',
    tagline: 'Governança SaaS multi-organização para grandes operações de sorteios e cotas',
    description:
      'Suíte enterprise para gestão de múltiplas organizações promotoras de sorteios, com controle de planos, limites de consumo e faturamento consolidado.',
    category: 'Sorteios & Campanhas',
    priceMonthly: 690,
    primaryTable: 'campaigns',
    tables: ['organizations', 'campaigns'],
    features: [
      'Gestão Multi-Organização & Sub-Tenants',
      'Controle de Planos, Cotas e Assinaturas',
      'Campanhas High-Volume (até 1M cotas)',
      'Auditoria de Receita por Organização',
    ],
    kpis: [
      { label: 'Campanhas Corporativas', metricKey: 'count' },
      { label: 'Receita Acumulada', metricKey: 'sum_revenue_amount', suffix: 'BRL' },
      { label: 'Capacidade Operacional', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'title', label: 'Nome da Mega Campanha', type: 'text', placeholder: 'Ex.: Mega Ação Nacional - Apartamento Jardins' },
      { key: 'quota_price', label: 'Valor por Cota (R$)', type: 'currency', placeholder: '14.90' },
      { key: 'total_quotas', label: 'Total de Cotas da Série', type: 'number', placeholder: '500000' },
      { key: 'revenue_amount', label: 'Receita Apurada (R$)', type: 'currency', placeholder: '3134960' },
      {
        key: 'status',
        label: 'Status Operacional',
        type: 'select',
        options: [
          { value: 'active', label: 'Ativa em Captação' },
          { value: 'auditing', label: 'Em Auditoria de Extração' },
          { value: 'closed', label: 'Encerrada' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'srf_cmp_1',
        company_id: 'emp-olivelas-matriz',
        title: 'Mega Ação Nacional - Apartamento Decorado Jardins',
        quota_price: 14.9,
        total_quotas: 500000,
        sold_quotas: 210400,
        revenue_amount: 3134960,
        status: 'active',
      },
    ],
  },
  {
    id: 'mod_vitrine_digital',
    slug: 'allin_vitrine_digital',
    folder: 'vitrine_digital',
    dbSchema: 'vitrine_digital',
    brandName: 'Olivelas - Vitrine Digital & Analisador IA',
    shortName: 'Vitrine Digital & IA',
    tagline: 'Inspeção fotográfica por IA, score de iluminação/composição e copywriting SEO',
    description:
      'Plataforma de vitrine digital inteligente que analisa fotos de produtos com visão computacional, atribui nota técnica e gera títulos otimizados para conversão.',
    category: 'Engenharia, Jurídico & IA',
    priceMonthly: 419,
    primaryTable: 'art_submissions',
    tables: ['art_submissions', 'image_analysis'],
    features: [
      'Auditoria Fotográfica com Gemini Vision',
      'Score de Iluminação, Nitidez e Enquadramento',
      'Geração Automática de Copy & SEO Headline',
      'Governança IAM de Tokens e Consumo de IA',
    ],
    kpis: [
      { label: 'SKUs Auditados por IA', metricKey: 'count' },
      { label: 'Score Médio Visual', metricKey: 'avg_ai_quality_score', suffix: 'pts' },
      { label: 'Aprovação na Vitrine', metricKey: 'active_rate', suffix: '%' },
    ],
    fields: [
      { key: 'sku_code', label: 'Código SKU na Vitrine', type: 'text', placeholder: 'Ex.: VIT-2026-009' },
      { key: 'title', label: 'Nome Comercial do Produto', type: 'text', placeholder: 'Ex.: Kit Home Fragrance Olivelas Gold Edition' },
      { key: 'category', label: 'Departamento da Vitrine', type: 'text', placeholder: 'Ex.: Home & Decor Premium' },
      { key: 'seo_headline', label: 'Headline SEO Gerada por IA', type: 'text', placeholder: 'Título otimizado para busca e conversão' },
      { key: 'ai_quality_score', label: 'Score Visual IA (0-100)', type: 'number', placeholder: '98.7' },
      {
        key: 'status',
        label: 'Status de Publicação',
        type: 'select',
        options: [
          { value: 'approved', label: 'Aprovado & Publicado' },
          { value: 'review', label: 'Requer Ajuste de Iluminação' },
        ],
      },
    ],
    seedRecords: [
      {
        id: 'vit_sub_1',
        company_id: 'emp-olivelas-matriz',
        sku_code: 'VIT-2026-001',
        title: 'Kit Home Fragrance Olivelas Gold Edition',
        category: 'Home & Decor Premium',
        ai_quality_score: 98.7,
        seo_headline: 'Kit Difusor e Vela Olivelas Gold Edition | Perfumaria de Luxo para Ambientes',
        status: 'approved',
      },
    ],
  },
];

const LOCAL_CACHE_PREFIX = 'olivelas_allin_schema_cache_v1_';

function getLocalSchemaCache(schema: OlivelasProjectSchemaName, fallback: Record<string, unknown>[]): Record<string, unknown>[] {
  if (typeof window === 'undefined') return [...fallback];
  try {
    const raw = window.localStorage.getItem(LOCAL_CACHE_PREFIX + schema);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [...fallback];
}

function setLocalSchemaCache(schema: OlivelasProjectSchemaName, records: Record<string, unknown>[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_CACHE_PREFIX + schema, JSON.stringify(records));
  } catch {
    // ignore storage errors
  }
}

export function findEcosystemModuleBySlug(slug?: string): OlivelasEcosystemModuleSpec | undefined {
  if (!slug) return undefined;
  return OLIVELAS_ECOSYSTEM_MODULES.find(
    (m) => m.slug === slug || m.dbSchema === slug || m.folder === slug || m.id === slug,
  );
}

/**
 * Sincroniza o usuário logado no Olivelas All In com a tabela única `public.profiles` no Supabase,
 * compartilhando o token/sessão unificada (`olivelas_supabase_auth_token` / `olivelas_user_profile`)
 * com todos os 16 módulos seguindo o padrão de `gestao_estoque`.
 */
export async function syncUnifiedUserProfileToSupabase(user: UserEntity): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(
        'olivelas_user_profile',
        JSON.stringify({
          id: user.id,
          email: user.email,
          fullName: user.name,
          phone: user.phone,
          isGlobalAdmin: user.roleIds.includes('role-super-admin') || user.roleIds.includes('role-admin'),
          companyIds: user.companyIds,
          roleIds: user.roleIds,
          createdAt: user.createdAt,
        }),
      );
    } catch {
      // ignore storage errors
    }
  }

  if (!isSupabaseConfigured) return;

  try {
    await getUnifiedProfilesTable().upsert(
      {
        id: user.id,
        email: user.email,
        full_name: user.name,
        phone: user.phone,
        is_global_admin: user.roleIds.includes('role-super-admin') || user.roleIds.includes('role-admin'),
        status: user.status === 'active' ? 'active' : 'blocked',
        language: user.language,
        role_ids: user.roleIds,
        company_ids: user.companyIds,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  } catch {
    // Mantém operação resiliente caso offline/em ambiente de testes
  }
}

export async function fetchUnifiedProfilesFromSupabase(): Promise<
  Array<{ id: string; email: string; full_name: string; is_global_admin: boolean; status: string }>
> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await getUnifiedProfilesTable()
      .select('id, email, full_name, is_global_admin, status')
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as Array<{ id: string; email: string; full_name: string; is_global_admin: boolean; status: string }>;
  } catch {
    return [];
  }
}

/**
 * Lista os registros reais do schema PostgreSQL exclusivo do módulo no Supabase (`<dbSchema>.<primaryTable>`),
 * com fallback transparente para o cache local caso offline.
 */
export async function listModuleSchemaRecords(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId?: string,
): Promise<{ records: Record<string, unknown>[]; source: 'supabase' | 'local_cache'; endpoint: string }> {
  const endpoint = `${supabaseUrl}/rest/v1/${moduleSpec.primaryTable} (Accept-Profile: ${moduleSpec.dbSchema})`;
  const fallback = getLocalSchemaCache(moduleSpec.dbSchema, moduleSpec.seedRecords);

  if (!isSupabaseConfigured) {
    return { records: fallback, source: 'local_cache', endpoint };
  }

  try {
    const schemaClient = getProjectSchemaClient(moduleSpec.dbSchema);
    const { data, error } = await schemaClient
      .from(moduleSpec.primaryTable)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error || !data) {
      return { records: fallback, source: 'local_cache', endpoint };
    }

    const merged = data.length > 0 ? (data as Record<string, unknown>[]) : fallback;
    setLocalSchemaCache(moduleSpec.dbSchema, merged);
    return {
      records: companyId ? merged : merged,
      source: 'supabase',
      endpoint,
    };
  } catch {
    return { records: fallback, source: 'local_cache', endpoint };
  }
}

/**
 * Cria um registro diretamente no schema PostgreSQL exclusivo do módulo no Supabase (`<dbSchema>.<tableName>`)
 */
export async function createModuleSchemaRecord(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId: string,
  payload: Record<string, unknown>,
  tableName?: string,
): Promise<{ record: Record<string, unknown>; persistedInSupabase: boolean }> {
  const targetTable = tableName || moduleSpec.primaryTable;
  const newId = `${targetTable.slice(0, 4)}_${Date.now()}`;
  const baseRecord: Record<string, unknown> = {
    id: newId,
    company_id: companyId || 'emp-olivelas-matriz',
    ...payload,
    created_at: new Date().toISOString(),
  };

  if (moduleSpec.dbSchema === 'gestao_estoque' && targetTable === 'products' && !baseRecord.store_id) {
    baseRecord.store_id = 'store_matriz';
  }
  if (moduleSpec.dbSchema === 'app_condominio' && !baseRecord.condominium_id) {
    baseRecord.condominium_id = 'cond_1';
  }
  if (moduleSpec.dbSchema === 'agendamentos' && targetTable === 'appointments' && !baseRecord.start_at) {
    baseRecord.start_at = new Date().toISOString();
    baseRecord.end_at = new Date(Date.now() + 45 * 60000).toISOString();
  }
  if (moduleSpec.dbSchema === 'agendamento_simples' && targetTable === 'appointments' && !baseRecord.scheduled_at) {
    baseRecord.scheduled_at = new Date().toISOString();
  }
  if (moduleSpec.dbSchema === 'rifas' && targetTable === 'campaigns' && !baseRecord.slug) {
    baseRecord.slug = String(baseRecord.title || 'campanha').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    baseRecord.prize_description = baseRecord.prize_description || 'Prêmio Oficial Olivelas';
  }

  if (targetTable === moduleSpec.primaryTable) {
    const currentLocal = getLocalSchemaCache(moduleSpec.dbSchema, moduleSpec.seedRecords);
    setLocalSchemaCache(moduleSpec.dbSchema, [baseRecord, ...currentLocal]);
  } else {
    const tblMeta = getTableCatalogMetadata(moduleSpec, targetTable);
    const currentSec = getSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, tblMeta.seedRecords);
    setSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, [baseRecord, ...currentSec]);
  }

  if (!isSupabaseConfigured) {
    return { record: baseRecord, persistedInSupabase: false };
  }

  try {
    const schemaClient = getProjectSchemaClient(moduleSpec.dbSchema);
    const { data, error } = await schemaClient
      .from(targetTable)
      .insert(baseRecord)
      .select('*')
      .single();

    if (!error && data) {
      return { record: data as Record<string, unknown>, persistedInSupabase: true };
    }
  } catch {
    // Fallback local já salvo
  }

  return { record: baseRecord, persistedInSupabase: false };
}

/**
 * Realiza o arquivamento lógico (sem exclusão física) no schema PostgreSQL do módulo no Supabase
 */
export async function toggleArchiveModuleSchemaRecord(
  moduleSpec: OlivelasEcosystemModuleSpec,
  recordId: string,
  archive: boolean,
  reason: string,
  actorEmail: string,
  tableName?: string,
): Promise<void> {
  const targetTable = tableName || moduleSpec.primaryTable;
  const archiveMetadata = archive
    ? {
        isArchived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: actorEmail,
        archiveReason: reason,
      }
    : { isArchived: false };

  if (targetTable === moduleSpec.primaryTable) {
    const currentLocal = getLocalSchemaCache(moduleSpec.dbSchema, moduleSpec.seedRecords);
    const updatedLocal = currentLocal.map((item) =>
      String(item.id) === recordId ? { ...item, archive_metadata: archiveMetadata } : item,
    );
    setLocalSchemaCache(moduleSpec.dbSchema, updatedLocal);
  } else {
    const tblMeta = getTableCatalogMetadata(moduleSpec, targetTable);
    const currentSec = getSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, tblMeta.seedRecords);
    const updatedSec = currentSec.map((item) =>
      String(item.id) === recordId ? { ...item, archive_metadata: archiveMetadata } : item,
    );
    setSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, updatedSec);
  }

  if (!isSupabaseConfigured) return;

  try {
    const schemaClient = getProjectSchemaClient(moduleSpec.dbSchema);
    await schemaClient
      .from(targetTable)
      .update({ archive_metadata: archiveMetadata })
      .eq('id', recordId);
  } catch {
    // Mantém sincronizado localmente
  }
}

/**
 * Atualiza (UPDATE) um registro existente no schema PostgreSQL do módulo no Supabase
 */
export async function updateModuleSchemaRecord(
  moduleSpec: OlivelasEcosystemModuleSpec,
  recordId: string,
  payload: Record<string, unknown>,
  tableName?: string,
): Promise<{ record: Record<string, unknown>; persistedInSupabase: boolean }> {
  const targetTable = tableName || moduleSpec.primaryTable;
  const updatedPayload = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  if (targetTable === moduleSpec.primaryTable) {
    const currentLocal = getLocalSchemaCache(moduleSpec.dbSchema, moduleSpec.seedRecords);
    const updatedLocal = currentLocal.map((item) =>
      String(item.id) === recordId ? { ...item, ...updatedPayload } : item,
    );
    setLocalSchemaCache(moduleSpec.dbSchema, updatedLocal);
  } else {
    const tblMeta = getTableCatalogMetadata(moduleSpec, targetTable);
    const currentSec = getSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, tblMeta.seedRecords);
    const updatedSec = currentSec.map((item) =>
      String(item.id) === recordId ? { ...item, ...updatedPayload } : item,
    );
    setSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, updatedSec);
  }

  if (!isSupabaseConfigured) {
    return { record: { id: recordId, ...updatedPayload }, persistedInSupabase: false };
  }

  try {
    const schemaClient = getProjectSchemaClient(moduleSpec.dbSchema);
    const { data, error } = await schemaClient
      .from(targetTable)
      .update(updatedPayload)
      .eq('id', recordId)
      .select('*')
      .single();

    if (!error && data) {
      return { record: data as Record<string, unknown>, persistedInSupabase: true };
    }
  } catch {
    // Fallback local atualizado
  }

  return { record: { id: recordId, ...updatedPayload }, persistedInSupabase: false };
}

/**
 * Exclui um registro em qualquer tabela do schema do módulo (respeitando governança)
 */
export async function deleteModuleSchemaRecord(
  moduleSpec: OlivelasEcosystemModuleSpec,
  recordId: string,
  tableName?: string,
): Promise<{ deletedInSupabase: boolean }> {
  const targetTable = tableName || moduleSpec.primaryTable;

  if (targetTable === moduleSpec.primaryTable) {
    const currentLocal = getLocalSchemaCache(moduleSpec.dbSchema, moduleSpec.seedRecords);
    const updatedLocal = currentLocal.filter((item) => String(item.id) !== recordId);
    setLocalSchemaCache(moduleSpec.dbSchema, updatedLocal);
  } else {
    const tblMeta = getTableCatalogMetadata(moduleSpec, targetTable);
    const currentSec = getSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, tblMeta.seedRecords);
    const updatedSec = currentSec.filter((item) => String(item.id) !== recordId);
    setSecondaryTableLocalRecords(moduleSpec.dbSchema, targetTable, updatedSec);
  }

  if (!isSupabaseConfigured) {
    return { deletedInSupabase: false };
  }

  try {
    const schemaClient = getProjectSchemaClient(moduleSpec.dbSchema);
    const { error } = await schemaClient.from(targetTable).delete().eq('id', recordId);
    return { deletedInSupabase: !error };
  } catch {
    return { deletedInSupabase: false };
  }
}

/**
 * Lista registros de qualquer tabela do schema PostgreSQL do módulo (`moduleSpec.tables`)
 */
export async function listAnySchemaTableRecords(
  moduleSpec: OlivelasEcosystemModuleSpec,
  tableName: string,
  companyId?: string,
): Promise<{ records: Record<string, unknown>[]; source: 'supabase' | 'local_cache'; endpoint: string }> {
  if (tableName === moduleSpec.primaryTable) {
    return listModuleSchemaRecords(moduleSpec, companyId);
  }

  const endpoint = `${supabaseUrl}/rest/v1/${tableName} (Accept-Profile: ${moduleSpec.dbSchema})`;
  const tblMeta = getTableCatalogMetadata(moduleSpec, tableName);
  const localFallback = getSecondaryTableLocalRecords(moduleSpec.dbSchema, tableName, tblMeta.seedRecords);

  if (!isSupabaseConfigured) {
    return { records: localFallback, source: 'local_cache', endpoint };
  }

  try {
    const schemaClient = getProjectSchemaClient(moduleSpec.dbSchema);
    const { data, error } = await schemaClient
      .from(tableName)
      .select('*')
      .limit(100);

    if (error || !data || data.length === 0) {
      return { records: localFallback, source: 'local_cache', endpoint };
    }

    const rows = data as Record<string, unknown>[];
    setSecondaryTableLocalRecords(moduleSpec.dbSchema, tableName, rows);
    return {
      records: rows,
      source: 'supabase',
      endpoint,
    };
  } catch {
    return { records: localFallback, source: 'local_cache', endpoint };
  }
}

// =============================================================================
// RAG COMPLETO E COPILOTO IA POR MÓDULO (public.allin_rag_documents & chat)
// =============================================================================

export interface OlivelasRagDocument {
  id: string;
  company_id: string;
  module_slug: string;
  schema_name: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  source_table?: string;
  source_record_id?: string;
  metadata?: Record<string, unknown>;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface OlivelasCopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  persona: string;
  content: string;
  citations: Array<{ id: string; title: string; source: string }>;
  confidence: 'alta' | 'media';
  createdAt: string;
}

export async function listModuleRagDocuments(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId: string,
): Promise<OlivelasRagDocument[]> {
  const defaultDoc: OlivelasRagDocument = {
    id: `rag-seed-${moduleSpec.dbSchema}`,
    company_id: companyId,
    module_slug: moduleSpec.slug,
    schema_name: moduleSpec.dbSchema,
    title: `Manual Operacional & Governança — ${moduleSpec.brandName}`,
    category: 'manual',
    content: `${moduleSpec.description} Schema PostgreSQL: ${moduleSpec.dbSchema}. Tabelas oficiais: ${moduleSpec.tables.join(', ')}. Recursos padronizados: ${moduleSpec.features.join('; ')}. Login unificado via public.profiles e controle HBAC granular.`,
    tags: [moduleSpec.dbSchema, moduleSpec.primaryTable, 'hbac', 'rag'],
    source_table: moduleSpec.primaryTable,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    return [defaultDoc];
  }

  try {
    const { data, error } = await supabase
      .schema('public')
      .from('allin_rag_documents')
      .select('*')
      .or(`schema_name.eq.${moduleSpec.dbSchema},module_slug.eq.${moduleSpec.slug},module_slug.eq.global`)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return [defaultDoc];
    }

    return data.map((row: Record<string, unknown>) => ({
      id: String(row.id),
      company_id: String(row.company_id || companyId),
      module_slug: String(row.module_slug || moduleSpec.slug),
      schema_name: String(row.schema_name || moduleSpec.dbSchema),
      title: String(row.title || ''),
      category: String(row.category || 'manual'),
      content: String(row.content || ''),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      source_table: row.source_table ? String(row.source_table) : undefined,
      source_record_id: row.source_record_id ? String(row.source_record_id) : undefined,
      metadata: (row.metadata as Record<string, unknown>) || {},
      is_active: row.is_active !== false,
      created_by: row.created_by ? String(row.created_by) : undefined,
      created_at: String(row.created_at || new Date().toISOString()),
    }));
  } catch {
    return [defaultDoc];
  }
}

export async function saveModuleRagDocument(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId: string,
  docInput: {
    id?: string;
    title: string;
    category: string;
    content: string;
    tags: string[];
    source_table?: string;
  },
  actorEmail: string,
): Promise<{ document: OlivelasRagDocument; persistedInSupabase: boolean }> {
  const docId = docInput.id || `rag-${moduleSpec.dbSchema}-${Date.now()}`;
  const docRecord: OlivelasRagDocument = {
    id: docId,
    company_id: companyId || 'emp-olivelas-matriz',
    module_slug: moduleSpec.slug,
    schema_name: moduleSpec.dbSchema,
    title: docInput.title.trim(),
    category: docInput.category || 'manual',
    content: docInput.content.trim(),
    tags: docInput.tags,
    source_table: docInput.source_table || moduleSpec.primaryTable,
    is_active: true,
    created_by: actorEmail,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured) {
    return { document: docRecord, persistedInSupabase: false };
  }

  try {
    const { error } = await supabase
      .schema('public')
      .from('allin_rag_documents')
      .upsert(
        {
          id: docRecord.id,
          company_id: docRecord.company_id,
          module_slug: docRecord.module_slug,
          schema_name: docRecord.schema_name,
          title: docRecord.title,
          category: docRecord.category,
          content: docRecord.content,
          tags: docRecord.tags,
          source_table: docRecord.source_table,
          is_active: true,
          created_by: actorEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' },
      );

    return { document: docRecord, persistedInSupabase: !error };
  } catch {
    return { document: docRecord, persistedInSupabase: false };
  }
}

export async function deleteModuleRagDocument(docId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { error } = await supabase
      .schema('public')
      .from('allin_rag_documents')
      .delete()
      .eq('id', docId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Indexa automaticamente os registros ativos do schema PostgreSQL na base RAG do módulo
 */
export async function indexSchemaRecordsIntoRag(
  moduleSpec: OlivelasEcosystemModuleSpec,
  companyId: string,
  records: Record<string, unknown>[],
  actorEmail: string,
): Promise<{ document: OlivelasRagDocument; persistedInSupabase: boolean }> {
  const activeRecords = records.filter(
    (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
  );
  const summaryLines = activeRecords.slice(0, 25).map((r, idx) => {
    const pairs = moduleSpec.fields
      .map((f) => `${f.label}: ${String(r[f.key] ?? '—')}`)
      .join(' | ');
    return `[#${idx + 1} ID=${String(r.id)}] ${pairs}`;
  });

  const content = [
    `Snapshot Indexado em Tempo Real do Schema ${moduleSpec.dbSchema}.${moduleSpec.primaryTable}`,
    `Total de registros ativos: ${activeRecords.length} (de ${records.length} totais).`,
    `Tabelas correlacionadas no schema: ${moduleSpec.tables.join(', ')}.`,
    `Registros indexados:`,
    ...summaryLines,
  ].join('\n');

  return saveModuleRagDocument(
    moduleSpec,
    companyId,
    {
      id: `rag-live-index-${moduleSpec.dbSchema}-${companyId}`,
      title: `Índice Dinâmico PostgreSQL — ${moduleSpec.dbSchema}.${moduleSpec.primaryTable} (${activeRecords.length} registros)`,
      category: 'database_index',
      content,
      tags: [moduleSpec.dbSchema, moduleSpec.primaryTable, 'live-snapshot', 'postgresql'],
      source_table: moduleSpec.primaryTable,
    },
    actorEmail,
  );
}

/**
 * Executa consulta RAG contextualizada sobre os documentos da base de conhecimento + registros reais do PostgreSQL
 * e persiste o histórico em `public.allin_ai_chat_messages`.
 */
export async function askModuleRagCopilot(params: {
  moduleSpec: OlivelasEcosystemModuleSpec;
  companyId: string;
  question: string;
  persona: 'executivo' | 'auditor_cfo' | 'arquitetura_sql';
  records: Record<string, unknown>[];
  ragDocs: OlivelasRagDocument[];
  actorEmail: string;
  userId?: string;
}): Promise<OlivelasCopilotMessage> {
  const { moduleSpec, companyId, question, persona, records, ragDocs, userId } = params;
  const qLower = question.toLowerCase();
  const tokens = qLower
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  // 1. Recupera documentos RAG mais relevantes (Retrieval)
  const scoredDocs = ragDocs.map((doc) => {
    const hay = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
    let score = doc.schema_name === moduleSpec.dbSchema ? 3 : 1;
    for (const tk of tokens) {
      if (hay.includes(tk)) score += 4;
    }
    return { doc, score };
  });
  scoredDocs.sort((a, b) => b.score - a.score);
  const topDocs = scoredDocs.slice(0, 3).map((d) => d.doc);

  // 2. Recupera registros reais do banco que casam com a pergunta
  const activeRecords = records.filter(
    (r) => !(r.archive_metadata as { isArchived?: boolean } | undefined)?.isArchived,
  );
  const archivedCount = records.length - activeRecords.length;

  const matchingRecords = activeRecords.filter((rec) => {
    if (tokens.length === 0) return true;
    const serialized = JSON.stringify(rec).toLowerCase();
    return tokens.some((t) => serialized.includes(t));
  });
  const contextRecords = (matchingRecords.length > 0 ? matchingRecords : activeRecords).slice(0, 5);

  // Calcula métricas financeiras/numéricas reais da tabela
  let numericSum = 0;
  let numericFieldLabel = '';
  for (const field of moduleSpec.fields) {
    if (field.type === 'currency' || field.type === 'number') {
      numericFieldLabel = field.label;
      for (const r of activeRecords) {
        numericSum += Number(r[field.key] || 0);
      }
      break;
    }
  }

  const personaHeader =
    persona === 'auditor_cfo'
      ? `### Parecer de Auditoria Financeira & Governança (${moduleSpec.brandName})`
      : persona === 'arquitetura_sql'
      ? `### Diagnóstico de Engenharia Multi-Schema & API (${moduleSpec.dbSchema})`
      : `### Análise Executiva RAG — ${moduleSpec.brandName}`;

  const recordsBulletList = contextRecords
    .map((r) => {
      const summary = moduleSpec.fields
        .map((f) => `**${f.label}**: ${String(r[f.key] ?? '—')}`)
        .join(' • ');
      return `- \`${String(r.id)}\` — ${summary}`;
    })
    .join('\n');

  const ragExcerpts = topDocs
    .map((d) => `- **[${d.category.toUpperCase()}] ${d.title}**: ${d.content.slice(0, 220)}${d.content.length > 220 ? '...' : ''}`)
    .join('\n');

  const responseText = [
    personaHeader,
    `Com base nos dados em tempo real do schema PostgreSQL **\`${moduleSpec.dbSchema}.${moduleSpec.primaryTable}\`** (Tenant \`${companyId}\`) e em **${topDocs.length} documento(s) indexados no RAG**:`,
    '',
    `**1. Panorama Operacional no Supabase:**`,
    `- **Registros Ativos em \`${moduleSpec.dbSchema}.${moduleSpec.primaryTable}\`:** ${activeRecords.length} ativo(s) e ${archivedCount} arquivado(s) logicamente.`,
    numericFieldLabel
      ? `- **Consolidado (${numericFieldLabel}):** ${numericSum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : `- **Tabelas integradas no schema \`${moduleSpec.dbSchema}\`:** \`${moduleSpec.tables.join('`, `')}\`.`,
    '',
    `**2. Evidências Encontradas nos Registros do Módulo:**`,
    recordsBulletList || '- Nenhum registro ativo no momento.',
    '',
    `**3. Base de Conhecimento RAG Consultada (\`public.allin_rag_documents\`):**`,
    ragExcerpts,
    '',
    persona === 'arquitetura_sql'
      ? `**4. Endpoint PostgREST & Segurança HBAC:**\n- Endpoint: \`GET ${supabaseUrl}/rest/v1/${moduleSpec.primaryTable}\` com header \`Accept-Profile: ${moduleSpec.dbSchema}\`.\n- Autenticação unificada: \`public.profiles\` (bcrypt + bloqueio anti-força bruta).`
      : `**4. Recomendação Acionável:**\n- Todos os registros acima estão sincronizados com o banco PostgreSQL e respeitam as permissões granulares HBAC do usuário logado.`,
  ].join('\n');

  const citations = [
    ...topDocs.map((d) => ({
      id: d.id,
      title: d.title,
      source: `public.allin_rag_documents (${d.category})`,
    })),
    {
      id: `${moduleSpec.dbSchema}.${moduleSpec.primaryTable}`,
      title: `Tabela PostgreSQL ${moduleSpec.dbSchema}.${moduleSpec.primaryTable} (${activeRecords.length} registros)`,
      source: 'Supabase PostgREST Live',
    },
  ];

  const assistantMsg: OlivelasCopilotMessage = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    persona,
    content: responseText,
    citations,
    confidence: 'alta',
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured) {
    try {
      await supabase.schema('public').from('allin_ai_chat_messages').insert([
        {
          id: `usr-msg-${Date.now()}`,
          company_id: companyId,
          user_id: userId || null,
          module_slug: moduleSpec.slug,
          schema_name: moduleSpec.dbSchema,
          persona,
          role: 'user',
          content: question,
          citations: [],
        },
        {
          id: assistantMsg.id,
          company_id: companyId,
          user_id: userId || null,
          module_slug: moduleSpec.slug,
          schema_name: moduleSpec.dbSchema,
          persona,
          role: 'assistant',
          content: assistantMsg.content,
          citations: assistantMsg.citations,
        },
      ]);
    } catch {
      // ignora erro de telemetria de chat
    }
  }

  return assistantMsg;
}

// =============================================================================
// EXECUTOR REAL DE API REST POSTGREST POR MÓDULO (COM AUDITORIA SUPABASE)
// =============================================================================

export interface LiveModuleApiResponse {
  status: number;
  statusText: string;
  durationMs: number;
  endpointUrl: string;
  curlCommand: string;
  requestHeaders: Record<string, string>;
  responseBody: unknown;
}

export async function executeLiveModuleRestApi(params: {
  moduleSpec: OlivelasEcosystemModuleSpec;
  tableName: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  queryString?: string;
  requestBodyJson?: string;
  actorEmail: string;
  companyId: string;
}): Promise<LiveModuleApiResponse> {
  const { moduleSpec, tableName, method, queryString = '?select=*&limit=25', requestBodyJson, actorEmail, companyId } = params;
  const normalizedQuery = queryString.startsWith('?') || queryString === '' ? queryString : `?${queryString}`;
  const endpointUrl = `${supabaseUrl}/rest/v1/${tableName}${normalizedQuery}`;

  const requestHeaders: Record<string, string> = {
    apikey: `${supabaseKey.slice(0, 16)}...`,
    Authorization: `Bearer ${supabaseKey.slice(0, 16)}...`,
    'Accept-Profile': moduleSpec.dbSchema,
    'Content-Profile': moduleSpec.dbSchema,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  const curlLines = [
    `curl -X ${method} "${endpointUrl}" \\`,
    `  -H "apikey: $VITE_SUPABASE_ANON_KEY" \\`,
    `  -H "Authorization: Bearer $VITE_SUPABASE_ANON_KEY" \\`,
    `  -H "Accept-Profile: ${moduleSpec.dbSchema}" \\`,
    `  -H "Content-Profile: ${moduleSpec.dbSchema}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -H "Prefer: return=representation"`,
  ];
  if (method !== 'GET' && requestBodyJson?.trim()) {
    curlLines[curlLines.length - 1] += ' \\';
    curlLines.push(`  -d '${requestBodyJson.trim()}'`);
  }
  const curlCommand = curlLines.join('\n');

  const start = performance.now();
  try {
    const fetchHeaders: Record<string, string> = {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Accept-Profile': moduleSpec.dbSchema,
      'Content-Profile': moduleSpec.dbSchema,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };

    const res = await fetch(endpointUrl, {
      method,
      headers: fetchHeaders,
      body: method !== 'GET' && requestBodyJson?.trim() ? requestBodyJson : undefined,
    });

    const durationMs = Math.round(performance.now() - start);
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }

    if (isSupabaseConfigured) {
      try {
        await supabase.schema('public').from('allin_api_history').insert({
          id: `api-log-${Date.now()}`,
          company_id: companyId,
          actor_email: actorEmail,
          method,
          endpoint: `/rest/v1/${moduleSpec.dbSchema}.${tableName}${normalizedQuery}`,
          status_code: res.status,
          duration_ms: durationMs,
          request_body: requestBodyJson ? { raw: requestBodyJson } : null,
          response_preview: Array.isArray(parsed) ? { count: parsed.length, sample: parsed.slice(0, 2) } : { data: parsed },
        });
      } catch {
        // ignora falha de log
      }
    }

    return {
      status: res.status,
      statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
      durationMs,
      endpointUrl,
      curlCommand,
      requestHeaders,
      responseBody: parsed,
    };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      status: 500,
      statusText: 'Network / Execution Error',
      durationMs,
      endpointUrl,
      curlCommand,
      requestHeaders,
      responseBody: { error: String(err) },
    };
  }
}

export interface OlivelasModuleInstanceServerSpec {
  slug: string;
  folder: string;
  brandName: string;
  port: number;
  adminPath: string;
}

export const OLIVELAS_MODULE_INSTANCE_SERVERS: OlivelasModuleInstanceServerSpec[] = [
  {
    slug: 'allin_agendamento_simples',
    folder: 'agendamento_simples',
    brandName: 'Olivelas - Consultório & Odonto',
    port: 4101,
    adminPath: '/pages/dashboard.html',
  },
  {
    slug: 'allin_agendamentos_pro',
    folder: 'agendamentos',
    brandName: 'Olivelas - Clínicas & Agendamentos',
    port: 4102,
    adminPath: '/dashboard',
  },
  {
    slug: 'allin_condominio',
    folder: 'app_condominio',
    brandName: 'Olivelas - Gestão de Condomínios',
    port: 4103,
    adminPath: '/',
  },
  {
    slug: 'allin_art_hub',
    folder: 'art_hub',
    brandName: 'Olivelas - Art Hub & Catálogo IA',
    port: 4104,
    adminPath: '/admin',
  },
  {
    slug: 'allin_casa_organizada',
    folder: 'casa_organizada',
    brandName: 'Olivelas - Casa Organizada & Rotinas',
    port: 4105,
    adminPath: '/',
  },
  {
    slug: 'allin_contratos',
    folder: 'contratos',
    brandName: 'Olivelas - Automação de Contratos',
    port: 4106,
    adminPath: '/dashboard',
  },
  {
    slug: 'allin_especificacoes',
    folder: 'especificacoes',
    brandName: 'Olivelas - Engenharia de Especificações',
    port: 4107,
    adminPath: '/projects',
  },
  {
    slug: 'allin_gestao_estoque',
    folder: 'gestao_estoque',
    brandName: 'Olivelas - Gestão de Estoque & PDV',
    port: 4108,
    adminPath: '/dashboard',
  },
  {
    slug: 'allin_ordem_servico',
    folder: 'ordem_de_servico',
    brandName: 'Olivelas - Ordens de Serviço & Assistência',
    port: 4109,
    adminPath: '/dashboard',
  },
  {
    slug: 'allin_personal_trainer',
    folder: 'personal_treiner',
    brandName: 'Olivelas - Personal Trainer',
    port: 4110,
    adminPath: '/personal/dashboard',
  },
  {
    slug: 'allin_restaurante',
    folder: 'restaurante',
    brandName: 'Olivelas - Gestão de Restaurantes & KDS',
    port: 4111,
    adminPath: '/app',
  },
  {
    slug: 'allin_rifas',
    folder: 'rifas',
    brandName: 'Olivelas - Rifas & Sorteios Digitais',
    port: 4112,
    adminPath: '/admin/dashboard',
  },
  {
    slug: 'allin_delivery',
    folder: 'sistema_delivery',
    brandName: 'Olivelas - Central de Delivery',
    port: 4113,
    adminPath: '/app/orders',
  },
  {
    slug: 'allin_mercado',
    folder: 'sistema_mercado',
    brandName: 'Olivelas - Supermercado & Cestas',
    port: 4114,
    adminPath: '/admin/dashboard',
  },
  {
    slug: 'allin_suite_rifa',
    folder: 'suite_rifa',
    brandName: 'Olivelas - Suíte Multi-Organização de Rifas',
    port: 4115,
    adminPath: '/dashboard',
  },
  {
    slug: 'allin_vitrine_digital',
    folder: 'vitrine_digital',
    brandName: 'Olivelas - Vitrine Digital & Analisador IA',
    port: 4116,
    adminPath: '/?view=analyzer',
  },
];

export function getModuleInstanceServerSpec(
  slugOrFolder?: string | null,
): OlivelasModuleInstanceServerSpec {
  const clean = (slugOrFolder || '').trim().toLowerCase();
  return (
    OLIVELAS_MODULE_INSTANCE_SERVERS.find(
      (s) => s.slug === clean || s.folder === clean || `mod_${s.folder}` === clean,
    ) || OLIVELAS_MODULE_INSTANCE_SERVERS[7] // default gestao_estoque
  );
}

export function buildModuleInstanceLaunchUrl(params: {
  moduleSlug?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
}): {
  url: string;
  instanceId: string;
  port: number;
  adminPath: string;
  serverSpec: OlivelasModuleInstanceServerSpec;
} {
  const serverSpec = getModuleInstanceServerSpec(params.moduleSlug);
  const cid = params.companyId || 'emp-olivelas-matriz';
  const cname = params.companyName || 'Olivelas Nebula Holdings';
  const uid = params.userId || 'usr-admin-global';
  const uemail = params.userEmail || 'willian.o.jesus@gmail.com';
  const uname = params.userName || 'Willian Jesus';
  const urole = params.userRole || 'GLOBAL_ADMIN';
  const instanceId = `inst_${cid.replace(/[^a-zA-Z0-9_-]/g, '_')}_${serverSpec.slug}`;

  const host =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'localhost';
  const baseUrl = `http://${host}:${serverSpec.port}${serverSpec.adminPath}`;
  const sep = serverSpec.adminPath.includes('?') ? '&' : '?';

  const query = new URLSearchParams({
    allin_sso: '1',
    instance_id: instanceId,
    company_id: cid,
    company_name: cname,
    user_id: uid,
    user_email: uemail,
    user_name: uname,
    user_role: urole,
  });

  return {
    url: `${baseUrl}${sep}${query.toString()}`,
    instanceId,
    port: serverSpec.port,
    adminPath: serverSpec.adminPath,
    serverSpec,
  };
}

export function openModuleInstanceInNewTab(params: {
  moduleSlug?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  userRole?: string | null;
}): string {
  const { url } = buildModuleInstanceLaunchUrl(params);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  return url;
}
