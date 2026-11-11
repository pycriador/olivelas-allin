import {
  CatalogModuleEntity,
  CommercialPlanProposal,
  CompanyAllocatedEmployee,
  CompanyEntity,
  CompanyModuleSubscription,
  ContractEntity,
  OperationalEmployeeRole,
  PaymentMethodType,
  PlatformBillingRules,
} from '../types/domain';

const BILLING_RULES_STORAGE_KEY = 'olivelas_allin_platform_billing_rules_v1';
const PROPOSALS_STORAGE_KEY = 'olivelas_allin_commercial_proposals_v1';
const GDRIVE_CONFIG_STORAGE_KEY = 'olivelas_allin_gdrive_contract_config_v1';

export const OPERATIONAL_EMPLOYEE_ROLES: {
  role: OperationalEmployeeRole;
  label: string;
  badgeVariant: 'info' | 'success' | 'warning' | 'neutral';
  description: string;
  defaultApprovalLimit: number;
}[] = [
  {
    role: 'STORE_ADMIN',
    label: 'Admin da Unidade (Titular)',
    badgeVariant: 'info',
    description: 'Gestão completa da empresa/filial, equipe, estoque, financeiro local e aprovações de alçada.',
    defaultApprovalLimit: 50000,
  },
  {
    role: 'STOCK_APPROVER',
    label: 'Aprovador de Estoque & Lotes',
    badgeVariant: 'success',
    description: 'Autoriza baixas de inventário, ajustes FEFO, transferências entre matriz/filial e compras.',
    defaultApprovalLimit: 10000,
  },
  {
    role: 'FINANCE',
    label: 'Financeiro & Faturamento',
    badgeVariant: 'info',
    description: 'Opera contas a pagar/receber da unidade, conciliação local, emissão de notas e boletos.',
    defaultApprovalLimit: 5000,
  },
  {
    role: 'INVENTORY',
    label: 'Operador de Estoque / Almoxarife',
    badgeVariant: 'neutral',
    description: 'Executa conferência de entrada, endereçamento de lotes, expedição e contagem cíclica.',
    defaultApprovalLimit: 1500,
  },
  {
    role: 'SELLER',
    label: 'Vendedor / Operador de PDV',
    badgeVariant: 'warning',
    description: 'Realiza vendas no PDV omnichannel, emissão de pedidos, comandas e atendimento comercial.',
    defaultApprovalLimit: 500,
  },
  {
    role: 'VIEWER',
    label: 'Auditor / Consulta (Somente Leitura)',
    badgeVariant: 'neutral',
    description: 'Acesso estritamente consultivo para auditoria, qualidade, contabilidade externa ou diretoria.',
    defaultApprovalLimit: 0,
  },
];

export const DEFAULT_PLATFORM_BILLING_RULES: PlatformBillingRules = {
  defaultFreeEmployeesPerStore: 10,
  defaultExtraEmployeePrice: 19.9,
  gracePeriodDays: 5,
  autoBlockOverdue: true,
  pixKey: 'financeiro@olivelas.com.br',
  billingSupportWhatsapp: '5511999990000',
  notes:
    'Cada empresa cadastrada (Matriz ou Filial) possui franquia de 10 funcionários ativos gratuitos inclusos no contrato base. A partir do 11º funcionário ativo alocado na unidade, incide cobrança automática de licença adicional por colaborador.',
  updatedAt: '2026-11-10T12:00:00.000Z',
};

