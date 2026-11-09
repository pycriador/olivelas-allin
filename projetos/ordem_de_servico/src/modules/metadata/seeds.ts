import { getStorage } from "@/core/providers/storage";
import type {
  MetadataEntity, MetadataField, MetadataForm, FormTab, FormSection,
  MetadataView, ViewColumn, MetadataDashboard, DashboardWidget,
  MetadataTemplate, MetadataVersion, FieldType,
} from "./types";
import { FIELD_TYPE_LABELS } from "./types";

const ENTITIES_COL = "metadata_entities";
const FIELDS_COL = "metadata_fields";
const FORMS_COL = "metadata_forms";
const VIEWS_COL = "metadata_views";
const DASHBOARDS_COL = "metadata_dashboards";
const TEMPLATES_COL = "metadata_templates";
const VERSIONS_COL = "metadata_versions";

function daysAgo(d: number): string {
  const date = new Date(); date.setDate(date.getDate() - d); return date.toISOString();
}

const ENTITIES: Omit<MetadataEntity, "id">[] = [
  { name: "empresa", pluralName: "empresas", description: "Empresas cadastradas na plataforma", icon: "Building2", category: "platform", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(180), updatedAt: daysAgo(1), level: "global" },
  { name: "usuario", pluralName: "usuarios", description: "Usuários do sistema", icon: "Users", category: "platform", status: "active", auditable: true, hasFiles: false, hasTimeline: true, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(170), updatedAt: daysAgo(1), level: "global" },
  { name: "cliente", pluralName: "clientes", description: "Clientes das empresas", icon: "UserCheck", category: "business", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: true, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(160), updatedAt: daysAgo(2), level: "company" },
  { name: "aparelho", pluralName: "aparelhos", description: "Equipamentos recebidos para assistência", icon: "Cpu", category: "business", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: true, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(150), updatedAt: daysAgo(2), level: "company" },
  { name: "tecnico", pluralName: "tecnicos", description: "Técnicos responsáveis pelos serviços", icon: "Wrench", category: "business", status: "active", auditable: true, hasFiles: false, hasTimeline: true, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(140), updatedAt: daysAgo(3), level: "company" },
  { name: "peca", pluralName: "pecas", description: "Peças e componentes utilizados nos reparos", icon: "Package", category: "inventory", status: "active", auditable: true, hasFiles: true, hasTimeline: false, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(130), updatedAt: daysAgo(3), level: "company" },
  { name: "fornecedor", pluralName: "fornecedores", description: "Fornecedores de peças e serviços", icon: "Truck", category: "inventory", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(120), updatedAt: daysAgo(4), level: "company" },
  { name: "ordem_servico", pluralName: "ordens_servico", description: "Ordens de serviço de assistência técnica", icon: "FileText", category: "business", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: true, hasVersioning: true, companyId: null, version: 1, createdAt: daysAgo(110), updatedAt: daysAgo(4), level: "company" },
  { name: "pagamento", pluralName: "pagamentos", description: "Pagamentos recebidos e realizados", icon: "DollarSign", category: "financial", status: "active", auditable: true, hasFiles: false, hasTimeline: false, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(100), updatedAt: daysAgo(5), level: "company" },
  { name: "documento", pluralName: "documentos", description: "Documentos gerados pelo sistema", icon: "File", category: "documents", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: false, hasVersioning: true, companyId: null, version: 1, createdAt: daysAgo(90), updatedAt: daysAgo(5), level: "company" },
  { name: "comunicacao", pluralName: "comunicacoes", description: "Registros de comunicação com clientes", icon: "MessageSquare", category: "communication", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: true, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(80), updatedAt: daysAgo(6), level: "company" },
  { name: "categoria", pluralName: "categorias", description: "Categorias para classificação de produtos e serviços", icon: "Tag", category: "platform", status: "active", auditable: false, hasFiles: false, hasTimeline: false, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(70), updatedAt: daysAgo(6), level: "global" },
  { name: "contrato", pluralName: "contratos", description: "Contratos de prestação de serviços", icon: "FileSignature", category: "documents", status: "active", auditable: true, hasFiles: true, hasTimeline: true, hasComments: true, hasVersioning: true, companyId: null, version: 1, createdAt: daysAgo(60), updatedAt: daysAgo(7), level: "company" },
  { name: "estoque", pluralName: "estoques", description: "Controle de estoque de peças e materiais", icon: "Warehouse", category: "inventory", status: "active", auditable: true, hasFiles: false, hasTimeline: true, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(50), updatedAt: daysAgo(7), level: "company" },
  { name: "relatorio", pluralName: "relatorios", description: "Relatórios gerenciais do sistema", icon: "BarChart3", category: "admin", status: "active", auditable: true, hasFiles: true, hasTimeline: false, hasComments: false, hasVersioning: false, companyId: null, version: 1, createdAt: daysAgo(40), updatedAt: daysAgo(8), level: "global" },
];

