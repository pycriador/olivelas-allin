export interface PageDoc {
  title: string;
  description: string;
  features?: string[];
  sections?: { title: string; content: string }[];
  relatedSprints?: string[];
}

export const PAGE_DOCS: Record<string, PageDoc> = {
  /* ─── HOME ─── */
  "/": {
    title: "ServiceForge Platform",
    description:
      "Plataforma completa de gestão de assistências técnicas. Gerencie ordens de serviço, clientes, equipamentos, estoque, finanças, documentos, comunicações e muito mais em um só lugar.",
    features: [
      "Dashboard executivo com visão geral da plataforma",
      "Gestão de múltiplas empresas com isolamento completo",
      "Sistema de módulos independentes e extensíveis",
      "Suporte a multi-idioma (PT-BR, EN, ES) e multi-tema",
      "Auditoria completa de todas as ações do sistema",
    ],
    relatedSprints: ["Sprint 1", "Sprint 7", "Sprint 24"],
  },

  /* ─── DASHBOARD ─── */
  "/dashboard": {
    title: "Dashboard Principal",
    description:
      "Visão geral da plataforma com informações da empresa, usuário logado, banco de dados ativo, provedor ativo, módulos carregados e versão do sistema.",
    features: ["Exibição da empresa ativa e dados do usuário", "Status do banco de dados e provedor", "Lista de módulos disponíveis"],
    relatedSprints: ["Sprint 1"],
  },

  /* ─── COMPANIES ─── */
  "/companies": {
    title: "Gestão de Empresas",
    description:
      "Gerencie múltiplas empresas associadas à plataforma. Crie, edite, ative/desative empresas e alterne entre elas.",
    features: ["CRUD completo de empresas", "Ativação/desativação de empresa", "Troca rápida entre empresas"],
    sections: [
      { title: "Dados da Empresa", content: "Logo, Razão Social, Nome Fantasia, CNPJ, IE, Telefone, WhatsApp, Email, Website, CEP, Endereço, Cidade, Estado, País, Status, Observações" },
    ],
    relatedSprints: ["Sprint 1", "Sprint 2"],
  },

  /* ─── DATABASE ─── */
  "/database": {
    title: "Gerenciador de Bancos de Dados",
    description:
      "Gerencie conexões com bancos de dados. Crie, edite, teste e exclua conexões. Suporta Local Storage, Supabase, PostgreSQL, MariaDB e SQLite.",
    features: ["CRUD completo de conexões", "Teste de conexão com validação", "Múltiplos tipos de banco suportados"],
    relatedSprints: ["Sprint 1", "Sprint 18"],
  },

  /* ─── SETTINGS ─── */
  "/settings": {
    title: "Configurações",
    description: "Configurações globais da plataforma: tema, idioma, preferências do usuário e administração.",
    relatedSprints: ["Sprint 1", "Sprint 2"],
  },

  /* ────────────────────────────────────────────────── */
  /* SERVICE ORDERS                                      */
  /* ────────────────────────────────────────────────── */
  "/service-orders": {
    title: "Ordens de Serviço",
    description:
      "Listagem completa de todas as ordens de serviço. Visualize, filtre, pesquise e gerencie OSs. Acesse o kanban, favoritos e painel do técnico.",
    features: [
      "Listagem paginada com busca e filtros",
      "CRUD completo de ordens de serviço",
      "Timeline imutável com histórico de alterações",
      "Comentários com menções e anexos",
      "Galeria de fotos categorizada",
      "Documentos, assinaturas e eventos associados",
    ],
    sections: [
      { title: "Status", content: "Em Aberto, Recebida, Em Diagnóstico, Aguardando Aprovação, Aprovada, Rejeitada, Em Execução, Aguardando Peças, Teste, Pronta, Entregue, Cancelada, Garantia, Retorno, Encerrada" },
    ],
    relatedSprints: ["Sprint 9", "Sprint 10", "Sprint 11", "Sprint 28"],
  },
  "/service-orders/dashboard": {
    title: "Dashboard de OS",
    description: "Dashboard executivo com métricas e indicadores das ordens de serviço.",
    relatedSprints: ["Sprint 9", "Sprint 30"],
  },
  "/service-orders/new": {
    title: "Nova Ordem de Serviço",
    description:
      "Wizard de abertura de OS em etapas: Cliente → Equipamento → Recebimento/Checklist → Problema/Prioridade → Resumo/Gerar OS.",
    features: [
      "Seleção de cliente com busca",
      "Seleção/cadastro de equipamento",
      "Checklist de recebimento configurável",
      "Defeito informado e prioridade",
      "Numeração automática configurável",
    ],
    relatedSprints: ["Sprint 9", "Sprint 28"],
  },
  "/service-orders/$id": {
    title: "Detalhes da OS",
    description:
      "Workspace completo com abas: Resumo, Timeline, Diagnóstico, Orçamento, Execução, Peças, Garantia, Retornos, Documentos, Comunicações, Histórico, Auditoria, Analytics.",
    features: ["Aba de resumo com dados principais", "Timeline imutável", "Galeria de fotos por categoria", "Comentários", "Documentos e assinaturas", "Eventos do sistema"],
    relatedSprints: ["Sprint 9", "Sprint 10", "Sprint 28"],
  },
  "/service-orders/technician": {
    title: "Painel do Técnico",
    description: "Painel exclusivo para técnicos com OSs atribuídas, em execução, aguardando peças e concluídas. Controle de tempo e produtividade.",
    relatedSprints: ["Sprint 10"],
  },
  "/service-orders/device-history": {
    title: "Histórico do Aparelho",
    description: "Timeline completa da vida útil do equipamento: todas as OSs, serviços, garantias e retornos associados.",
    relatedSprints: ["Sprint 10"],
  },

  /* ─── CUSTOMERS ─── */
  "/service-orders/customers": {
    title: "Gestão de Clientes",
    description: "Gerencie todos os clientes da plataforma. Cadastre pessoas físicas ou jurídicas com endereços, contatos, documentos e histórico.",
    features: ["CRUD completo", "Múltiplos endereços (Residencial, Comercial, Entrega, Cobrança)", "Múltiplos contatos", "Compartilhamento entre empresas"],
    relatedSprints: ["Sprint 8", "Sprint 26"],
  },
  "/service-orders/customers/list": {
    title: "Lista de Clientes",
    description: "Listagem completa com busca por Nome, CPF, CNPJ, Telefone, Email, Cidade. Importação e exportação em CSV/Excel/JSON.",
    relatedSprints: ["Sprint 8", "Sprint 26"],
  },
  "/service-orders/customers/import": {
    title: "Importar Clientes",
    description: "Importe clientes em lote de arquivos CSV, Excel ou JSON. Mapeamento de campos, preview e validação antes da importação.",
    relatedSprints: ["Sprint 26"],
  },
  "/service-orders/customers/export": {
    title: "Exportar Clientes",
    description: "Exporte clientes nos formatos CSV, Excel, JSON ou PDF com seleção de campos e filtros.",
    relatedSprints: ["Sprint 26"],
  },
  "/service-orders/customers/$id": {
    title: "Detalhes do Cliente",
    description: "Workspace do cliente com abas: Resumo, Endereços, Contatos, Equipamentos, Histórico de OS, Documentos, Garantias, Comunicações, Timeline.",
    relatedSprints: ["Sprint 8", "Sprint 26"],
  },

  /* ─── ASSETS ─── */
  "/service-orders/assets": {
    title: "Gestão de Ativos",
    description: "Gerencie equipamentos, marcas, modelos, tipos e categorias. Dashboard com análises e estatísticas.",
    features: ["CRUD de equipamentos", "Marcas, modelos, tipos e categorias ilimitados", "Checklist de recebimento", "Fotos categorizadas", "Acessórios"],
    relatedSprints: ["Sprint 8", "Sprint 27"],
  },
  "/service-orders/assets/equipment": {
    title: "Equipamentos",
    description: "Cadastro completo de equipamentos com Cliente, Tipo, Marca, Modelo, Nº Série, IMEI, Patrimônio, Cor, Fotos e Acessórios.",
    relatedSprints: ["Sprint 8", "Sprint 27"],
  },
  "/service-orders/assets/equipment/$id": {
    title: "Detalhes do Equipamento",
    description: "Workspace do equipamento com Fotos, Documentos, Timeline, Histórico, Acessórios.",
    relatedSprints: ["Sprint 27"],
  },
  "/service-orders/assets/brands": {
    title: "Marcas",
    description: "Cadastro de marcas de equipamentos (Samsung, LG, Dell, Apple, etc.). Ilimitado.",
    relatedSprints: ["Sprint 8", "Sprint 27"],
  },
  "/service-orders/assets/models": {
    title: "Modelos",
    description: "Cadastro de modelos vinculados a marcas e tipos de equipamento.",
    relatedSprints: ["Sprint 8", "Sprint 27"],
  },
  "/service-orders/assets/types": {
    title: "Tipos de Equipamento",
    description: "Cadastro de tipos (Notebook, Smartphone, Tablet, TV, etc.). Ilimitado.",
    relatedSprints: ["Sprint 8", "Sprint 27"],
  },
  "/service-orders/assets/categories": {
    title: "Categorias",
    description: "Categorização de equipamentos para organização e relatórios.",
    relatedSprints: ["Sprint 27"],
  },
  "/service-orders/assets/analytics": {
    title: "Analíticas de Ativos",
    description: "Dashboard com análises de equipamentos: mais comuns, por categoria, marcas/modelos mais usados, distribuição.",
    relatedSprints: ["Sprint 27"],
  },

  /* ────────────────────────────────────────────────── */
  /* FINANCIAL                                           */
  /* ────────────────────────────────────────────────── */
  "/financial": {
    title: "Financeiro",
    description: "Gestão financeira completa: contas, transações, contas a pagar/receber, faturas e centros de custo.",
    sections: [
      { title: "Contas Financeiras", content: "Gerencie contas bancárias, saldos e movimentações" },
      { title: "Contas a Pagar", content: "Registre e acompanhe contas a pagar com filtros por status" },
      { title: "Contas a Receber", content: "Gerencie recebimentos e entradas financeiras" },
      { title: "Faturas", content: "Emissão e cancelamento de faturas" },
      { title: "Centros de Custo", content: "Organize despesas por departamento ou projeto" },
    ],
    features: ["Dashboard com indicadores financeiros", "Transações com categorização", "Controle de contas a pagar/receber"],
    relatedSprints: ["Sprint 18"],
  },
  "/financial/accounts": {
    title: "Contas Financeiras",
    description: "Cadastro e gerenciamento de contas financeiras com saldos e status.",
    relatedSprints: ["Sprint 18"],
  },
  "/financial/transactions": {
    title: "Transações Financeiras",
    description: "Registro de todas as transações financeiras com tipo (Receita/Despesa), valor, data e categoria.",
    relatedSprints: ["Sprint 18"],
  },
  "/financial/invoices": {
    title: "Faturas",
    description: "Gestão de faturas emitidas com possibilidade de emissão e cancelamento.",
    relatedSprints: ["Sprint 18"],
  },
  "/financial/payable": {
    title: "Contas a Pagar",
    description: "Controle de contas a pagar com filtros por status (Pendente, Pago, Vencido, Cancelado).",
    relatedSprints: ["Sprint 18"],
  },
  "/financial/receivable": {
    title: "Contas a Receber",
    description: "Controle de contas a receber com filtros e ações de recebimento.",
    relatedSprints: ["Sprint 18"],
  },
  "/financial/cost-centers": {
    title: "Centros de Custo",
    description: "Organização de custos por departamentos ou projetos para melhor alocação de despesas.",
    relatedSprints: ["Sprint 18"],
  },

  /* ────────────────────────────────────────────────── */
  /* INVENTORY                                           */
  /* ────────────────────────────────────────────────── */
  "/inventory": {
    title: "Estoque",
    description: "Gestão completa de estoque: produtos, armazéns, movimentações, transferências, ajustes, inventários e alertas.",
    features: ["Dashboard com indicadores de estoque", "Catálogo de produtos com SKU e código de barras", "Múltiplos armazéns e baias", "Movimentações e transferências"],
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/products": {
    title: "Produtos",
    description: "Catálogo de produtos com Nome, SKU, Código de Barras, Categoria, Marca, Preço de Custo/Venda e controle de estoque mínimo/máximo.",
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/warehouses": {
    title: "Armazéns",
    description: "Gerenciamento de armazéns com status ativo/inativo.",
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/movements": {
    title: "Movimentações",
    description: "Registro de entradas e saídas de produtos com tipo (Entrada/Saída/Transferência/Ajuste/Devolução).",
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/transfers": {
    title: "Transferências",
    description: "Transferência de produtos entre armazéns com status (Pendente, Em Trânsito, Concluída, Cancelada).",
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/adjustments": {
    title: "Ajustes de Estoque",
    description: "Ajustes manuais de inventário para correção de saldos.",
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/counts": {
    title: "Inventários",
    description: "Contagens físicas de inventário com status (Pendente, Em Andamento, Concluído, Divergente).",
    relatedSprints: ["Sprint 18"],
  },
  "/inventory/alerts": {
    title: "Alertas de Estoque",
    description: "Alertas automáticos de estoque baixo, excesso, produtos vencidos e inatividade.",
    relatedSprints: ["Sprint 18"],
  },

  /* ────────────────────────────────────────────────── */
  /* PURCHASING                                          */
  /* ────────────────────────────────────────────────── */
  "/purchasing": {
    title: "Compras",
    description: "Gestão de compras: pedidos, recebimentos e fornecedores.",
    sections: [
      { title: "Pedidos de Compra", content: "Criação e gestão de pedidos com status" },
      { title: "Recebimentos", content: "Registro de recebimento de pedidos" },
      { title: "Fornecedores", content: "Cadastro de fornecedores" },
    ],
    relatedSprints: ["Sprint 18"],
  },
  "/purchasing/orders": {
    title: "Pedidos de Compra",
    description: "Criação e gerenciamento de pedidos de compra com status (Rascunho, Pendente, Aprovado, Enviado, Recebido, Cancelado).",
    relatedSprints: ["Sprint 18"],
  },
  "/purchasing/receiving": {
    title: "Recebimentos",
    description: "Registro de recebimento de pedidos com status (Pendente, Parcial, Completo, Conferido).",
    relatedSprints: ["Sprint 18"],
  },
  "/purchasing/suppliers": {
    title: "Fornecedores",
    description: "Cadastro de fornecedores com informações de contato, CNPJ e produtos fornecidos.",
    relatedSprints: ["Sprint 8", "Sprint 18"],
  },

  /* ────────────────────────────────────────────────── */
  /* CRM                                                 */
  /* ────────────────────────────────────────────────── */
  "/crm": {
    title: "CRM - Relacionamento com Clientes",
    description: "Gestão de leads, oportunidades, campanhas e acordos SLA.",
    features: ["Dashboard com métricas de vendas", "Pipeline de oportunidades", "Campanhas de marketing", "Acordos de nível de serviço"],
    relatedSprints: ["Sprint 18"],
  },
  "/crm/leads": {
    title: "Leads",
    description: "Captação e qualificação de leads com status (Novo, Qualificado, Convertido, Perdido).",
    relatedSprints: ["Sprint 18"],
  },
  "/crm/opportunities": {
    title: "Oportunidades",
    description: "Pipeline de oportunidades com estágios (Prospecção, Qualificação, Proposta, Negociação, Fechado). Probabilidade e valor.",
    relatedSprints: ["Sprint 18"],
  },
  "/crm/campaigns": {
    title: "Campanhas",
    description: "Criação e gestão de campanhas com ROI, orçamento e metas.",
    relatedSprints: ["Sprint 18"],
  },
  "/crm/agreements": {
    title: "Acordos SLA",
    description: "Definição de acordos de nível de serviço com prazos, prioridades e condições.",
    relatedSprints: ["Sprint 18"],
  },

  /* ────────────────────────────────────────────────── */
  /* HR                                                  */
  /* ────────────────────────────────────────────────── */
  "/hr": {
    title: "Recursos Humanos",
    description: "Gestão de colaboradores: funcionários, ponto, folha de pagamento, comissões e turnos.",
    features: ["Dashboard com indicadores de RH", "Cadastro de funcionários", "Controle de ponto", "Folha de pagamento", "Comissões"],
    relatedSprints: ["Sprint 18"],
  },
  "/hr/employees": {
    title: "Funcionários",
    description: "Cadastro completo de funcionários com cargo, departamento, salário, data de admissão e status.",
    relatedSprints: ["Sprint 18"],
  },
  "/hr/timesheets": {
    title: "Ponto Eletrônico",
    description: "Registro de ponto dos funcionários com aprovação/rejeição de horas.",
    relatedSprints: ["Sprint 18"],
  },
  "/hr/payroll": {
    title: "Folha de Pagamento",
    description: "Geração e gestão da folha de pagamento com cálculo automático.",
    relatedSprints: ["Sprint 18"],
  },
  "/hr/commissions": {
    title: "Comissões",
    description: "Cálculo e pagamento de comissões para vendedores e técnicos.",
    relatedSprints: ["Sprint 18"],
  },
  "/hr/shifts": {
    title: "Turnos",
    description: "Definição de turnos de trabalho por funcionário e dia da semana.",
    relatedSprints: ["Sprint 18"],
  },

  /* ────────────────────────────────────────────────── */
  /* KNOWLEDGE                                           */
  /* ────────────────────────────────────────────────── */
  "/knowledge": {
    title: "Base de Conhecimento",
    description: "Biblioteca técnica com procedimentos, manuais, diagramas, firmware, soluções conhecidas, FAQ e boletins técnicos.",
    features: [
      "Pesquisa inteligente com linguagem natural",
      "Procedimentos técnicos passo a passo",
      "Soluções conhecidas com probabilidade de sucesso",
      "Códigos de erro por fabricante/modelo",
      "Integração com IA para resumo e extração",
      "Workflow de conteúdo: Rascunho → Revisão → Publicado",
    ],
    relatedSprints: ["Sprint 31"],
  },
  "/knowledge/library": {
    title: "Biblioteca Técnica",
    description: "Navegue pela biblioteca completa com filtros por categoria, tipo, fabricante e busca textual.",
    relatedSprints: ["Sprint 31"],
  },
  "/knowledge/search": {
    title: "Pesquisa Inteligente",
    description: "Pesquise em linguagem natural. Ex: 'Notebook Dell liga mas não apresenta vídeo'. Resultados com sugestões e filtros.",
    relatedSprints: ["Sprint 31"],
  },
  "/knowledge/categories": {
    title: "Categorias",
    description: "Organize o conhecimento por categorias: Procedimentos, Manuais, Soluções, Códigos de Erro, FAQ, etc.",
    relatedSprints: ["Sprint 31"],
  },
  "/knowledge/analytics": {
    title: "Analíticas",
    description: "Métricas de uso da base de conhecimento: artigos mais vistos, mais usados em OSs, ratings e tendências.",
    relatedSprints: ["Sprint 31"],
  },
  "/knowledge/import": {
    title: "Importar Conhecimento",
    description: "Importe documentos, manuais e procedimentos em lote com categorização automática.",
    relatedSprints: ["Sprint 31"],
  },

  /* ────────────────────────────────────────────────── */
  /* COMMUNICATION                                       */
  /* ────────────────────────────────────────────────── */
  "/communication": {
    title: "Comunicação",
    description: "Central de comunicação multicanal. Gerencie templates, canais, fila de mensagens, regras e agendamentos.",
    features: [
      "Múltiplos canais: Email, WhatsApp, Notificação Interna",
      "Templates de mensagem com variáveis dinâmicas",
      "Fila de processamento com retry automático",
      "Regras de negócio para disparo automático",
      "Agendamento de comunicações",
      "Histórico completo por cliente",
    ],
    relatedSprints: ["Sprint 5"],
  },
  "/communication/dashboard": {
    title: "Central de Comunicação",
    description: "Dashboard com métricas de envio: mensagens enviadas, pendentes, falhas, agendadas, taxa de entrega.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/templates": {
    title: "Templates de Mensagem",
    description: "Biblioteca de templates por canal e categoria. Editor com variáveis dinâmicas, preview e teste.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/channels": {
    title: "Canais de Comunicação",
    description: "Configuração e gerenciamento dos canais de envio (Email, WhatsApp, Interno) com status ativo/inativo.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/queue": {
    title: "Fila de Mensagens",
    description: "Acompanhamento da fila de processamento com estados: Pendente, Processando, Enviado, Falhou. Ações de cancelar e reprocessar.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/rules": {
    title: "Regras de Comunicação",
    description: "Regras do tipo 'Quando OS.status = Aprovado → Enviar WhatsApp' com template e canal configuráveis.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/schedules": {
    title: "Agendamentos",
    description: "Agende comunicações para data/hora específica com recorrência e cancelamento.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/preferences": {
    title: "Preferências",
    description: "Configure preferências de comunicação por cliente (canais permitidos) e empresa (canal padrão, horário, assinatura).",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/inbox": {
    title: "Caixa de Entrada",
    description: "Central de mensagens recebidas com indicador de não lidas e seleção de mensagem.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/history": {
    title: "Histórico de Comunicação",
    description: "Timeline de comunicações agrupadas por cliente com detalhes de cada envio.",
    relatedSprints: ["Sprint 5"],
  },
  "/communication/audit": {
    title: "Auditoria",
    description: "Registro de auditoria de todas as comunicações com filtro por tipo de evento.",
    relatedSprints: ["Sprint 5"],
  },

  /* ────────────────────────────────────────────────── */
  /* DOCUMENTS                                           */
  /* ────────────────────────────────────────────────── */
  "/documents": {
    title: "Documentos",
    description: "Plataforma de documentos: templates, designer visual, gerador, armazenamento, versões, assinaturas e validação QR.",
    features: [
      "Template Library com categorias e versionamento",
      "Designer visual drag-and-drop",
      "Gerador de documentos com dados dinâmicos",
      "Validação QR com hash e checksum",
      "Assinatura digital em canvas",
      "Central de impressão com múltiplos layouts",
    ],
    relatedSprints: ["Sprint 4"],
  },
  "/documents/templates": {
    title: "Biblioteca de Templates",
    description: "Gerencie templates de documentos com categorias (OS, Recibo, Orçamento, Garantia, Etiqueta, etc.). Duplicar, arquivar, publicar, versionar.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/designer": {
    title: "Designer de Documentos",
    description: "Editor visual drag-and-drop com componentes: Texto, Imagem, Logo, Campo, Tabela, QR Code, Código de Barras, Assinatura, Expressões.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/generator": {
    title: "Gerador de Documentos",
    description: "Selecione um template, preencha os metadados e gere o documento. Integração com dados reais do sistema.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/storage": {
    title: "Armazenamento",
    description: "Visualize, archive, restaure e exclua documentos armazenados com informações de versão, hash, formato e tamanho.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/versions": {
    title: "Versões",
    description: "Histórico completo de versões de documentos com preview e restauração.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/history": {
    title: "Histórico",
    description: "Timeline completa de eventos do documento: Criado, Gerado, Visualizado, Impresso, Compartilhado, Assinado.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/signatures": {
    title: "Assinaturas",
    description: "Gerencie assinaturas digitais em canvas. Tipos: Cliente, Técnico, Administrador, Empresa. Múltiplas assinaturas por documento.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/qr-validation": {
    title: "Validação QR",
    description: "Valide documentos através de QR Code com ID Público, Hash e Checksum.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/print": {
    title: "Central de Impressão",
    description: "Configure layout de impressão: A4, A5, Carta, 58mm, 80mm, Etiqueta. Orientação, margens, zoom e preview.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/export": {
    title: "Exportação",
    description: "Exporte documentos nos formatos: HTML, PDF, DOCX, PNG, JSON. Com seleção de configurações.",
    relatedSprints: ["Sprint 4"],
  },
  "/documents/audit": {
    title: "Auditoria de Documentos",
    description: "Registro de auditoria de todas as ações em documentos com filtro por tipo de evento.",
    relatedSprints: ["Sprint 4"],
  },

  /* ────────────────────────────────────────────────── */
  /* EVENTS                                              */
  /* ────────────────────────────────────────────────── */
  "/events": {
    title: "Event Bus",
    description: "Barramento de eventos do sistema. Monitore, publique e inscreva-se em eventos. Gerencie workflows automatizados.",
    features: [
      "Monitor de eventos em tempo real",
      "Publicação e inscrição em eventos",
      "Workflow Engine com triggers e ações",
      "Workflow Designer visual",
      "Histórico completo de eventos",
    ],
    relatedSprints: ["Sprint 6"],
  },
  "/events/monitor": {
    title: "Monitor de Eventos",
    description: "Dashboard com métricas de eventos: eventos por minuto, processados, com erro, tempo médio, subscribers ativos.",
    relatedSprints: ["Sprint 6"],
  },
  "/events/history": {
    title: "Histórico de Eventos",
    description: "Visualize o histórico completo de eventos com filtros por período, categoria, origem e resultado.",
    relatedSprints: ["Sprint 6"],
  },
  "/events/workflows": {
    title: "Workflows",
    description: "Gerencie workflows com triggers (Evento, Manual, Agendamento, Mudança de Campo), condições e ações. Duplicar, versionar, publicar.",
    relatedSprints: ["Sprint 6"],
  },
  "/events/subscribers": {
    title: "Subscribers",
    description: "Gerencie os inscritos no barramento de eventos com habilitação/desabilitação.",
    relatedSprints: ["Sprint 6"],
  },
  "/events/audit": {
    title: "Auditoria de Workflows",
    description: "Auditoria completa da execução de workflows com filtros por tipo de ação.",
    relatedSprints: ["Sprint 6"],
  },

  /* ────────────────────────────────────────────────── */
  /* AI                                                  */
  /* ────────────────────────────────────────────────── */
  "/ai": {
    title: "Plataforma de IA",
    description: "Plataforma de Inteligência Artificial com OCR, Visão Computacional, Playground, Gerenciamento de Prompts e Provedores.",
    features: [
      "Múltiplos provedores de IA (OpenAI, Gemini, Claude, Ollama)",
      "OCR Engine para extração de texto de imagens/PDFs",
      "Vision Engine para reconhecimento visual",
      "Playground para teste de prompts",
      "Tela de conferência de OCR com correção humana",
      "Fila de processamento com retry",
    ],
    relatedSprints: ["Sprint 12"],
  },
  "/ai/playground": {
    title: "Playground de IA",
    description: "Teste diferentes provedores e modelos de IA. Execute prompts, visualize respostas, tempo e tokens.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/prompts": {
    title: "Biblioteca de Prompts",
    description: "Gerencie prompts com categorias, versionamento, publicação e arquivamento. Duplicar e comparar versões.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/ocr": {
    title: "Motor OCR",
    description: "Processe imagens e PDFs para extração de texto. Simulação de reconhecimento com campos identificados e confiança.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/vision": {
    title: "Visão Computacional",
    description: "Reconhecimento visual de documentos, aparelhos e etiquetas. Leitura de QR Code e código de barras.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/conference": {
    title: "Conferência de OCR",
    description: "Tela de conferência: imagem original → OCR → IA interpreta → Mapeamento → Correção humana → Salvar. Nunca salva automaticamente.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/providers": {
    title: "Provedores de IA",
    description: "Configure provedores de IA (OpenAI, Gemini, Claude, Ollama, etc.) com teste de conexão.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/config": {
    title: "Configurações de IA",
    description: "Configure provedor padrão, temperatura, limites de OCR e visão, timeout e retry.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/history": {
    title: "Histórico de IA",
    description: "Histórico de processamentos de IA com prompt, resposta, provedor, tempo e tokens.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/queue": {
    title: "Fila de IA",
    description: "Fila de processamento de IA com status, prioridade, tentativas e ações de cancelar/reprocessar.",
    relatedSprints: ["Sprint 12"],
  },
  "/ai/audit": {
    title: "Auditoria de IA",
    description: "Auditoria de todos os processamentos de IA com status e detalhes.",
    relatedSprints: ["Sprint 12"],
  },

  /* ────────────────────────────────────────────────── */
  /* AUTOMATION                                          */
  /* ────────────────────────────────────────────────── */
  "/automation": {
    title: "Automação",
    description: "Plataforma de automação com designer visual de workflows, regras de negócio, máquina de estados, aprovações e agendamentos.",
    features: [
      "Workflow Designer visual drag-and-drop",
      "Triggers: Evento, Agendamento, Webhook, API, Manual",
      "Ações: Documento, Comunicação, IA, Integração, Script",
      "State Machine para fluxos de status",
      "Approval Engine com múltiplos aprovadores",
      "SLA Engine com escalonamento automático",
    ],
    relatedSprints: ["Sprint 22"],
  },
  "/automation/designer": {
    title: "Workflow Designer",
    description: "Editor visual com 15 tipos de steps: Trigger, Condição, Decisão, Loop, Delay, Timer, Evento, Script, Webhook, API, Documento, Comunicação, IA, Aprovação.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/workflows": {
    title: "Workflows",
    description: "Biblioteca de workflows com CRUD, versionamento, publicação e arquivamento.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/rules": {
    title: "Regras de Negócio",
    description: "Editor visual de regras com IF/ELSE, comparações, expressões e funções.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/scripts": {
    title: "Scripts",
    description: "Gerenciamento de scripts JavaScript com timeout e versionamento em ambiente sandbox.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/scheduler": {
    title: "Agendador",
    description: "Agende execuções: Única, Diária, Semanal, Mensal, Anual, Cron.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/jobs": {
    title: "Jobs",
    description: "Gerenciamento de jobs automatizados com controle de execução.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/approvals": {
    title: "Aprovações",
    description: "Fluxos de aprovação com múltiplos aprovadores, sequencial/paralelo, maioria/unanimidade, delegação e escalonamento.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/statemachine": {
    title: "Máquina de Estados",
    description: "Definição de estados, transições, permissões, validações, eventos e ações automáticas. Ex: OS → Diagnóstico → Aprovação → Execução.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/timers": {
    title: "Temporizadores",
    description: "Gerenciamento de timers para execução atrasada ou periódica de workflows.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/templates": {
    title: "Templates de Workflow",
    description: "Biblioteca de templates prontos: Aprovação de OS, Garantia, Retorno, Importação, Backup, Relatórios.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/monitor": {
    title: "Monitor de Automação",
    description: "Acompanhe a execução de workflows com status, tempo de execução e histórico.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/history": {
    title: "Histórico de Automação",
    description: "Histórico completo de execuções com busca e filtros.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/config": {
    title: "Configurações",
    description: "Configurações gerais da plataforma de automação.",
    relatedSprints: ["Sprint 22"],
  },
  "/automation/audit": {
    title: "Auditoria de Automação",
    description: "Registro de auditoria de todas as ações de automação com filtros por entidade e ação.",
    relatedSprints: ["Sprint 22"],
  },

  /* ────────────────────────────────────────────────── */
  /* REPORTING                                           */
  /* ────────────────────────────────────────────────── */
  "/reporting": {
    title: "BI & Relatórios",
    description: "Plataforma de Business Intelligence: dashboards, relatórios, KPIs, gráficos, datasets e exportações.",
    features: [
      "Dashboard Builder com widgets redimensionáveis",
      "Report Builder visual drag-and-drop",
      "KPI Center com métricas e metas",
      "Dataset Manager com JOINs e filtros",
      "Agendamento e envio automático de relatórios",
      "Múltiplos formatos de exportação",
    ],
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/dashboard": {
    title: "Dashboard de BI",
    description: "Dashboard overview com métricas de OS, clientes, equipamentos, finanças e RH.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/reports": {
    title: "Relatórios",
    description: "Criação e gerenciamento de relatórios com tipos (Tabela, Cards, Gráfico, Lista) e categorias.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/dashboards": {
    title: "Dashboards",
    description: "Criação de dashboards personalizados com abas, widgets e compartilhamento.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/charts": {
    title: "Gráficos",
    description: "Galeria de tipos de gráfico: Linha, Barra, Pizza, Área, Rosca, Gauge, Heatmap.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/widgets": {
    title: "Widgets",
    description: "Biblioteca de widgets: Tabela, Cards, Indicador, Gráfico, Calendário, Timeline, Mapa, Texto, HTML.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/kpis": {
    title: "KPIs",
    description: "Centro de KPIs com métricas de negócio, metas, alertas e acompanhamento.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/datasets": {
    title: "Datasets",
    description: "Criação de datasets com seleção de fonte/entidades, JOINs, filtros, agrupamentos e campos calculados.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/templates": {
    title: "Templates de Relatório",
    description: "Biblioteca de templates de relatório com designer visual e campos dinâmicos.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/schedules": {
    title: "Agendamentos",
    description: "Agende a geração e envio automático de relatórios por email.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/exports": {
    title: "Exportações",
    description: "Exporte relatórios e dashboards nos formatos PDF, Excel, CSV, JSON, HTML, PNG, SVG.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/history": {
    title: "Histórico",
    description: "Histórico de execução de relatórios com filtros por tipo.",
    relatedSprints: ["Sprint 21"],
  },
  "/reporting/config": {
    title: "Configurações de BI",
    description: "Configurações gerais da plataforma de BI e relatórios.",
    relatedSprints: ["Sprint 21"],
  },

  /* ────────────────────────────────────────────────── */
  /* INTEGRATIONS                                        */
  /* ────────────────────────────────────────────────── */
  "/integrations": {
    title: "Integrações",
    description: "Plataforma de integrações: conectores, API Gateway, webhooks, sincronizações e marketplace.",
    features: [
      "Connector Registry com múltiplos conectores",
      "API Gateway com autenticação e rate limit",
      "Webhook Manager com retry e logs",
      "Synchronization Engine bidirecional",
      "Health Check com latência e disponibilidade",
      "Secret Manager com criptografia",
    ],
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/connections": {
    title: "Conexões",
    description: "Gerenciamento de conexões com autenticação (Bearer, OAuth2, JWT, Basic, API Key). Teste e favoritos.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/connectors": {
    title: "Conectores",
    description: "Instâncias de conectores (PostgreSQL, OpenAI, Slack, WhatsApp, etc.) com status e favoritos.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/apis": {
    title: "API Gateway",
    description: "Gateway de APIs com configuração de URL, headers, auth, timeout, retry e rate limit. Execute e teste chamadas.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/webhooks": {
    title: "Webhooks",
    description: "Gerenciamento de webhooks com criação, ativação, retry, assinatura e secret.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/syncs": {
    title: "Sincronizações",
    description: "Motor de sincronização: Manual, Agendada, Evento, Bidirecional, Incremental. Resolução de conflitos.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/marketplace": {
    title: "Marketplace",
    description: "Marketplace de conectores com instalação, atualização e versionamento.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/templates": {
    title: "Templates",
    description: "Templates de integração prontos para uso.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/monitoring": {
    title: "Monitoramento",
    description: "Dashboard de monitoramento com métricas de conectores ativos, erros, latência e disponibilidade.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/health": {
    title: "Health Check",
    description: "Verificação de saúde das integrações: autenticação, conectividade, latência, disponibilidade e permissões.",
    relatedSprints: ["Sprint 19"],
  },
  "/integrations/logs": {
    title: "Logs",
    description: "Visualizador de logs de integrações com filtros e ações de limpeza.",
    relatedSprints: ["Sprint 19"],
  },

  /* ────────────────────────────────────────────────── */
  /* PORTAL                                              */
  /* ────────────────────────────────────────────────── */
  "/portal": {
    title: "Portal do Cliente",
    description: "Portal público para clientes consultarem OSs, aprovarem orçamentos, baixarem documentos e acompanharem garantias.",
    features: [
      "Consulta de OS por número, código público ou QR Code",
      "Aprovação/rejeição de orçamentos",
      "Download de documentos e comprovantes",
      "Upload de fotos e documentos",
      "Compartilhamento com links públicos",
      "White Label com logo e tema personalizados",
    ],
    relatedSprints: ["Sprint 23"],
  },
  "/portal/home": {
    title: "Início do Portal",
    description: "Dashboard do portal com métricas de acesso, downloads, uploads, aprovações e documentos.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/orders": {
    title: "Ordens de Serviço",
    description: "Consulta pública de OSs com status, prazos, valores e documentos. Acesso por número, código ou token.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/approvals": {
    title: "Aprovações",
    description: "Portal de aprovação de orçamentos: Aprovar, Rejeitar, Solicitar Revisão, Assinar Digitalmente. Registro de IP e data.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/guarantees": {
    title: "Garantias",
    description: "Consulte prazos de garantia, histórico de reparos e solicite retornos com evidências.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/downloads": {
    title: "Downloads",
    description: "Baixe documentos: OS, Orçamento, Garantia, Recibos, Laudo Técnico. Múltiplos formatos.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/uploads": {
    title: "Uploads",
    description: "Envie fotos, vídeos, PDFs e comprovantes para sua OS.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/shares": {
    title: "Compartilhamentos",
    description: "Gerencie links públicos compartilhados com expiração, máximo de acessos, senha e revogação.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/analytics": {
    title: "Analíticas",
    description: "Métricas do portal: acessos, downloads, uploads, aprovações, dispositivos, documentos mais acessados.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/config": {
    title: "Configurações",
    description: "Configurações gerais e de segurança do portal do cliente.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/branding": {
    title: "Branding",
    description: "Personalização white label: logo, nome, tema, cores, favicon, domínio, rodapé e idioma.",
    relatedSprints: ["Sprint 23"],
  },
  "/portal/audit": {
    title: "Auditoria",
    description: "Auditoria de todas as ações do portal com filtros por tipo de ação.",
    relatedSprints: ["Sprint 23"],
  },

  /* ────────────────────────────────────────────────── */
  /* ERP                                                 */
  /* ────────────────────────────────────────────────── */
  "/erp": {
    title: "Gestão Corporativa (ERP)",
    description: "Módulo ERP corporativo: empresas, departamentos, contratos e regras de negócio.",
    features: ["Gestão de empresas", "Departamentos e hierarquia", "Contratos e termos", "Regras de negócio globais"],
    relatedSprints: ["Sprint 18"],
  },
  "/erp/companies": {
    title: "Empresas ERP",
    description: "Cadastro de empresas do grupo com dados corporativos.",
    relatedSprints: ["Sprint 18"],
  },
  "/erp/departments": {
    title: "Departamentos",
    description: "Estrutura organizacional com departamentos e hierarquia.",
    relatedSprints: ["Sprint 18"],
  },
  "/erp/contracts": {
    title: "Contratos",
    description: "Gestão de contratos corporativos com status e vigência.",
    relatedSprints: ["Sprint 18"],
  },
  "/erp/rules": {
    title: "Regras de Negócio",
    description: "Regras de negócio globais do ERP com categorias e prioridades.",
    relatedSprints: ["Sprint 18"],
  },

  /* ────────────────────────────────────────────────── */
  /* ADMIN                                               */
  /* ────────────────────────────────────────────────── */
  "/admin": {
    title: "Administração Global",
    description: "Painel administrativo completo para o Administrador Global. Gerencie empresas, usuários, permissões, segurança, logs e muito mais.",
    sections: [
      { title: "Geral", content: "Dashboard, Empresas, Usuários, Grupos" },
      { title: "Segurança", content: "Papéis, Permissões, Políticas, Impersonação, Feature Flags" },
      { title: "Infraestrutura", content: "Banco de Dados, Provedores, Fontes de Dados, Conectores" },
      { title: "Personalização", content: "Temas, Idiomas, Configurações, Demo Environment" },
      { title: "Observabilidade", content: "Logs, Auditoria, Health, Monitoramento, Jobs, Agendamentos" },
      { title: "Sistema", content: "Variáveis de Ambiente, Segredos, Backup, Manutenção, Licenciamento, Metadados" },
    ],
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/dashboard": {
    title: "Dashboard Admin",
    description: "Visão geral com quantidade de empresas, usuários, administradores, logs, banco ativo, versão e status do sistema.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/companies": {
    title: "Empresas",
    description: "CRUD completo de empresas com logo, dados cadastrais, tema, idioma, banco e status.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/users": {
    title: "Usuários",
    description: "CRUD de usuários com foto, dados pessoais, empresas vinculadas, papéis, permissões especiais e status.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/groups": {
    title: "Grupos",
    description: "Gerencie grupos de usuários: Administradores, Atendimento, Financeiro, Técnicos, Estoque, Comercial.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/roles": {
    title: "Papéis (RBAC)",
    description: "Definição de papéis com permissões granulares: Admin Global, Admin Empresa, Supervisor, Editor, Operador, Visualizador.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/permissions": {
    title: "Permissões",
    description: "Permissões por módulo, tela, ação e campo. Ações: Visualizar, Criar, Editar, Excluir, Imprimir, Exportar, Importar, Publicar, Administrar.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/policies": {
    title: "Políticas",
    description: "Políticas de segurança: senha, sessão, login, timeout, upload, exportação, LGPD e retenção.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/feature-flags": {
    title: "Feature Flags",
    description: "Ativação gradual de funcionalidades por ambiente, empresa, usuário ou versão.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/database": {
    title: "Banco de Dados",
    description: "Configuração do banco de dados principal da administração.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/providers": {
    title: "Provedores",
    description: "Gerenciamento de provedores de serviços e conexões.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/data-sources": {
    title: "Fontes de Dados",
    description: "Cadastro de fontes de dados com tipo, host, porta, schema, autenticação e SSL.",
    relatedSprints: ["Sprint 18", "Sprint 20"],
  },
  "/admin/connectors": {
    title: "Conectores",
    description: "Gerenciamento centralizado de conectores do sistema.",
    relatedSprints: ["Sprint 19", "Sprint 20"],
  },
  "/admin/themes": {
    title: "Temas",
    description: "Gerenciamento de temas: logo, cores, fontes, ícones, CSS tokens. Dark/Light mode. Por empresa/global.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/languages": {
    title: "Idiomas",
    description: "Gerenciamento de idiomas: PT-BR, EN, ES. Preparado para novos idiomas.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/settings": {
    title: "Configurações",
    description: "Configurações globais da administração da plataforma.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/logs": {
    title: "Logs do Sistema",
    description: "Visualizador de logs com filtros por período, usuário, empresa, módulo, tipo e resultado. Tabela paginada.",
    relatedSprints: ["Sprint 2"],
  },
  "/admin/audit": {
    title: "Central de Auditoria",
    description: "Auditoria centralizada com pesquisa por usuário, empresa, data, evento, módulo e impersonação.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/health": {
    title: "Central de Saúde",
    description: "Monitoramento da saúde do sistema: bancos, serviços, filas e armazenamento.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/monitoring": {
    title: "Monitoramento",
    description: "Monitoramento de desempenho e disponibilidade da plataforma.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/jobs": {
    title: "Jobs",
    description: "Gerenciamento de jobs agendados do sistema.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/schedules": {
    title: "Agendamentos",
    description: "Agendamentos de tarefas administrativas do sistema.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/env": {
    title: "Variáveis de Ambiente",
    description: "Gerenciamento de variáveis de ambiente da plataforma.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/secrets": {
    title: "Segredos",
    description: "Gerenciamento seguro de segredos e chaves de API com criptografia.",
    relatedSprints: ["Sprint 19", "Sprint 20"],
  },
  "/admin/backup": {
    title: "Backup & Restore",
    description: "Backup manual e agendado, completo e incremental. Restauração de backups.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/maintenance": {
    title: "Manutenção",
    description: "Modo de manutenção com mensagens, agendamentos e logs.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/license": {
    title: "Licenciamento",
    description: "Gerenciamento de licenças: Free, Starter, Professional, Enterprise. Controle de limites e recursos.",
    relatedSprints: ["Sprint 20"],
  },
  "/admin/impersonation": {
    title: "Impersonação",
    description: "Admin Global pode entrar/sair de empresas como usuário. Banner permanente. Auditoria obrigatória.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/system": {
    title: "Informações do Sistema",
    description: "Informações técnicas do sistema, versões e status dos serviços.",
    relatedSprints: ["Sprint 2", "Sprint 20"],
  },
  "/admin/metadata": {
    title: "Metadata Platform",
    description: "Gerenciamento de metadados: entidades, campos, formulários, views, dashboards, templates e versões.",
    features: [
      "Entity Manager com entidades padrão",
      "Field Manager com 29 tipos de campo",
      "Form Designer visual drag-and-drop",
      "View Designer com layout Tabela, Cards, Kanban",
      "Dashboard Designer com widgets",
      "Versionamento e publicação",
    ],
    relatedSprints: ["Sprint 3"],
  },

  /* ─── DEMO ENVIRONMENT ─── */
  "/admin/demo-env": {
    title: "Demo Environment",
    description: "Gerenciamento do ambiente de demonstração. Crie, gerencie e restaure cenários de demonstração completos.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/scenarios": {
    title: "Cenários",
    description: "Cenários prontos: Pequena Assistência (120 OSs), Assistência Média (1500 OSs), Grande Rede (50000 OSs).",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/generator": {
    title: "Gerador Personalizado",
    description: "Configure quantidades de cada entidade para gerar um ambiente demo personalizado.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/seeds": {
    title: "Seeds",
    description: "Gerencie os seeds de dados para popular o ambiente demo.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/export": {
    title: "Exportar Ambiente",
    description: "Exporte o ambiente demo completo em JSON para backup ou compartilhamento.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/import": {
    title: "Importar Ambiente",
    description: "Importe um ambiente demo de arquivo JSON com validação de integridade.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/statistics": {
    title: "Estatísticas",
    description: "Estatísticas detalhadas do ambiente demo: empresas, usuários, OSs, clientes, equipamentos.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/history": {
    title: "Histórico",
    description: "Histórico de operações realizadas no ambiente demo.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/logs": {
    title: "Logs",
    description: "Registros de log do ambiente demo.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/diagnosis": {
    title: "Diagnóstico",
    description: "Diagnóstico do ambiente: valida relacionamentos, documentos órfãos, eventos inválidos e integridade.",
    relatedSprints: ["Sprint 25"],
  },
  "/admin/demo-env/integrity": {
    title: "Integridade",
    description: "Verificação de integridade dos dados do ambiente demo.",
    relatedSprints: ["Sprint 25"],
  },
};