export function getPlatformBillingRules(): PlatformBillingRules {
  try {
    const raw = localStorage.getItem(BILLING_RULES_STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_BILLING_RULES;
    return { ...DEFAULT_PLATFORM_BILLING_RULES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PLATFORM_BILLING_RULES;
  }
}

export function savePlatformBillingRules(rules: PlatformBillingRules): PlatformBillingRules {
  const updated: PlatformBillingRules = {
    ...rules,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(BILLING_RULES_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
  return updated;
}

export interface CompanyLicenseAndBillingSummary {
  companyId: string;
  companyName: string;
  tradeName: string;
  isBranch: boolean;
  parentCompanyId?: string;
  parentCompanyName?: string;
  branchCode: string;
  childBranchesCount: number;
  adminOwnerName: string;
  adminOwnerEmail: string;
  adminOwnerPhone: string;
  allocatedEmployees: CompanyAllocatedEmployee[];
  activeEmployeesCount: number;
  inactiveEmployeesCount: number;
  totalEmployeesCount: number;
  freeLimit: number;
  hasCustomQuotaOverride: boolean;
  extraEmployeesCount: number;
  extraEmployeePrice: number;
  extraLicensesMonthlyCost: number;
  planName: string;
  activeModulesCount: number;
  basePlanMonthlyCost: number;
  totalMonthlyBilling: number;
  preferredPaymentMethod: PaymentMethodType;
  paymentStatus: 'ACTIVE' | 'PENDING' | 'PAST_DUE' | 'TRIAL' | 'SUSPENDED';
  nextBillingDueDate: string;
}

export function computeCompanyLicenseSummary(
  company: CompanyEntity,
  allCompanies: CompanyEntity[] = [],
  rules: PlatformBillingRules = getPlatformBillingRules(),
  companyModules: CompanyModuleSubscription[] = [],
  contracts: ContractEntity[] = [],
): CompanyLicenseAndBillingSummary {
  const employees = company.allocatedEmployees ?? [];
  const activeEmployeesCount = employees.filter((e) => e.active).length;
  const inactiveEmployeesCount = employees.length - activeEmployeesCount;

  const freeLimit =
    typeof company.freeEmployeesLimit === 'number'
      ? company.freeEmployeesLimit
      : rules.defaultFreeEmployeesPerStore;
  const extraEmployeePrice =
    typeof company.extraEmployeePrice === 'number'
      ? company.extraEmployeePrice
      : rules.defaultExtraEmployeePrice;

  const hasCustomQuotaOverride =
    (typeof company.freeEmployeesLimit === 'number' &&
      company.freeEmployeesLimit !== rules.defaultFreeEmployeesPerStore) ||
    (typeof company.extraEmployeePrice === 'number' &&
      company.extraEmployeePrice !== rules.defaultExtraEmployeePrice);

  const extraEmployeesCount = Math.max(0, activeEmployeesCount - freeLimit);
  const extraLicensesMonthlyCost = Number((extraEmployeesCount * extraEmployeePrice).toFixed(2));

  const activeCompanyContracts = contracts.filter(
    (c) => c.companyId === company.id && !c.archiveMetadata.isArchived,
  );
  const primaryContract =
    activeCompanyContracts.find((c) => c.status === 'active') ?? activeCompanyContracts[0];

  const activeSubs = companyModules.filter(
    (m) => m.companyId === company.id && m.status === 'active',
  );

  let basePlanMonthlyCost = 0;
  if (primaryContract) {
    basePlanMonthlyCost =
      primaryContract.billingCycle === 'yearly'
        ? Number((primaryContract.finalValue / 12).toFixed(2))
        : primaryContract.finalValue;
  } else if (activeSubs.length > 0) {
    basePlanMonthlyCost = activeSubs.reduce((acc, sub) => acc + sub.agreedPrice, 0);
  }

  const totalMonthlyBilling = Number((basePlanMonthlyCost + extraLicensesMonthlyCost).toFixed(2));

  const primaryContact = company.contacts?.[0];
  const adminEmployee = employees.find((e) => e.role === 'STORE_ADMIN');

  const parentCompany = company.parentCompanyId
    ? allCompanies.find((c) => c.id === company.parentCompanyId)
    : undefined;

  const childBranchesCount = allCompanies.filter(
    (c) => c.isBranch && c.parentCompanyId === company.id && !c.archiveMetadata.isArchived,
  ).length;

  let paymentStatus: 'ACTIVE' | 'PENDING' | 'PAST_DUE' | 'TRIAL' | 'SUSPENDED' =
    company.paymentStatus ?? 'ACTIVE';
  if (!company.paymentStatus) {
    if (company.operationalStatus === 'suspended') paymentStatus = 'SUSPENDED';
    else if (company.operationalStatus === 'pending') paymentStatus = 'PENDING';
    else paymentStatus = 'ACTIVE';
  }

  return {
    companyId: company.id,
    companyName: company.legalName,
    tradeName: company.tradeName,
    isBranch: Boolean(company.isBranch),
    parentCompanyId: company.parentCompanyId,
    parentCompanyName: parentCompany?.tradeName || parentCompany?.legalName,
    branchCode: company.branchCode || (company.isBranch ? 'FIL-01' : 'MATRIZ'),
    childBranchesCount,
    adminOwnerName:
      company.managerName || primaryContact?.name || adminEmployee?.name || 'Admin Titular',
    adminOwnerEmail:
      primaryContact?.email || adminEmployee?.email || 'financeiro@empresa.com.br',
    adminOwnerPhone: company.whatsapp || primaryContact?.phone || '+55 (11) 99999-0000',
    allocatedEmployees: employees,
    activeEmployeesCount,
    inactiveEmployeesCount,
    totalEmployeesCount: employees.length,
    freeLimit,
    hasCustomQuotaOverride,
    extraEmployeesCount,
    extraEmployeePrice,
    extraLicensesMonthlyCost,
    planName: primaryContract?.planName || 'Pacote Modular Allin',
    activeModulesCount: activeSubs.length || (primaryContract?.moduleIds.length ?? 0),
    basePlanMonthlyCost,
    totalMonthlyBilling,
    preferredPaymentMethod: company.preferredPaymentMethod || 'pix',
    paymentStatus,
    nextBillingDueDate: company.nextBillingDueDate || '2026-11-15',
  };
}

/**
 * Organizes companies hierarchically so each Matriz is followed immediately by its Filiais (`isBranch && parentCompanyId === matriz.id`).
 */
export function sortCompaniesHierarchically(companies: CompanyEntity[]): CompanyEntity[] {
  const byId = new Map(companies.map((c) => [c.id, c]));
  const matrizes = companies.filter((c) => !c.isBranch || !c.parentCompanyId || !byId.has(c.parentCompanyId));
  const result: CompanyEntity[] = [];
  const visited = new Set<string>();

  for (const matriz of matrizes) {
    if (visited.has(matriz.id)) continue;
    visited.add(matriz.id);
    result.push(matriz);

    const children = companies.filter(
      (c) => c.isBranch && c.parentCompanyId === matriz.id && !visited.has(c.id),
    );
    for (const child of children) {
      visited.add(child.id);
      result.push(child);
    }
  }

  for (const leftover of companies) {
    if (!visited.has(leftover.id)) {
      result.push(leftover);
    }
  }

  return result;
}

export const INITIAL_COMMERCIAL_PROPOSALS: CommercialPlanProposal[] = [
  {
    id: 'prop-2026-001',
    companyName: 'Rede Hortifruti Vale Verde Ltda.',
    companyTradeName: 'Hortifruti Vale Verde (Matriz + 2 Filiais)',
    customerName: 'Roberto Cavalcanti',
    customerDocument: '33.819.402/0001-71',
    customerEmail: 'roberto@valeverdehorti.com.br',
    customerPhone: '5511988112233',
    selectedPlanName: 'Allin Multi-Loja Estoque & PDV',
    selectedModuleIds: ['mod_gestao_estoque', 'mod_sistema_mercado', 'mod-core', 'mod-financeiro'],
    billingCycle: 'monthly',
    estimatedMonthlyValue: 980,
    estimatedEmployeesCount: 14,
    preferredPaymentMethod: 'pix',
    status: 'NEW',
    notes: 'Cliente solicitou implantação para Matriz em Campinas e 2 filiais com controle FEFO de perecíveis.',
    createdAt: '2026-11-08T14:20:00.000Z',
  },
  {
    id: 'prop-2026-002',
    companyName: 'Clínica Integrada Bem Estar & Odonto S.A.',
    companyTradeName: 'Clínica Bem Estar',
    customerName: 'Dra. Patrícia Medeiros',
    customerDocument: '14.209.511/0001-08',
    customerEmail: 'diretoria@clinicabemestar.med.br',
    customerPhone: '5521997418800',
    selectedPlanName: 'Allin Saúde & Clínicas Pro',
    selectedModuleIds: ['mod_agendamentos', 'mod_agendamento_simples', 'mod-core', 'mod-financeiro'],
    billingCycle: 'yearly',
    estimatedMonthlyValue: 649,
    estimatedEmployeesCount: 9,
    preferredPaymentMethod: 'credit_card',
    status: 'CONTACTED',
    notes: 'Dentro da cota gratuita de 10 funcionários. Deseja assinatura anual com 10% de desconto via cartão.',
    createdAt: '2026-11-06T10:15:00.000Z',
  },
  {
    id: 'prop-2026-003',
    companyName: 'Gastronomia & Eventos Dom Pedro Ltda.',
    companyTradeName: 'Restaurante Dom Pedro',
    customerName: 'Henrique Albuquerque',
    customerDocument: '47.901.223/0001-65',
    customerEmail: 'henrique@restdompedro.com.br',
    customerPhone: '5531991023344',
    selectedPlanName: 'Allin Food Service, KDS & Delivery',
    selectedModuleIds: ['mod_restaurante', 'mod_sistema_delivery', 'mod_gestao_estoque', 'mod-financeiro'],
    billingCycle: 'monthly',
    estimatedMonthlyValue: 1190,
    estimatedEmployeesCount: 16,
    preferredPaymentMethod: 'boleto',
    status: 'CONTRACT_GENERATED',
    notes: '16 colaboradores previstos (10 na franquia gratuita + 6 licenças adicionais de garçom/KDS).',
    createdAt: '2026-11-03T16:40:00.000Z',
  },
];

export function listCommercialProposals(): CommercialPlanProposal[] {
  try {
    const raw = localStorage.getItem(PROPOSALS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(INITIAL_COMMERCIAL_PROPOSALS));
      return INITIAL_COMMERCIAL_PROPOSALS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COMMERCIAL_PROPOSALS;
  }
}

export function saveCommercialProposal(proposal: CommercialPlanProposal): CommercialPlanProposal[] {
  const list = listCommercialProposals();
  const idx = list.findIndex((p) => p.id === proposal.id);
  const next = idx >= 0 ? list.map((p, i) => (i === idx ? proposal : p)) : [proposal, ...list];
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function updateCommercialProposalStatus(
  id: string,
  status: CommercialPlanProposal['status'],
  contractId?: string,
): CommercialPlanProposal[] {
  const list = listCommercialProposals();
  const next = list.map((p) =>
    p.id === id ? { ...p, status, ...(contractId ? { contractId } : {}) } : p,
  );
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function deleteCommercialProposal(id: string): CommercialPlanProposal[] {
  const list = listCommercialProposals().filter((p) => p.id !== id);
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  return list;
}

export const CONTRACT_TEMPLATE_VARIABLES: { token: string; label: string }[] = [
  { token: '{{NUMERO_CONTRATO}}', label: 'Nº do Contrato' },
  { token: '{{MEU_NOME}}', label: 'Contratada (Meu Nome)' },
  { token: '{{NOME_CLIENTE}}', label: 'Nome do Cliente / Empresa' },
  { token: '{{DOCUMENTO_CLIENTE}}', label: 'CNPJ / CPF Cliente' },
  { token: '{{EMAIL_CLIENTE}}', label: 'E-mail Cliente' },
  { token: '{{TELEFONE_CLIENTE}}', label: 'Telefone Cliente' },
  { token: '{{PRODUTO_COMPRADO}}', label: 'Plano / Produto Base' },
  { token: '{{MODULOS_ADICIONAIS}}', label: 'Módulos Contratados' },
  { token: '{{CICLO_COBRANCA}}', label: 'Ciclo (Mensal/Anual)' },
  { token: '{{VALOR_TOTAL}}', label: 'Valor Líquido Final' },
  { token: '{{FORMA_PAGAMENTO}}', label: 'Forma de Pagamento' },
  { token: '{{DATA_VIGENCIA}}', label: 'Período de Vigência' },
];

export const DEFAULT_CONTRACT_TERMS_TEMPLATE = `CLÁUSULA 1ª — DO OBJETO E LICENCIAMENTO DE SOFTWARE (SaaS)
O presente instrumento tem por objeto o licenciamento de uso não exclusivo, intransferível e temporário da plataforma corporativa Olivelas Allin ({{PRODUTO_COMPRADO}}), disponibilizada na modalidade Software as a Service (SaaS) em nuvem pela CONTRATADA ({{MEU_NOME}}) em favor da CONTRATANTE ({{NOME_CLIENTE}}, inscrita sob o documento {{DOCUMENTO_CLIENTE}}), contemplando os módulos: {{MODULOS_ADICIONAIS}}.

CLÁUSULA 2ª — DA HIERARQUIA MATRIZ/FILIAL E FRANQUIA DE 10 FUNCIONÁRIOS GRATUITOS
2.1. Cada unidade empresarial cadastrada (Matriz ou Filial vinculada) possui direito a uma franquia gratuita de até 10 (dez) funcionários operacionais ativos simultaneamente inclusos no valor base do plano contratado.
2.2. Caso a CONTRATANTE aloque colaboradores ativos acima do limite gratuito de 10 (dez) usuários na unidade, será acrescido automaticamente à fatura mensal o valor unitário de R$ 19,90 (dezenove reais e noventa centavos) por licença extra ativa, ou valor específico acordado no painel de regras da empresa.

CLÁUSULA 3ª — DO VALOR, FATURAMENTO POR EMPRESA E CONDIÇÕES DE PAGAMENTO
3.1. Pelos serviços e licenças ora contratados no ciclo {{CICLO_COBRANCA}}, a CONTRATANTE pagará à CONTRATADA o valor líquido de {{VALOR_TOTAL}}, mediante {{FORMA_PAGAMENTO}}.
3.2. O atraso no pagamento superior ao prazo de carência operacional (5 dias corridos) implicará multa moratória de 2% (dois por cento), juros de 1% ao mês pro rata die e suspensão preventiva do acesso até a conciliação da fatura.

CLÁUSULA 4ª — DA DISPONIBILIDADE (SLA), ISOLAMENTO MULTITENANT E SUPORTE TÉCNICO
4.1. A CONTRATADA garante índice de disponibilidade (SLA) de 99,5% ao mês, com isolamento lógico estrito dos dados da CONTRATANTE, backups diários automatizados e suporte técnico integrado via central de chamados e WhatsApp corporativo.

CLÁUSULA 5ª — DA PROTEÇÃO DE DADOS PESSOAIS (LGPD — LEI Nº 13.709/2018)
5.1. As partes obrigam-se a cumprir integralmente a Lei Geral de Proteção de Dados Pessoais (LGPD). Os dados operacionais, cadastros de clientes, lotes de estoque e lançamentos financeiros inseridos na plataforma são de titularidade exclusiva da CONTRATANTE (Controladora), atuando a CONTRATADA estritamente como Operadora tecnológica.

CLÁUSULA 6ª — DA VIGÊNCIA, AUDITORIA IMUTÁVEL E ASSINATURA ELETRÔNICA
6.1. Este contrato entra em vigor no período de {{DATA_VIGENCIA}}, sendo renovado automaticamente por iguais períodos, salvo manifestação expressa com aviso prévio mínimo de 30 (trinta) dias.
6.2. As partes reconhecem a validade jurídica plena da assinatura eletrônica com hash criptográfico SHA-256 registrada neste instrumento, nos termos da Medida Provisória nº 2.200-2/2001 e da Lei nº 14.063/2020.

CLÁUSULA 7ª — DO FORO
Fica eleito o Foro da Comarca da sede da CONTRATADA para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia expressa a qualquer outro, por mais privilegiado que seja.`;

export function interpolateContractTerms(
  rawText: string,
  contract: ContractEntity,
  catalogModules: CatalogModuleEntity[],
): string {
  const moduleNames =
    contract.moduleIds
      .map((id) => catalogModules.find((m) => m.id === id)?.name['pt-BR'] || id)
      .join(', ') || 'Pacote Core Allin';

  const cycleLabel = contract.billingCycle === 'yearly' ? 'Anual' : 'Mensal';
  const formattedTotal = contract.finalValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: contract.currency || 'BRL',
  });

  const vigText = contract.endDate
    ? `${contract.startDate} até ${contract.endDate}`
    : `a partir de ${contract.startDate} (Prazo Indeterminado)`;

  return (rawText || DEFAULT_CONTRACT_TERMS_TEMPLATE)
    .replace(/\{\{NUMERO_CONTRATO\}\}/g, contract.code || 'CTR-2026-0001')
    .replace(
      /\{\{MEU_NOME\}\}/g,
      contract.providerName || 'Olivelas Tecnologia & Sistemas Allin Ltda.',
    )
    .replace(/\{\{NOME_CLIENTE\}\}/g, contract.companyName || 'Empresa Contratante')
    .replace(/\{\{DOCUMENTO_CLIENTE\}\}/g, contract.customerDocument || 'CNPJ sob consulta')
    .replace(/\{\{EMAIL_CLIENTE\}\}/g, contract.customerEmail || 'contato@empresa.com.br')
    .replace(/\{\{TELEFONE_CLIENTE\}\}/g, contract.customerPhone || '+55 (11) 99999-0000')
    .replace(/\{\{PRODUTO_COMPRADO\}\}/g, contract.planName || 'Plano Enterprise Allin')
    .replace(/\{\{MODULOS_ADICIONAIS\}\}/g, moduleNames)
    .replace(/\{\{CICLO_COBRANCA\}\}/g, cycleLabel)
    .replace(/\{\{VALOR_TOTAL\}\}/g, formattedTotal)
    .replace(
      /\{\{FORMA_PAGAMENTO\}\}/g,
      contract.paymentTerms || 'PIX / Boleto Bancário / Cartão Corporativo',
    )
    .replace(/\{\{DATA_VIGENCIA\}\}/g, vigText);
}

export function buildContractPrintHTML(
  contract: ContractEntity,
  catalogModules: CatalogModuleEntity[],
): string {
  const resolvedTerms = interpolateContractTerms(
    contract.clausesText || DEFAULT_CONTRACT_TERMS_TEMPLATE,
    contract,
    catalogModules,
  );
  const termsHtml = resolvedTerms
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<div style="height: 8px;"></div>';
      if (trimmed.startsWith('CLÁUSULA')) {
        return `<h4 style="margin: 16px 0 6px; font-size: 11pt; color: #0f172a; font-weight: 700; text-transform: uppercase;">${trimmed}</h4>`;
      }
      return `<p style="margin: 4px 0; font-size: 10.5pt; line-height: 1.65; color: #1e293b; text-align: justify;">${trimmed}</p>`;
    })
    .join('');

  const moduleRows = contract.moduleIds
    .map((id, index) => {
      const mod = catalogModules.find((m) => m.id === id);
      const modName = mod?.name['pt-BR'] || id;
      const modPrice = mod
        ? (contract.billingCycle === 'yearly' ? mod.priceYearly : mod.priceMonthly).toLocaleString(
            'pt-BR',
            { style: 'currency', currency: contract.currency || 'BRL' },
          )
        : 'Incluso';
      return `<tr>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1;">Item ${index + 1} — ${modName}</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: center;">${
          contract.billingCycle === 'yearly' ? 'Anual' : 'Mensal'
        }</td>
        <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;">${modPrice}</td>
      </tr>`;
    })
    .join('');

  const latestSignature = contract.signatures?.[contract.signatures.length - 1];

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Contrato ${contract.code} - ${contract.companyName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
    }
    .container { max-width: 780px; margin: 0 auto; }
    .header {
      border-bottom: 3px solid #1e3a8a;
      padding-bottom: 16px;
      margin-bottom: 22px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .title { font-size: 15pt; font-weight: 800; color: #0f172a; margin: 0; }
    .subtitle { font-size: 9.5pt; color: #475569; margin-top: 4px; }
    .badge {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-weight: 700;
      font-size: 9pt;
      padding: 4px 10px;
      border-radius: 6px;
    }
    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 20px;
    }
    .party-box {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 14px;
      background: #f8fafc;
      font-size: 9.5pt;
      line-height: 1.5;
    }
    .party-title {
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      color: #1e3a8a;
      margin-bottom: 6px;
      letter-spacing: 0.05em;
    }
    table { width: 100%; border-collapse: collapse; margin: 14px 0 22px; font-size: 9.5pt; }
    th { background: #0f172a; color: #ffffff; text-align: left; padding: 9px 10px; border: 1px solid #0f172a; }
    .signatures {
      margin-top: 48px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 36px;
      page-break-inside: avoid;
    }
    .sig-box {
      border-top: 1.5px solid #0f172a;
      padding-top: 10px;
      text-align: center;
      font-size: 9.5pt;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 class="title">CONTRATO DE LICENCIAMENTO SaaS &amp; PRESTAÇÃO DE SERVIÇOS</h1>
        <div class="subtitle">Ecossistema Corporativo Multitenant Olivelas Allin • Versão v${contract.version}</div>
      </div>
      <div style="text-align: right;">
        <span class="badge">Nº ${contract.code}</span>
        <div style="font-size: 8.5pt; color: #64748b; margin-top: 4px;">Vigência: ${contract.startDate} a ${contract.endDate}</div>
      </div>
    </div>

    <div class="parties-grid">
      <div class="party-box">
        <div class="party-title">1. CONTRATADA (PROVEDORA SaaS)</div>
        <div><strong>Razão Social:</strong> ${contract.providerName || 'Olivelas Tecnologia & Sistemas Allin Ltda.'}</div>
        <div><strong>CNPJ:</strong> ${contract.providerDocument || '48.192.001/0001-90'}</div>
        <div><strong>E-mail Oficial:</strong> ${contract.providerEmail || 'contratos@olivelas.com.br'}</div>
        <div><strong>Representante:</strong> ${contract.providerRepresentative || contract.commercialResponsible || 'Willian Jesus'}</div>
      </div>
      <div class="party-box">
        <div class="party-title">2. CONTRATANTE (EMPRESA CLIENTE)</div>
        <div><strong>Empresa:</strong> ${contract.companyName}</div>
        <div><strong>CNPJ / Documento:</strong> ${contract.customerDocument || '18.492.310/0001-54'}</div>
        <div><strong>E-mail:</strong> ${contract.customerEmail || 'financeiro@empresa.com.br'}</div>
        <div><strong>Telefone / WhatsApp:</strong> ${contract.customerPhone || '+55 (11) 99999-0000'}</div>
      </div>
    </div>

    <h4 style="margin: 14px 0 6px; font-size: 10.5pt; color: #0f172a; text-transform: uppercase;">QUADRO RESUMO COMERCIAL — PLANO: ${contract.planName}</h4>
    <table>
      <thead>
        <tr>
          <th>Módulo / Escopo Contratado</th>
          <th style="text-align: center; width: 110px;">Ciclo</th>
          <th style="text-align: right; width: 150px;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${moduleRows}
        <tr style="background: #f8fafc;">
          <td colspan="2" style="padding: 8px 10px; border: 1px solid #cbd5e1;"><strong>Franquia de Equipe Inclusa por Unidade (Matriz/Filial)</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right;"><strong>${contract.freeEmployeesQuota ?? 10} Funcionários Grátis</strong></td>
        </tr>
        ${
          contract.discountValue > 0
            ? `<tr>
          <td colspan="2" style="padding: 8px 10px; border: 1px solid #cbd5e1; color: #15803d;"><strong>Desconto Comercial Concedido</strong></td>
          <td style="padding: 8px 10px; border: 1px solid #cbd5e1; text-align: right; color: #15803d;">- ${contract.discountValue.toLocaleString('pt-BR', { style: 'currency', currency: contract.currency || 'BRL' })}</td>
        </tr>`
            : ''
        }
        <tr style="background: #eff6ff; font-size: 10.5pt;">
          <td colspan="2" style="padding: 10px; border: 1px solid #bfdbfe;"><strong>VALOR LÍQUIDO DO CONTRATO (${contract.billingCycle === 'yearly' ? 'ANUAL' : 'MENSAL'})</strong></td>
          <td style="padding: 10px; border: 1px solid #bfdbfe; text-align: right; color: #1d4ed8;"><strong>${contract.finalValue.toLocaleString('pt-BR', { style: 'currency', currency: contract.currency || 'BRL' })}</strong></td>
        </tr>
      </tbody>
    </table>

    <div>${termsHtml}</div>

    <div class="signatures">
      <div class="sig-box">
        <strong>${contract.providerName || 'Olivelas Tecnologia & Sistemas Allin Ltda.'}</strong><br />
        <span>Representante: ${contract.providerRepresentative || contract.commercialResponsible || 'Willian Jesus'}</span><br />
        <small style="color: #64748b;">CONTRATADA</small>
      </div>
      <div class="sig-box">
        <strong>${contract.companyName}</strong><br />
        <span>${latestSignature ? `Assinado por: ${latestSignature.signerName} (${latestSignature.signerDocument})` : 'Aguardando Assinatura do Representante Legal'}</span><br />
        <small style="color: #64748b;">CONTRATANTE ${latestSignature ? `• Hash: ${latestSignature.acceptanceHash}` : ''}</small>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function exportContractAsHTML(
  contract: ContractEntity,
  catalogModules: CatalogModuleEntity[],
): void {
  const html = buildContractPrintHTML(contract, catalogModules);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contract.code}_${contract.companyName.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportContractAsDOCX(
  contract: ContractEntity,
  catalogModules: CatalogModuleEntity[],
): void {
  const html = buildContractPrintHTML(contract, catalogModules);
  const wordDoc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset="utf-8"><title>${contract.code}</title></head>
  <body>${html}</body></html>`;
  const blob = new Blob(['\ufeff', wordDoc], {
    type: 'application/msword;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${contract.code}_${contract.companyName.replace(/\s+/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportContractAsPDF(
  contract: ContractEntity,
  catalogModules: CatalogModuleEntity[],
): void {
  const html = buildContractPrintHTML(contract, catalogModules);
  const printWin = window.open('', '_blank', 'width=960,height=800');
  if (!printWin) {
    exportContractAsHTML(contract, catalogModules);
    return;
  }
  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  setTimeout(() => {
    printWin.print();
  }, 350);
}

export interface GoogleDriveContractConfig {
  enabled: boolean;
  folderId: string;
  folderName: string;
  webhookOrScriptUrl: string;
  autoSyncOnSave: boolean;
  updatedAt: string;
}

export function getGoogleDriveConfig(): GoogleDriveContractConfig {
  try {
    const raw = localStorage.getItem(GDRIVE_CONFIG_STORAGE_KEY);
    if (!raw) {
      return {
        enabled: true,
        folderId: '1OlivelasAllinContratosCorporativos2026',
        folderName: 'Olivelas Allin — Contratos & Minutas Assinadas',
        webhookOrScriptUrl: 'https://drive.google.com/drive/folders/1OlivelasAllinContratosCorporativos2026',
        autoSyncOnSave: true,
        updatedAt: '2026-11-10T10:00:00.000Z',
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      enabled: true,
      folderId: '1OlivelasAllinContratosCorporativos2026',
      folderName: 'Olivelas Allin — Contratos & Minutas Assinadas',
      webhookOrScriptUrl: 'https://drive.google.com/drive/folders/1OlivelasAllinContratosCorporativos2026',
      autoSyncOnSave: true,
      updatedAt: '2026-11-10T10:00:00.000Z',
    };
  }
}

export function saveGoogleDriveConfig(
  config: Omit<GoogleDriveContractConfig, 'updatedAt'>,
): GoogleDriveContractConfig {
  const next: GoogleDriveContractConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(GDRIVE_CONFIG_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