function generateFields(entityName: string, entityId: string, startOrder: number): Omit<MetadataField, "id">[] {
  const common = { entityId, companyId: null, version: 1, level: "global" as const, status: "active" as const, createdAt: daysAgo(30), updatedAt: daysAgo(1) };
  const now = daysAgo(0);

  const fields: Record<string, Omit<MetadataField, "id">[]> = {
    empresa: [
      { name: "logo", label: "Logo", type: "image", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "", tooltip: "Logotipo da empresa", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "nome_fantasia", label: "Nome Fantasia", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: ServiceForge", tooltip: "Nome comercial", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "razao_social", label: "Razão Social", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Razão social completa", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 3, width: 12, ...common, createdAt: now, updatedAt: now },
      { name: "cnpj", label: "CNPJ", type: "cnpj", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "00.000.000/0001-00", tooltip: "Cadastro Nacional da Pessoa Jurídica", mask: "00.000.000/0000-00", regex: "", validation: "cnpj", group: "Documentação", order: 4, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "ie", label: "Inscrição Estadual", type: "text", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "ISENTO", tooltip: "", mask: "", regex: "", validation: "", group: "Documentação", order: 5, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "telefone", label: "Telefone", type: "phone", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "(11) 4000-0000", tooltip: "", mask: "(00) 0000-0000", regex: "", validation: "", group: "Contato", order: 6, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "whatsapp", label: "WhatsApp", type: "phone", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "(11) 98888-0000", tooltip: "", mask: "(00) 00000-0000", regex: "", validation: "", group: "Contato", order: 7, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "email", label: "Email", type: "email", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "contato@empresa.com", tooltip: "", mask: "", regex: "", validation: "email", group: "Contato", order: 8, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "site", label: "Website", type: "url", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "https://", tooltip: "", mask: "", regex: "", validation: "", group: "Contato", order: 9, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "cep", label: "CEP", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "00000-000", tooltip: "", mask: "00000-000", regex: "", validation: "", group: "Endereço", order: 10, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "endereco", label: "Endereço", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Logradouro", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 11, width: 9, ...common, createdAt: now, updatedAt: now },
      { name: "numero", label: "Número", type: "text", required: true, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "S/N", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 12, width: 2, ...common, createdAt: now, updatedAt: now },
      { name: "complemento", label: "Complemento", type: "text", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "Sala, andar, etc", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 13, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "bairro", label: "Bairro", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 14, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "cidade", label: "Cidade", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 15, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "estado", label: "Estado", type: "list", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "SP", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 16, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "pais", label: "País", type: "text", required: true, visible: true, editable: true, searchable: false, unique: false, defaultValue: "Brasil", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 17, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "status", label: "Status", type: "status", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "active", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Configuração", order: 18, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "observacoes", label: "Observações", type: "longtext", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Observações internas", tooltip: "", mask: "", regex: "", validation: "", group: "Configuração", order: 19, width: 12, ...common, createdAt: now, updatedAt: now },
    ],
    usuario: [
      { name: "foto", label: "Foto", type: "image", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "", tooltip: "Foto do usuário", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "nome", label: "Nome Completo", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Nome completo", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 9, ...common, createdAt: now, updatedAt: now },
      { name: "email", label: "Email", type: "email", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "usuario@email.com", tooltip: "", mask: "", regex: "", validation: "email", group: "Contato", order: 3, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "telefone", label: "Telefone", type: "phone", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "(00) 0000-0000", tooltip: "", mask: "(00) 0000-0000", regex: "", validation: "", group: "Contato", order: 4, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "cpf", label: "CPF", type: "cpf", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "000.000.000-00", tooltip: "", mask: "000.000.000-00", regex: "", validation: "cpf", group: "Documentação", order: 5, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "cargo", label: "Cargo", type: "text", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: Técnico", tooltip: "", mask: "", regex: "", validation: "", group: "Profissional", order: 6, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "departamento", label: "Departamento", type: "list", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Profissional", order: 7, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "data_admissao", label: "Data de Admissão", type: "date", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Profissional", order: 8, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "status", label: "Status", type: "status", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "active", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Configuração", order: 9, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "ultimo_acesso", label: "Último Acesso", type: "datetime", required: false, visible: true, editable: false, searchable: false, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Auditoria", order: 10, width: 6, ...common, createdAt: now, updatedAt: now },
    ],
    cliente: [
      { name: "foto", label: "Foto", type: "image", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "nome", label: "Nome", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Nome do cliente", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 9, ...common, createdAt: now, updatedAt: now },
      { name: "tipo_pessoa", label: "Tipo de Pessoa", type: "list", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "fisica", placeholder: "", tooltip: "Física ou Jurídica", mask: "", regex: "", validation: "", group: "Identificação", order: 3, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "cpf_cnpj", label: "CPF/CNPJ", type: "text", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "000.000.000-00", tooltip: "", mask: "", regex: "", validation: "", group: "Documentação", order: 4, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "rg_ie", label: "RG/IE", type: "text", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Documentação", order: 5, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "telefone", label: "Telefone", type: "phone", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "(00) 0000-0000", tooltip: "", mask: "(00) 0000-0000", regex: "", validation: "", group: "Contato", order: 6, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "whatsapp", label: "WhatsApp", type: "phone", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "(00) 00000-0000", tooltip: "", mask: "(00) 00000-0000", regex: "", validation: "", group: "Contato", order: 7, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "email", label: "Email", type: "email", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "cliente@email.com", tooltip: "", mask: "", regex: "", validation: "email", group: "Contato", order: 8, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "cep", label: "CEP", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "00000-000", tooltip: "", mask: "00000-000", regex: "", validation: "", group: "Endereço", order: 9, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "endereco", label: "Endereço", type: "text", required: true, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "Logradouro", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 10, width: 9, ...common, createdAt: now, updatedAt: now },
      { name: "cidade", label: "Cidade", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 11, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "estado", label: "Estado", type: "list", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "SP", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Endereço", order: 12, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "data_cadastro", label: "Data de Cadastro", type: "date", required: false, visible: true, editable: false, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Auditoria", order: 13, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "observacoes", label: "Observações", type: "longtext", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Informações adicionais", tooltip: "", mask: "", regex: "", validation: "", group: "Informações", order: 14, width: 12, ...common, createdAt: now, updatedAt: now },
    ],
    aparelho: [
      { name: "foto", label: "Foto do Aparelho", type: "image", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "cliente_id", label: "Cliente", type: "relationship", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione o cliente", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 8, ...common, createdAt: now, updatedAt: now },
      { name: "tipo", label: "Tipo de Aparelho", type: "list", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: Smartphone", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 3, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "marca", label: "Marca", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: Samsung", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 4, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "modelo", label: "Modelo", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: Galaxy S24", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 5, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "numero_serie", label: "Número de Série", type: "text", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "SN-", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 6, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "cor", label: "Cor", type: "color", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "#000000", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Características", order: 7, width: 2, ...common, createdAt: now, updatedAt: now },
      { name: "ano_fabricacao", label: "Ano de Fabricação", type: "number", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "2024", tooltip: "", mask: "", regex: "", validation: "", group: "Características", order: 8, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "condicao", label: "Condição", type: "list", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "bom", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Características", order: 9, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "acessorios", label: "Acessórios", type: "longtext", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "Carregador, capa, etc", tooltip: "", mask: "", regex: "", validation: "", group: "Informações", order: 10, width: 12, ...common, createdAt: now, updatedAt: now },
      { name: "defeito_relatado", label: "Defeito Relatado", type: "longtext", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Descrição do problema", tooltip: "", mask: "", regex: "", validation: "", group: "Informações", order: 11, width: 12, ...common, createdAt: now, updatedAt: now },
    ],
    ordem_servico: [
      { name: "numero", label: "Nº OS", type: "text", required: true, visible: true, editable: false, searchable: true, unique: true, defaultValue: "", placeholder: "OS-2024-0001", tooltip: "Número automático", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "cliente_id", label: "Cliente", type: "relationship", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 8, ...common, createdAt: now, updatedAt: now },
      { name: "aparelho_id", label: "Aparelho", type: "relationship", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 3, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "tecnico_id", label: "Técnico Responsável", type: "relationship", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 4, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "data_abertura", label: "Data de Abertura", type: "datetime", required: true, visible: true, editable: false, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Datas", order: 5, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "data_previsao", label: "Previsão de Entrega", type: "date", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Datas", order: 6, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "data_conclusao", label: "Data de Conclusão", type: "datetime", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Datas", order: 7, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "status", label: "Status", type: "status", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "aberto", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Andamento", order: 8, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "prioridade", label: "Prioridade", type: "list", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "normal", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Andamento", order: 9, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "categoria", label: "Categoria", type: "lookup", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Andamento", order: 10, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "defeito", label: "Defeito Relatado", type: "longtext", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Descrição detalhada", tooltip: "", mask: "", regex: "", validation: "", group: "Serviço", order: 11, width: 12, ...common, createdAt: now, updatedAt: now },
      { name: "servicos_realizados", label: "Serviços Realizados", type: "richtext", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Descreva os serviços", tooltip: "", mask: "", regex: "", validation: "", group: "Serviço", order: 12, width: 12, ...common, createdAt: now, updatedAt: now },
      { name: "valor_mao_obra", label: "Valor Mão de Obra", type: "currency", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "0,00", tooltip: "", mask: "", regex: "", validation: "", group: "Financeiro", order: 13, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "valor_pecas", label: "Valor Peças", type: "currency", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "0,00", tooltip: "", mask: "", regex: "", validation: "", group: "Financeiro", order: 14, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "valor_total", label: "Valor Total", type: "currency", required: false, visible: true, editable: false, searchable: false, unique: false, defaultValue: "", placeholder: "0,00", tooltip: "Calculado automaticamente", mask: "", regex: "", validation: "", group: "Financeiro", order: 15, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "forma_pagamento", label: "Forma de Pagamento", type: "list", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Financeiro", order: 16, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "observacoes", label: "Observações Internas", type: "longtext", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "Anotações internas", tooltip: "", mask: "", regex: "", validation: "", group: "Informações", order: 17, width: 12, ...common, createdAt: now, updatedAt: now },
    ],
    peca: [
      { name: "codigo", label: "Código", type: "text", required: true, visible: true, editable: true, searchable: true, unique: true, defaultValue: "", placeholder: "PEC-001", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "nome", label: "Nome da Peça", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: Tela Galaxy S24", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 8, ...common, createdAt: now, updatedAt: now },
      { name: "categoria", label: "Categoria", type: "lookup", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 3, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "marca", label: "Marca", type: "text", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Ex: Samsung", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 4, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "preco_custo", label: "Preço de Custo", type: "currency", required: true, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "0,00", tooltip: "", mask: "", regex: "", validation: "", group: "Financeiro", order: 5, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "preco_venda", label: "Preço de Venda", type: "currency", required: true, visible: true, editable: true, searchable: false, unique: false, defaultValue: "", placeholder: "0,00", tooltip: "", mask: "", regex: "", validation: "", group: "Financeiro", order: 6, width: 4, ...common, createdAt: now, updatedAt: now },
      { name: "estoque_minimo", label: "Estoque Mínimo", type: "number", required: false, visible: true, editable: true, searchable: false, unique: false, defaultValue: "5", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Controle", order: 7, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "estoque_atual", label: "Estoque Atual", type: "number", required: true, visible: true, editable: true, searchable: false, unique: false, defaultValue: "0", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Controle", order: 8, width: 3, ...common, createdAt: now, updatedAt: now },
      { name: "fornecedor_id", label: "Fornecedor Principal", type: "relationship", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "Selecione", tooltip: "", mask: "", regex: "", validation: "", group: "Controle", order: 9, width: 6, ...common, createdAt: now, updatedAt: now },
      { name: "status", label: "Status", type: "status", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "active", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Configuração", order: 10, width: 4, ...common, createdAt: now, updatedAt: now },
    ],
  };

  if (fields[entityName]) return fields[entityName];
  const defaults: Omit<MetadataField, "id">[] = [
    { name: "nome", label: "Nome", type: "text", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 1, width: 12, ...common, createdAt: now, updatedAt: now },
    { name: "descricao", label: "Descrição", type: "longtext", required: false, visible: true, editable: true, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Identificação", order: 2, width: 12, ...common, createdAt: now, updatedAt: now },
    { name: "status", label: "Status", type: "status", required: true, visible: true, editable: true, searchable: true, unique: false, defaultValue: "active", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Configuração", order: 3, width: 4, ...common, createdAt: now, updatedAt: now },
    { name: "created_at", label: "Criado em", type: "datetime", required: false, visible: true, editable: false, searchable: true, unique: false, defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "", group: "Auditoria", order: 4, width: 6, ...common, createdAt: now, updatedAt: now },
  ];
  return defaults;
}

function generateForms(entityMap: Record<string, string>): Omit<MetadataForm, "id">[] {
  const forms: Omit<MetadataForm, "id">[] = [];
  const now = daysAgo(0);

  for (const [name, entityId] of Object.entries(entityMap)) {
    const tab1: FormTab = { id: "tab-1", label: "Identificação", icon: "Info", order: 1 };
    const tab2: FormTab = { id: "tab-2", label: "Informações", icon: "FileText", order: 2 };
    const tab3: FormTab = { id: "tab-3", label: "Configurações", icon: "Settings", order: 3 };

    const sections: FormSection[] = [
      { id: "sec-1", tabId: "tab-1", label: "Dados Principais", type: "card", columns: 2, order: 1, fieldIds: ["nome"] },
      { id: "sec-2", tabId: "tab-2", label: "Detalhes", type: "grid", columns: 1, order: 1, fieldIds: ["descricao"] },
      { id: "sec-3", tabId: "tab-3", label: "Configuração", type: "card", columns: 2, order: 1, fieldIds: ["status"] },
    ];

    forms.push({
      name: `Formulário Padrão - ${name}`,
      description: `Formulário padrão para cadastro de ${name}`,
      entityId,
      tabs: [tab1, tab2, tab3],
      sections,
      layoutDesktop: {}, layoutTablet: {}, layoutMobile: {},
      status: "published", version: 1, publishedVersion: 1, duplicatedFrom: null,
      companyId: null, level: "global", createdAt: daysAgo(30), updatedAt: now, createdBy: "admin-0",
    });
  }
  return forms;
}

function generateViews(entityMap: Record<string, string>): Omit<MetadataView, "id">[] {
  const views: Omit<MetadataView, "id">[] = [];
  const now = daysAgo(0);
  for (const [name, entityId] of Object.entries(entityMap)) {
    const columns: ViewColumn[] = [
      { id: "col-1", fieldId: "nome", label: "Nome", order: 1, width: 200, visible: true, sortable: true, filterable: true },
      { id: "col-2", fieldId: "status", label: "Status", order: 2, width: 100, visible: true, sortable: true, filterable: true },
    ];
    views.push({
      name: `Listagem Padrão - ${name}`, description: `Listagem padrão para ${name}`, entityId,
      mode: "table", columns, filters: [], defaultSort: "nome", defaultSortDir: "asc",
      pageSize: 20, exportEnabled: true, actions: ["view", "edit", "delete"],
      status: "published", version: 1, publishedVersion: 1, duplicatedFrom: null,
      companyId: null, level: "global", createdAt: daysAgo(30), updatedAt: now, createdBy: "admin-0",
    });
  }
  return views;
}

function generateDashboards(entityMap: Record<string, string>): Omit<MetadataDashboard, "id">[] {
  return [
    {
      name: "Dashboard Operacional", description: "Visão geral das operações diárias",
      widgets: [
        { id: "w1", type: "indicator", title: "OS Abertas", entityId: entityMap["ordem_servico"] ?? "", width: 3, height: 1, x: 0, y: 0, config: { filter: "aberto" } },
        { id: "w2", type: "indicator", title: "OS Concluídas Hoje", entityId: entityMap["ordem_servico"] ?? "", width: 3, height: 1, x: 3, y: 0, config: {} },
        { id: "w3", type: "indicator", title: "Clientes Ativos", entityId: entityMap["cliente"] ?? "", width: 3, height: 1, x: 6, y: 0, config: {} },
        { id: "w4", type: "indicator", title: "Faturamento Hoje", entityId: entityMap["pagamento"] ?? "", width: 3, height: 1, x: 9, y: 0, config: { currency: true } },
        { id: "w5", type: "bar", title: "OS por Status", entityId: entityMap["ordem_servico"] ?? "", width: 6, height: 2, x: 0, y: 1, config: { groupBy: "status" } },
        { id: "w6", type: "list", title: "Últimas OS", entityId: entityMap["ordem_servico"] ?? "", width: 6, height: 2, x: 6, y: 1, config: { limit: 5 } },
      ],
      status: "published", version: 1, publishedVersion: 1, duplicatedFrom: null,
      companyId: null, level: "global", createdAt: daysAgo(30), updatedAt: daysAgo(1), createdBy: "admin-0",
    },
    {
      name: "Dashboard Financeiro", description: "Acompanhamento financeiro",
      widgets: [
        { id: "w1", type: "indicator", title: "Receita do Mês", entityId: entityMap["pagamento"] ?? "", width: 4, height: 1, x: 0, y: 0, config: {} },
        { id: "w2", type: "indicator", title: "Receita Pendente", entityId: entityMap["pagamento"] ?? "", width: 4, height: 1, x: 4, y: 0, config: {} },
        { id: "w3", type: "indicator", title: "Ticket Médio", entityId: entityMap["ordem_servico"] ?? "", width: 4, height: 1, x: 8, y: 0, config: {} },
        { id: "w4", type: "pie", title: "Formas de Pagamento", entityId: entityMap["pagamento"] ?? "", width: 4, height: 2, x: 0, y: 1, config: {} },
        { id: "w5", type: "line", title: "Faturamento Últimos 30 Dias", entityId: entityMap["pagamento"] ?? "", width: 8, height: 2, x: 4, y: 1, config: { period: "30d" } },
      ],
      status: "published", version: 1, publishedVersion: 1, duplicatedFrom: null,
      companyId: null, level: "global", createdAt: daysAgo(25), updatedAt: daysAgo(1), createdBy: "admin-0",
    },
    {
      name: "Dashboard de Clientes", description: "Métricas de clientes",
      widgets: [
        { id: "w1", type: "indicator", title: "Total de Clientes", entityId: entityMap["cliente"] ?? "", width: 3, height: 1, x: 0, y: 0, config: {} },
        { id: "w2", type: "gauge", title: "Satisfação", entityId: entityMap["cliente"] ?? "", width: 3, height: 1, x: 3, y: 0, config: { max: 100 } },
        { id: "w3", type: "calendar", title: "Agendamentos", entityId: entityMap["ordem_servico"] ?? "", width: 6, height: 2, x: 0, y: 1, config: {} },
        { id: "w4", type: "table", title: "Top Clientes", entityId: entityMap["cliente"] ?? "", width: 6, height: 2, x: 6, y: 0, config: { limit: 10 } },
      ],
      status: "published", version: 1, publishedVersion: 1, duplicatedFrom: null,
      companyId: null, level: "global", createdAt: daysAgo(20), updatedAt: daysAgo(2), createdBy: "admin-0",
    },
    {
      name: "Dashboard de Estoque", description: "Controle de estoque e peças",
      widgets: [
        { id: "w1", type: "indicator", title: "Peças em Estoque", entityId: entityMap["peca"] ?? "", width: 3, height: 1, x: 0, y: 0, config: {} },
        { id: "w2", type: "indicator", title: "Estoque Baixo", entityId: entityMap["peca"] ?? "", width: 3, height: 1, x: 3, y: 0, config: {} },
        { id: "w3", type: "table", title: "Peças com Estoque Crítico", entityId: entityMap["peca"] ?? "", width: 6, height: 2, x: 0, y: 1, config: { filter: "estoque_minimo" } },
        { id: "w4", type: "bar", title: "Movimentação Mensal", entityId: entityMap["estoque"] ?? "", width: 6, height: 2, x: 6, y: 0, config: {} },
      ],
      status: "draft", version: 1, publishedVersion: null, duplicatedFrom: null,
      companyId: null, level: "global", createdAt: daysAgo(15), updatedAt: daysAgo(3), createdBy: "admin-0",
    },
    {
      name: "Dashboard de Técnicos", description: "Acompanhamento de técnicos",
      widgets: [
        { id: "w1", type: "indicator", title: "Técnicos Ativos", entityId: entityMap["tecnico"] ?? "", width: 3, height: 1, x: 0, y: 0, config: {} },
        { id: "w2", type: "indicator", title: "OS por Técnico (média)", entityId: entityMap["ordem_servico"] ?? "", width: 3, height: 1, x: 3, y: 0, config: {} },
        { id: "w3", type: "bar", title: "OS por Técnico", entityId: entityMap["ordem_servico"] ?? "", width: 6, height: 2, x: 0, y: 1, config: { groupBy: "tecnico_id" } },
        { id: "w4", type: "timeline", title: "Atividades Recentes", entityId: entityMap["ordem_servico"] ?? "", width: 6, height: 2, x: 6, y: 0, config: { limit: 10 } },
      ],
      status: "draft", version: 1, publishedVersion: null, duplicatedFrom: null,
      companyId: null, level: "company", createdAt: daysAgo(10), updatedAt: daysAgo(3), createdBy: "admin-0",
    },
  ];
}

function generateTemplates(entityMap: Record<string, string>): Omit<MetadataTemplate, "id">[] {
  const templates: Omit<MetadataTemplate, "id">[] = [];
  const now = daysAgo(0);
  const types: Array<{ type: "form" | "view" | "dashboard" | "document"; baseName: string; count: number }> = [
    { type: "form", baseName: "Formulário", count: 10 },
    { type: "view", baseName: "Listagem", count: 10 },
    { type: "dashboard", baseName: "Dashboard", count: 10 },
    { type: "document", baseName: "Documento", count: 10 },
  ];
  const scopes: Array<"global" | "company" | "custom"> = ["global", "global", "global", "global", "company", "company", "company", "custom", "custom", "custom"];

  for (const { type, baseName, count } of types) {
    for (let i = 1; i <= count; i++) {
      const entityNames = Object.keys(entityMap);
      const entityId = entityMap[entityNames[i % entityNames.length]] ?? null;
      templates.push({
        name: `${baseName} ${type === "document" ? "de " : "de "}${entityNames[i % entityNames.length]} - ${i}`,
        description: `Template de ${type === "form" ? "formulário" : type === "view" ? "listagem" : type === "dashboard" ? "dashboard" : "documento"} para ${entityNames[i % entityNames.length]}`,
        type, category: entityNames[i % entityNames.length], entityId, content: { templateVersion: 1 },
        scope: scopes[i % scopes.length], companyId: scopes[i % scopes.length] === "company" ? "company-1" : null,
        status: i <= 4 ? "published" : "draft", version: 1, publishedVersion: i <= 4 ? 1 : null,
        createdAt: daysAgo(60 - i * 3), updatedAt: now, createdBy: "admin-0",
      });
    }
  }
  return templates;
}

export async function runMetadataSeeds(): Promise<void> {
  const existing = await getStorage().findAll<MetadataEntity>(ENTITIES_COL);
  if (existing.length > 0) return;

  const entityMap: Record<string, string> = {};

  // Seed entities
  for (const e of ENTITIES) {
    const created = await getStorage().create<MetadataEntity>(ENTITIES_COL, e);
    entityMap[e.name] = created.id;
  }

  // Seed fields
  for (const e of ENTITIES) {
    const entityId = entityMap[e.name];
    const fields = generateFields(e.name, entityId, 1);
    for (const f of fields) {
      await getStorage().create<MetadataField>(FIELDS_COL, f);
    }
  }

  // Generate extra fields to reach ~200
  const extraFieldTypes: FieldType[] = ["text", "number", "date", "boolean", "email", "url", "currency", "color"];
  let extraCount = 0;
  for (const [name, entityId] of Object.entries(entityMap)) {
    if (extraCount >= 60) break;
    for (let i = 0; i < 5 && extraCount < 60; i++) {
      const ft = extraFieldTypes[extraCount % extraFieldTypes.length];
      extraCount++;
      await getStorage().create<MetadataField>(FIELDS_COL, {
        id: "", entityId, name: `extra_${extraCount}`, label: `Campo Extra ${extraCount}`,
        type: ft, required: false, visible: true, editable: true, searchable: false, unique: false,
        defaultValue: "", placeholder: "", tooltip: "", mask: "", regex: "", validation: "",
        group: "Extras", order: 50 + extraCount, width: 6,
        companyId: null, version: 1, level: "global", status: "active",
        createdAt: daysAgo(5), updatedAt: daysAgo(0),
      });
    }
  }

  // Seed forms
  const forms = generateForms(entityMap);
  for (const f of forms) {
    await getStorage().create<MetadataForm>(FORMS_COL, f);
  }

  // Seed views
  const views = generateViews(entityMap);
  for (const v of views) {
    await getStorage().create<MetadataView>(VIEWS_COL, v);
  }

  // Seed dashboards
  const dashboards = generateDashboards(entityMap);
  for (const d of dashboards) {
    await getStorage().create<MetadataDashboard>(DASHBOARDS_COL, d);
  }

  // Seed templates
  const templates = generateTemplates(entityMap);
  for (const t of templates) {
    await getStorage().create<MetadataTemplate>(TEMPLATES_COL, t);
  }

  // Seed initial version records
  await getStorage().create<MetadataVersion>(VERSIONS_COL, {
    id: "", entityType: "entity", entityId: entityMap["empresa"], version: 1,
    status: "published", data: { version: 1 }, comparison: "", createdBy: "admin-0",
    createdAt: daysAgo(180), description: "Versão inicial da entidade Empresa",
  });
}
