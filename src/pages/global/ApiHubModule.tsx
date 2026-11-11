import React, { useMemo, useState } from 'react';
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRightLeft,
  CheckCircle2,
  Code2,
  Copy,
  Database,
  Edit3,
  Eye,
  FileCode,
  KeyRound,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wand2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client';
import {
  ApiCollectionEntity,
  ApiEnvironmentEntity,
  ApiExecutionHistoryEntity,
  ApiServiceEntity,
  ApiTokenEntity,
  HttpMethod,
  OperationalItemEntity,
  PermissionScope,
} from '../../types/domain';
import { generateId, repositories } from '../../repositories/repositories';
import { formatCurrency, formatDateTime } from '../../i18n/translations';
import { executeSimulatedHttpCall, interpolateVariables } from '../../services/operationalUtils';
import {
  AccessDeniedView,
  ActionDropdownMenu,
  ArchiveRecordDialog,
  ModalDialog,
  PageHeader,
  StatusBadge,
  UnsavedChangesBanner,
  UrlDataTable,
} from '../../components/shared/SharedComponents';

export type ApiHubTab = 'servicos' | 'colecoes' | 'ambientes' | 'tokens' | 'historico';

export type DataTransformType =
  | 'NONE'
  | 'TRIM'
  | 'UPPERCASE'
  | 'LOWERCASE'
  | 'DIGITS_ONLY'
  | 'CURRENCY_NUMBER'
  | 'AUTO_SKU';

export interface FieldMappingRule {
  targetField: 'code' | 'title' | 'category' | 'quantity' | 'amount';
  targetLabel: string;
  required: boolean;
  sourcePath: string;
  defaultValue: string;
  transform: DataTransformType;
}

export interface ApiIntegrationPreset {
  id: string;
  name: string;
  category: string;
  method: HttpMethod;
  baseUrl: string;
  path: string;
  authType: 'none' | 'bearer_token' | 'api_key';
  description: string;
  targetModule: 'inventory' | 'orders' | 'crm';
  dataRootPath: string;
  sampleResponseJson: string;
  defaultMappings: FieldMappingRule[];
}

export const API_INTEGRATION_PRESETS: ApiIntegrationPreset[] = [
  {
    id: 'preset-bling-inventory',
    name: 'Bling ERP v3 — Sincronização de Produtos & Saldos',
    category: 'ERP & Estoque',
    method: 'GET',
    baseUrl: 'https://api.bling.com.br/Api/v3',
    path: '/produtos?limite=50&situacao=A',
    authType: 'bearer_token',
    description: 'Importa catálogo de SKUs, preços de venda e saldo físico do Bling ERP v3 com mapeamento De -> Para.',
    targetModule: 'inventory',
    dataRootPath: 'data',
    sampleResponseJson: JSON.stringify(
      {
        data: [
          { codigo: 'BLG-101', nome: 'Vela Aromática Lavanda Francesa 250g', categoria: 'Aromaterapia', preco: 89.9, estoqueAtual: 42 },
          { codigo: 'BLG-102', nome: 'Difusor de Ambiente Bambu Imperial 500ml', categoria: 'Difusores', preco: 134.5, estoqueAtual: 18 },
          { codigo: 'BLG-103', nome: 'Kit Presente Essências Botânicas', categoria: 'Kits Premium', preco: 219.0, estoqueAtual: 15 },
        ],
      },
      null,
      2,
    ),
    defaultMappings: [
      { targetField: 'code', targetLabel: 'Código / SKU', required: true, sourcePath: 'codigo', defaultValue: '', transform: 'UPPERCASE' },
      { targetField: 'title', targetLabel: 'Descrição do Produto', required: true, sourcePath: 'nome', defaultValue: 'Produto Importado', transform: 'TRIM' },
      { targetField: 'category', targetLabel: 'Categoria', required: false, sourcePath: 'categoria', defaultValue: 'Geral', transform: 'TRIM' },
      { targetField: 'quantity', targetLabel: 'Saldo de Estoque', required: false, sourcePath: 'estoqueAtual', defaultValue: '10', transform: 'CURRENCY_NUMBER' },
      { targetField: 'amount', targetLabel: 'Preço Unitário (R$)', required: true, sourcePath: 'preco', defaultValue: '0', transform: 'CURRENCY_NUMBER' },
    ],
  },
  {
    id: 'preset-tiny-orders',
    name: 'Tiny ERP / Olist — Importação de Pedidos Faturados',
    category: 'Vendas & Faturamento',
    method: 'GET',
    baseUrl: 'https://api.tiny.com.br/api2',
    path: '/pedidos.pesquisa.php?formato=json&situacao=faturado',
    authType: 'api_key',
    description: 'Conector para importar pedidos aprovados e notas fiscais emitidas no Tiny ERP diretamente para Allin Vendas.',
    targetModule: 'orders',
    dataRootPath: 'pedidos',
    sampleResponseJson: JSON.stringify(
      {
        pedidos: [
          { numero: 'PED-9041', cliente: 'Boutique Jardim Paulista LTDA', canal: 'B2B Atacado', volumes: 12, valorTotal: 3480.0 },
          { numero: 'PED-9042', cliente: 'Empório Santa Clara', canal: 'E-commerce', volumes: 4, valorTotal: 890.5 },
        ],
      },
      null,
      2,
    ),
    defaultMappings: [
      { targetField: 'code', targetLabel: 'Nº do Pedido', required: true, sourcePath: 'numero', defaultValue: '', transform: 'UPPERCASE' },
      { targetField: 'title', targetLabel: 'Cliente / Pedido', required: true, sourcePath: 'cliente', defaultValue: 'Pedido ERP', transform: 'TRIM' },
      { targetField: 'category', targetLabel: 'Canal de Venda', required: false, sourcePath: 'canal', defaultValue: 'Comercial', transform: 'TRIM' },
      { targetField: 'quantity', targetLabel: 'Qtd. Volumes/Itens', required: false, sourcePath: 'volumes', defaultValue: '1', transform: 'CURRENCY_NUMBER' },
      { targetField: 'amount', targetLabel: 'Valor do Pedido (R$)', required: true, sourcePath: 'valorTotal', defaultValue: '0', transform: 'CURRENCY_NUMBER' },
    ],
  },
  {
    id: 'preset-crm-leads',
    name: 'RD Station / HubSpot CRM — Carteira de Contas & Oportunidades',
    category: 'CRM & Clientes',
    method: 'POST',
    baseUrl: 'https://api.hubapi.com/crm/v3',
    path: '/objects/deals/search',
    authType: 'bearer_token',
    description: 'Sincroniza contas corporativas, leads qualificados e valor previsto de fechamento (LTV) para o Allin CRM.',
    targetModule: 'crm',
    dataRootPath: 'results',
    sampleResponseJson: JSON.stringify(
      {
        results: [
          { id: 'CRM-701', company: 'Rede Hoteleira Atlântico Sul', stage: 'Proposta Enviada', seats: 25, dealValue: 14500.0 },
          { id: 'CRM-702', company: 'Grupo Gastronômico Vila Nova', stage: 'Negociação Final', seats: 14, dealValue: 8200.0 },
        ],
      },
      null,
      2,
    ),
    defaultMappings: [
      { targetField: 'code', targetLabel: 'Código da Conta/Deal', required: true, sourcePath: 'id', defaultValue: '', transform: 'UPPERCASE' },
      { targetField: 'title', targetLabel: 'Razão Social / Conta', required: true, sourcePath: 'company', defaultValue: 'Conta CRM', transform: 'TRIM' },
      { targetField: 'category', targetLabel: 'Etapa do Funil', required: false, sourcePath: 'stage', defaultValue: 'Prospecção', transform: 'TRIM' },
      { targetField: 'quantity', targetLabel: 'Licenças / Unidades', required: false, sourcePath: 'seats', defaultValue: '1', transform: 'CURRENCY_NUMBER' },
      { targetField: 'amount', targetLabel: 'Valor Estimado (R$)', required: true, sourcePath: 'dealValue', defaultValue: '0', transform: 'CURRENCY_NUMBER' },
    ],
  },
];

export function parseCurlCommand(curlInput: string): {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body: string;
} {
  const clean = curlInput.replace(/\\\r?\n/g, ' ').trim();
  let method: HttpMethod = 'GET';
  const methodMatch = clean.match(/(?:-X|--request)\s+['"]?(GET|POST|PUT|PATCH|DELETE)['"]?/i);
  if (methodMatch) {
    method = methodMatch[1].toUpperCase() as HttpMethod;
  } else if (/(-d|--data|--data-raw|--data-binary)\s+/i.test(clean)) {
    method = 'POST';
  }

  let url = 'https://sandbox.api.olivelas-allin.local/v1/resource';
  const urlMatch = clean.match(/['"]?(https?:\/\/[^\s'"]+)['"]?/i);
  if (urlMatch) {
    url = urlMatch[1];
  }

  const headers: Record<string, string> = {};
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/gi;
  let match: RegExpExecArray | null;
  while ((match = headerRegex.exec(clean)) !== null) {
    const rawHeader = match[1];
    const sepIndex = rawHeader.indexOf(':');
    if (sepIndex > 0) {
      const k = rawHeader.slice(0, sepIndex).trim();
      const v = rawHeader.slice(sepIndex + 1).trim();
      headers[k] = v;
    }
  }

  let body = '';
  const dataMatch = clean.match(/(?:-d|--data|--data-raw|--data-binary)\s+(['"])([\s\S]*?)\1/i);
  if (dataMatch) {
    body = dataMatch[2];
  }

  return { method, url, headers, body };
}

export function generateCurlSnippet(params: {
  method: HttpMethod;
  url: string;
  authType: string;
  tokenPreview?: string;
  body?: string;
}): string {
  const lines = [`curl -X ${params.method} "${params.url}"`];
  lines.push(`  -H "Accept: application/json"`);
  if (params.authType === 'bearer_token') {
    lines.push(`  -H "Authorization: Bearer ${params.tokenPreview || 'allin_live_sim_****'}"`);
  } else if (params.authType === 'api_key') {
    lines.push(`  -H "X-API-Key: ${params.tokenPreview || 'allin_key_****'}"`);
  }
  if (params.method !== 'GET' && params.body && params.body.trim()) {
    lines.push(`  -H "Content-Type: application/json"`);
    lines.push(`  -d '${params.body.trim()}'`);
  }
  return lines.join(' \\\n');
}

function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  if (!path.trim()) return undefined;
  return path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function applyTransformValue(raw: unknown, defaultValue: string, transform: DataTransformType): string | number {
  const baseStr = raw !== undefined && raw !== null && String(raw).trim() !== '' ? String(raw) : defaultValue;
  switch (transform) {
    case 'TRIM':
      return baseStr.trim();
    case 'UPPERCASE':
      return baseStr.trim().toUpperCase();
    case 'LOWERCASE':
      return baseStr.trim().toLowerCase();
    case 'DIGITS_ONLY':
      return baseStr.replace(/\D+/g, '');
    case 'CURRENCY_NUMBER': {
      const num = Number(String(baseStr).replace(/[^\d.-]/g, ''));
      return Number.isFinite(num) ? num : 0;
    }
    case 'AUTO_SKU':
      return baseStr.trim() ? baseStr.trim().toUpperCase() : `SKU-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    default:
      return baseStr;
  }
}

export const ApiHubCatalogPage: React.FC<{ activeTab: ApiHubTab }> = ({ activeTab }) => {
  const {
    apiServices,
    apiCollections,
    apiEnvironments,
    apiTokens,
    apiHistory,
    companies,
    operationalItems,
    currentUser,
    session,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();
  const navigate = useNavigate();

  const [archiveServiceTarget, setArchiveServiceTarget] = useState<ApiServiceEntity | null>(null);
  const [revokeTokenTarget, setRevokeTokenTarget] = useState<ApiTokenEntity | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  // Quick-inspect modals (with X close button)
  const [inspectService, setInspectService] = useState<ApiServiceEntity | null>(null);
  const [inspectHistory, setInspectHistory] = useState<ApiExecutionHistoryEntity | null>(null);

  // Import cURL Modal
  const [curlModalOpen, setCurlModalOpen] = useState(false);
  const [curlRawText, setCurlRawText] = useState(
    `curl -X POST "https://api.bling.com.br/Api/v3/produtos" \\\n  -H "Accept: application/json" \\\n  -H "Authorization: Bearer allin_live_sim_****" \\\n  -d '{"nome":"Kit Difusor Imperial","codigo":"BLG-500","preco":149.90}'`,
  );
  const [curlServiceName, setCurlServiceName] = useState('Conector Importado via cURL');

  // Postman-Style ERP Connector & De -> Para Mapper Modal
  const [mapperModalOpen, setMapperModalOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState(API_INTEGRATION_PRESETS[0].id);
  const [targetCompanyId, setTargetCompanyId] = useState(companies[0]?.id || 'emp-olivelas-matriz');
  const [targetModule, setTargetModule] = useState<'inventory' | 'orders' | 'crm'>('inventory');
  const [dataRootPath, setDataRootPath] = useState(API_INTEGRATION_PRESETS[0].dataRootPath);
  const [rawSourceJson, setRawSourceJson] = useState(API_INTEGRATION_PRESETS[0].sampleResponseJson);
  const [fieldMappings, setFieldMappings] = useState<FieldMappingRule[]>(
    API_INTEGRATION_PRESETS[0].defaultMappings,
  );
  const [dryRunRows, setDryRunRows] = useState<
    Array<{
      code: string;
      title: string;
      category: string;
      quantity: number;
      amount: number;
      action: 'CREATE' | 'UPDATE' | 'INVALID';
    }>
  >([]);

  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [colName, setColName] = useState('');
  const [colCategory, setColCategory] = useState('Core Platform');
  const [colDesc, setColDesc] = useState('');

  const [newEnvOpen, setNewEnvOpen] = useState(false);
  const [envName, setEnvName] = useState('');
  const [envSlug, setEnvSlug] = useState('homolog-sim');
  const [envBaseUrl, setEnvBaseUrl] = useState('https://sandbox.api.olivelas-allin.local/v1');
  const [envTenantId, setEnvTenantId] = useState('emp-olivelas-matriz');

  const [newTokenOpen, setNewTokenOpen] = useState(false);
  const [tokName, setTokName] = useState('');
  const [tokScope, setTokScope] = useState<PermissionScope>('company');
  const [tokCompanyId, setTokCompanyId] = useState('emp-olivelas-matriz');
  const [tokExpiresAt, setTokExpiresAt] = useState('2027-12-31');

  if (!hasPermission('api_hub', 'view')) {
    return (
      <AccessDeniedView
        reason="Seu papel atual não possui permissão para acessar o console técnico Allin API Hub."
        requiredPermission="api_hub:view"
      />
    );
  }

  const handleSelectPreset = (presetId: string) => {
    const preset = API_INTEGRATION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setTargetModule(preset.targetModule);
    setDataRootPath(preset.dataRootPath);
    setRawSourceJson(preset.sampleResponseJson);
    setFieldMappings(preset.defaultMappings);
    setDryRunRows([]);
  };

  const handleAutoMapFields = () => {
    try {
      const parsed = JSON.parse(rawSourceJson);
      const list = dataRootPath.trim()
        ? (getValueByPath(parsed, dataRootPath.trim()) as Array<Record<string, unknown>>)
        : Array.isArray(parsed)
          ? parsed
          : [parsed];
      const sample = Array.isArray(list) && list.length > 0 ? list[0] : {};
      const keys = Object.keys(sample || {});

      const guessKey = (candidates: string[], fallback: string) =>
        keys.find((k) => candidates.some((c) => k.toLowerCase().includes(c))) || fallback;

      setFieldMappings((prev) =>
        prev.map((m) => {
          if (m.targetField === 'code') {
            return { ...m, sourcePath: guessKey(['codigo', 'sku', 'id', 'numero', 'code'], m.sourcePath) };
          }
          if (m.targetField === 'title') {
            return { ...m, sourcePath: guessKey(['nome', 'title', 'cliente', 'company', 'descricao'], m.sourcePath) };
          }
          if (m.targetField === 'category') {
            return { ...m, sourcePath: guessKey(['categoria', 'category', 'canal', 'stage', 'tipo'], m.sourcePath) };
          }
          if (m.targetField === 'quantity') {
            return { ...m, sourcePath: guessKey(['estoque', 'qtd', 'quantity', 'volumes', 'seats', 'stock'], m.sourcePath) };
          }
          if (m.targetField === 'amount') {
            return { ...m, sourcePath: guessKey(['preco', 'valor', 'price', 'amount', 'deal', 'total'], m.sourcePath) };
          }
          return m;
        }),
      );
      notify({
        type: 'info',
        title: 'Auto-Mapeamento Inteligente Aplicado',
        description: `Chaves detectadas no payload JSON: ${keys.join(', ') || 'nenhuma'}.`,
      });
    } catch {
      notify({ type: 'error', title: 'JSON de entrada inválido para auto-mapeamento.' });
    }
  };

  const handleRunDryRun = () => {
    try {
      const parsed = JSON.parse(rawSourceJson);
      const rawArray = dataRootPath.trim()
        ? getValueByPath(parsed, dataRootPath.trim())
        : parsed;
      const list = Array.isArray(rawArray) ? rawArray : [rawArray];

      const existingCompanyItems = operationalItems.filter(
        (item) => item.companyId === targetCompanyId && item.moduleType === targetModule,
      );

      const simulated = list.filter(Boolean).map((rowObj) => {
        const record = rowObj as Record<string, unknown>;
        const getMapped = (field: FieldMappingRule['targetField']) => {
          const rule = fieldMappings.find((r) => r.targetField === field);
          if (!rule) return '';
          const rawVal = getValueByPath(record, rule.sourcePath);
          return applyTransformValue(rawVal, rule.defaultValue, rule.transform);
        };

        const code = String(getMapped('code') || '').trim();
        const title = String(getMapped('title') || '').trim();
        const category = String(getMapped('category') || 'Geral').trim();
        const quantity = Number(getMapped('quantity')) || 1;
        const amount = Number(getMapped('amount')) || 0;

        const exists = existingCompanyItems.some(
          (it) => it.code.toLowerCase() === code.toLowerCase(),
        );
        const action: 'CREATE' | 'UPDATE' | 'INVALID' =
          !code || !title ? 'INVALID' : exists ? 'UPDATE' : 'CREATE';

        return { code, title, category, quantity, amount, action };
      });

      setDryRunRows(simulated);
      notify({
        type: 'success',
        title: `Simulação Dry-Run concluída (${simulated.length} registros processados)`,
        description: `${simulated.filter((r) => r.action === 'CREATE').length} novos (CREATE) e ${simulated.filter((r) => r.action === 'UPDATE').length} atualizações (UPDATE).`,
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Falha ao processar JSON no Dry-Run',
        description: err instanceof Error ? err.message : 'Verifique a sintaxe do payload.',
      });
    }
  };

  const handleExecuteBatchSync = async () => {
    if (dryRunRows.length === 0) {
      handleRunDryRun();
      return;
    }
    const validRows = dryRunRows.filter((r) => r.action !== 'INVALID');
    if (validRows.length === 0) {
      notify({ type: 'warning', title: 'Nenhum registro válido para sincronizar.' });
      return;
    }

    const comp = companies.find((c) => c.id === targetCompanyId);
    const now = new Date().toISOString();
    let createdCount = 0;
    let updatedCount = 0;

    for (const row of validRows) {
      const existing = operationalItems.find(
        (it) =>
          it.companyId === targetCompanyId &&
          it.moduleType === targetModule &&
          it.code.toLowerCase() === row.code.toLowerCase(),
      );

      if (existing) {
        await repositories.operationalItems.update(
          existing.id,
          (curr) => ({
            ...curr,
            title: row.title,
            category: row.category,
            quantity: row.quantity,
            amount: row.amount,
            updatedAt: now,
          }),
          getActor(targetCompanyId),
          `Sincronização ERP De->Para (UPDATE) do item ${row.code} em ${targetModule}.`,
        );
        updatedCount++;
      } else {
        const newItem: OperationalItemEntity = {
          id: generateId(targetModule),
          companyId: targetCompanyId,
          moduleType: targetModule,
          code: row.code,
          title: row.title,
          category: row.category,
          quantity: row.quantity,
          amount: row.amount,
          currency: comp?.currency || 'BRL',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          archiveMetadata: { isArchived: false },
          changeHistory: [],
        };
        await repositories.operationalItems.create(
          newItem,
          getActor(targetCompanyId),
          `Sincronização ERP De->Para (CREATE) do item ${row.code} — ${row.title} em ${targetModule}.`,
        );
        createdCount++;
      }
    }

    await refreshData();
    notify({
      type: 'success',
      title: `Sincronização em Lote Concluída (${createdCount} criados, ${updatedCount} atualizados)`,
      description: `Dados gravados na empresa ${comp?.tradeName || targetCompanyId} (${targetModule.toUpperCase()}).`,
    });
    setMapperModalOpen(false);
  };

  const handleImportCurlAsService = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseCurlCommand(curlRawText);
    let baseUrl = '{{BASE_URL}}';
    let path = '/imported-endpoint';
    try {
      const u = new URL(parsed.url);
      baseUrl = `${u.protocol}//${u.host}`;
      path = `${u.pathname}${u.search}`;
    } catch {
      path = parsed.url;
    }

    const now = new Date().toISOString();
    const newSrv: ApiServiceEntity = {
      id: generateId('srv'),
      collectionId: apiCollections[0]?.id || 'col-erp-core',
      name: curlServiceName.trim() || `Endpoint ${parsed.method} Importado`,
      description: `Importado via comando cURL (${parsed.url})`,
      method: parsed.method,
      baseUrl,
      path,
      defaultHeaders: Object.entries(parsed.headers).map(([key, value]) => ({
        key,
        value,
        enabled: true,
      })),
      queryParams: [],
      authType:
        Object.keys(parsed.headers).some((k) => k.toLowerCase() === 'authorization')
          ? 'bearer_token'
          : Object.keys(parsed.headers).some((k) => k.toLowerCase().includes('api-key'))
            ? 'api_key'
            : 'none',
      bodyType: parsed.body ? 'json' : 'none',
      bodyTemplate: parsed.body,
      timeoutMs: 3000,
      expectedResponses: [
        {
          statusCode: 200,
          label: '200 OK — Resposta Simulada cURL',
          latencyMs: 52,
          headers: { 'content-type': 'application/json' },
          bodyJson: JSON.stringify(
            {
              status: 'IMPORTED_CURL_OK',
              method: parsed.method,
              endpoint: path,
              receivedPayload: parsed.body ? JSON.parse(parsed.body || '{}') : null,
            },
            null,
            2,
          ),
        },
      ],
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };

    await repositories.apiServices.create(
      newSrv,
      getActor(),
      `Importação de comando cURL como serviço HTTP "${newSrv.name}" (${newSrv.method} ${newSrv.path}).`,
    );
    await refreshData();
    setCurlModalOpen(false);
    notify({
      type: 'success',
      title: `Serviço "${newSrv.name}" criado via cURL!`,
      description: `${newSrv.method} ${newSrv.baseUrl}${newSrv.path}`,
    });
    navigate(`/app/global/api-hub/servicos/${newSrv.id}`);
  };

  const handleCreatePresetAsService = async (preset: ApiIntegrationPreset) => {
    const now = new Date().toISOString();
    const newSrv: ApiServiceEntity = {
      id: generateId('srv'),
      collectionId: apiCollections[0]?.id || 'col-erp-core',
      name: preset.name,
      description: preset.description,
      method: preset.method,
      baseUrl: preset.baseUrl,
      path: preset.path,
      defaultHeaders: [{ key: 'Accept', value: 'application/json', enabled: true }],
      queryParams: [],
      authType: preset.authType,
      bodyType: preset.method === 'GET' ? 'none' : 'json',
      bodyTemplate: preset.method === 'GET' ? '' : preset.sampleResponseJson,
      timeoutMs: 3000,
      expectedResponses: [
        {
          statusCode: 200,
          label: '200 OK — Payload ERP Demonstrativo',
          latencyMs: 68,
          headers: { 'content-type': 'application/json' },
          bodyJson: preset.sampleResponseJson,
        },
      ],
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiServices.create(
      newSrv,
      getActor(),
      `Instanciação do conector ERP pronto "${preset.name}" no catálogo do API Hub.`,
    );
    await refreshData();
    notify({
      type: 'success',
      title: `Conector "${preset.name}" adicionado ao catálogo!`,
    });
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const col: ApiCollectionEntity = {
      id: generateId('col'),
      name: colName.trim(),
      category: colCategory.trim(),
      description: colDesc.trim(),
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiCollections.create(
      col,
      getActor(),
      `Criação de coleção HTTP "${col.name}" no API Hub.`,
    );
    await refreshData();
    setNewCollectionOpen(false);
    setColName('');
    setColDesc('');
    notify({ type: 'success', title: `Coleção ${col.name} criada.` });
  };

  const handleCreateEnvironment = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const env: ApiEnvironmentEntity = {
      id: generateId('env'),
      name: envName.trim(),
      slug: envSlug.trim(),
      baseUrl: envBaseUrl.trim(),
      variables: {
        TENANT_ID: envTenantId,
        API_VERSION: '2026-10',
        TIMEOUT_MS: '3000',
      },
      isDefault: false,
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiEnvironments.create(
      env,
      getActor(),
      `Criação de ambiente simulado "${env.name}" (${env.baseUrl}).`,
    );
    await refreshData();
    setNewEnvOpen(false);
    setEnvName('');
    notify({ type: 'success', title: `Ambiente ${env.name} registrado.` });
  };

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const suffix = Math.random().toString(16).slice(2, 6);
    const comp = companies.find((c) => c.id === tokCompanyId);
    const tok: ApiTokenEntity = {
      id: generateId('tok'),
      name: tokName.trim(),
      maskedPreview: `allin_${tokScope === 'global' ? 'live' : 'ten'}_sim_****_${suffix}`,
      scope: tokScope,
      companyId: tokScope === 'company' ? tokCompanyId : undefined,
      companyName: tokScope === 'company' ? comp?.legalName : undefined,
      permissions: ['api_hub:view', 'modules:view', 'orders:view'],
      expiresAt: `${tokExpiresAt}T23:59:59.000Z`,
      status: 'active',
      createdByUserId: currentUser?.id || 'usr-super-admin',
      createdByUserName: currentUser?.name || 'Super Admin',
      createdAt: now,
      updatedAt: now,
      archiveMetadata: { isArchived: false },
      changeHistory: [],
    };
    await repositories.apiTokens.create(
      tok,
      getActor(tok.companyId),
      `Emissão de token de API demonstrativo mascarado (${tok.maskedPreview}).`,
    );
    await refreshData();
    setNewTokenOpen(false);
    setTokName('');
    notify({
      type: 'success',
      title: `Token emitido com visualização mascarada: ${tok.maskedPreview}`,
    });
  };

  const handleConfirmRevokeToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokeTokenTarget) return;
    const now = new Date().toISOString();
    await repositories.apiTokens.update(
      revokeTokenTarget.id,
      (curr) => ({
        ...curr,
        status: 'revoked',
        revokedAt: now,
        revokedReason: revokeReason.trim() || 'Revogação administrativa via API Hub.',
      }),
      getActor(revokeTokenTarget.companyId),
      `Revogação de token de API ${revokeTokenTarget.name} (${revokeTokenTarget.maskedPreview}). Motivo: ${revokeReason}`,
      'revoke_token',
    );
    await refreshData();
    setRevokeTokenTarget(null);
    setRevokeReason('');
    notify({ type: 'warning', title: 'Token revogado e auditado com sucesso.' });
  };

  return (
    <div className="flex flex-col gap-2.5">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/servicos' },
          { label: activeTab.toUpperCase() },
        ]}
        title="Allin API Hub — Governança de Serviços HTTP, PostgREST Multi-Schema & Conector ERP De->Para"
        subtitle={`${apiServices.length} serviços HTTP • ${apiCollections.length} coleções • ${apiEnvironments.length} ambientes • ${apiTokens.length} tokens mascarados`}
        scopeBadge="SUPABASE POSTGREST + ERP CONNECTOR"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setCurlModalOpen(true)}
            >
              <Code2 size={14} />
              Importar cURL
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setMapperModalOpen(true);
                if (dryRunRows.length === 0) handleRunDryRun();
              }}
            >
              <ArrowRightLeft size={14} />
              Conector De -&gt; Para &amp; Sync ERP
            </button>
            {activeTab === 'servicos' && hasPermission('api_hub', 'create') && (
              <Link to="/app/global/api-hub/servicos/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Novo Serviço HTTP
              </Link>
            )}
            {activeTab === 'colecoes' && hasPermission('api_hub', 'create') && (
              <Link to="/app/global/api-hub/colecoes/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Nova Coleção
              </Link>
            )}
            {activeTab === 'ambientes' && hasPermission('api_hub', 'create') && (
              <Link to="/app/global/api-hub/ambientes/novo" className="btn btn-primary btn-sm">
                <Plus size={14} />
                Novo Ambiente
              </Link>
            )}
            {activeTab === 'tokens' && hasPermission('api_hub', 'create') && (
              <Link to="/app/global/api-hub/tokens/novo" className="btn btn-primary btn-sm">
                <KeyRound size={14} />
                Gerar Token Mascarado
              </Link>
            )}
          </div>
        }
      />

      <nav className="subnav-tabs" aria-label="Navegação do API Hub">
        <NavLink
          to="/app/global/api-hub/servicos"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Serviços HTTP ({apiServices.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/colecoes"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Coleções ({apiCollections.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/ambientes"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Ambientes &amp; Variáveis ({apiEnvironments.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/tokens"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Tokens de Acesso ({apiTokens.length})
        </NavLink>
        <NavLink
          to="/app/global/api-hub/historico"
          className={({ isActive }) => `subnav-tab ${isActive ? 'active' : ''}`}
        >
          Histórico de Execuções ({apiHistory.length})
        </NavLink>
      </nav>

      {activeTab === 'servicos' && (
        <UrlDataTable<ApiServiceEntity>
          tableId="api-services-table"
          caption="Catálogo de serviços HTTP e endpoints documentados no Allin API Hub"
          items={apiServices}
          defaultSortField="createdAt"
          csvFilename="api-hub-servicos.csv"
          searchPlaceholder="Buscar por nome do serviço, método HTTP, rota ou coleção..."
          statusExtractor={(s) => s.method}
          searchExtractor={(s) => `${s.name} ${s.method} ${s.path} ${s.description}`}
          statusOptions={[
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
          ]}
          isArchivedExtractor={(s) => s.archiveMetadata.isArchived}
          columns={[
            {
              key: 'method',
              header: 'Método / ID',
              width: '10%',
              sortable: true,
              csvValue: (s) => s.method,
              render: (s) => (
                <div className="flex flex-col gap-1" style={{ padding: '0.15rem 0', alignItems: 'flex-start' }}>
                  <span className={`method-badge method-${s.method}`}>{s.method}</span>
                  <span className="text-xs text-muted mono">{s.id}</span>
                </div>
              ),
            },
            {
              key: 'name',
              header: 'Serviço HTTP & Descrição',
              width: '28%',
              sortable: true,
              csvValue: (s) => s.name,
              render: (s) => (
                <div className="flex flex-col gap-1" style={{ padding: '0.15rem 0' }}>
                  <Link
                    to={`/app/global/api-hub/servicos/${s.id}`}
                    className="font-semibold text-sm"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    {s.name}
                  </Link>
                  <span className="text-xs text-muted" style={{ lineHeight: 1.35 }}>
                    {s.description}
                  </span>
                </div>
              ),
            },
            {
              key: 'path',
              header: 'Endpoint / URL Base',
              width: '24%',
              csvValue: (s) => `${s.baseUrl}${s.path}`,
              render: (s) => (
                <div className="flex flex-col gap-1" style={{ padding: '0.15rem 0' }}>
                  <code className="text-xs font-semibold mono" style={{ color: 'var(--text-primary)' }}>
                    {s.path}
                  </code>
                  <span className="text-xs text-muted mono truncate" title={s.baseUrl}>
                    {s.baseUrl}
                  </span>
                </div>
              ),
            },
            {
              key: 'collectionId',
              header: 'Coleção & Domínio',
              width: '15%',
              csvValue: (s) => {
                const col = apiCollections.find((c) => c.id === s.collectionId);
                return col?.name || s.collectionId;
              },
              render: (s) => {
                const col = apiCollections.find((c) => c.id === s.collectionId);
                return (
                  <div className="flex flex-col gap-1" style={{ padding: '0.15rem 0', alignItems: 'flex-start' }}>
                    <span className="badge badge-teal">{col?.name || s.collectionId}</span>
                    <span className="text-xs text-muted">{col?.category || 'Core API'}</span>
                  </div>
                );
              },
            },
            {
              key: 'timeoutMs',
              header: 'Autenticação & Status HTTP',
              width: '15%',
              csvValue: (s) => `${s.authType} (${s.timeoutMs}ms)`,
              render: (s) => (
                <div className="flex flex-col gap-1" style={{ padding: '0.15rem 0' }}>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="badge badge-info text-xs">{s.authType}</span>
                    {s.expectedResponses.map((r) => (
                      <span
                        key={r.statusCode}
                        className={`badge ${r.statusCode < 300 ? 'badge-success' : 'badge-warning'} mono`}
                      >
                        {r.statusCode}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-muted mono">Timeout: {s.timeoutMs} ms</span>
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '8%',
              isNumeric: true,
              render: (s) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'runner',
                      label: 'Testar Endpoint (Runner)',
                      icon: <Play size={14} />,
                      onClick: () => navigate(`/app/global/api-hub/servicos/${s.id}`),
                    },
                    ...(hasPermission('api_hub', 'edit')
                      ? [
                          {
                            id: 'edit',
                            label: 'Editar Especificação (ID Único)',
                            icon: <Edit3 size={14} />,
                            onClick: () => navigate(`/app/global/api-hub/servicos/${s.id}/editar`),
                          },
                        ]
                      : []),
                    {
                      id: 'copy-curl',
                      label: 'Copiar Comando cURL',
                      icon: <Copy size={14} />,
                      onClick: () => {
                        const snippet = generateCurlSnippet({
                          method: s.method,
                          url: `${s.baseUrl}${s.path}`,
                          authType: s.authType,
                          body: s.bodyTemplate,
                        });
                        navigator.clipboard?.writeText(snippet);
                        notify({ type: 'info', title: `Comando cURL de ${s.name} copiado!` });
                      },
                    },
                    {
                      id: 'inspect-modal',
                      label: 'Ver Resumo Técnico',
                      icon: <Eye size={14} />,
                      onClick: () => setInspectService(s),
                    },
                    ...(s.archiveMetadata.isArchived
                      ? [
                          {
                            id: 'restore',
                            label: t('common.restore'),
                            icon: <RefreshCw size={14} />,
                            onClick: async () => {
                              await repositories.apiServices.restore(s.id, getActor());
                              await refreshData();
                              notify({ type: 'success', title: `Serviço ${s.name} restaurado.` });
                            },
                          },
                        ]
                      : [
                          {
                            id: 'archive',
                            label: t('common.archive'),
                            icon: <AlertCircle size={14} />,
                            variant: 'danger' as const,
                            onClick: () => setArchiveServiceTarget(s),
                          },
                        ]),
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {activeTab === 'colecoes' && (
        <UrlDataTable<ApiCollectionEntity>
          tableId="api-collections-table"
          caption="Coleções de serviços HTTP organizadas por domínio"
          items={apiCollections}
          defaultSortField="createdAt"
          csvFilename="api-hub-colecoes.csv"
          searchPlaceholder="Buscar por nome da coleção ou categoria..."
          searchExtractor={(c) => `${c.name} ${c.category} ${c.description}`}
          isArchivedExtractor={(c) => c.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Coleção',
              width: '50%',
              sortable: true,
              render: (c) => (
                <div>
                  <Link to={`/app/global/api-hub/colecoes/${c.id}/editar`} className="font-semibold">
                    {c.name}
                  </Link>
                  <div className="text-xs text-muted">{c.description}</div>
                </div>
              ),
            },
            {
              key: 'category',
              header: 'Domínio Técnico',
              width: '22%',
              render: (c) => <span className="badge badge-teal">{c.category}</span>,
            },
            {
              key: 'servicesCount',
              header: 'Endpoints Vinculados',
              width: '18%',
              render: (c) => {
                const count = apiServices.filter((s) => s.collectionId === c.id).length;
                return <span className="mono font-semibold">{count} serviço(s)</span>;
              },
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '10%',
              isNumeric: true,
              render: (c) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit',
                      label: 'Editar Coleção (ID Único)',
                      icon: <Edit3 size={14} />,
                      onClick: () => navigate(`/app/global/api-hub/colecoes/${c.id}/editar`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {activeTab === 'ambientes' && (
        <UrlDataTable<ApiEnvironmentEntity>
          tableId="api-environments-table"
          caption="Ambientes e variáveis de interpolação do Allin API Hub"
          items={apiEnvironments}
          defaultSortField="name"
          csvFilename="api-hub-ambientes.csv"
          searchPlaceholder="Buscar por nome do ambiente, slug, URL base ou variável..."
          statusExtractor={(env) => (env.isDefault ? 'default' : 'custom')}
          searchExtractor={(env) =>
            `${env.name} ${env.slug} ${env.baseUrl} ${JSON.stringify(env.variables)}`
          }
          statusOptions={[
            { value: 'default', label: 'Ambiente Padrão' },
            { value: 'custom', label: 'Ambiente Customizado' },
          ]}
          isArchivedExtractor={(env) => env.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Ambiente / Slug & URL Base',
              width: '42%',
              sortable: true,
              render: (env) => (
                <div>
                  <div className="flex items-center gap-2">
                    <Link to={`/app/global/api-hub/ambientes/${env.id}/editar`} className="font-semibold">
                      {env.name}
                    </Link>
                    {env.isDefault ? (
                      <span className="badge badge-teal">Padrão</span>
                    ) : (
                      <span className="badge badge-neutral">Secundário</span>
                    )}
                  </div>
                  <code className="text-xs text-muted">{env.baseUrl}</code>
                </div>
              ),
            },
            {
              key: 'variables',
              header: 'Variáveis de Interpolação ({{VAR}})',
              width: '48%',
              render: (env) => (
                <div className="flex flex-wrap gap-1">
                  {Object.entries(env.variables).map(([k, v]) => (
                    <span key={k} className="badge badge-neutral mono text-xs">
                      {`{{${k}}}`} = {v}
                    </span>
                  ))}
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '10%',
              isNumeric: true,
              render: (env) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit',
                      label: 'Editar Ambiente (ID Único)',
                      icon: <Edit3 size={14} />,
                      onClick: () => navigate(`/app/global/api-hub/ambientes/${env.id}/editar`),
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {activeTab === 'tokens' && (
        <UrlDataTable<ApiTokenEntity>
          tableId="api-tokens-table"
          caption="Tokens de acesso com armazenamento mascarado e revogação auditada"
          items={apiTokens}
          defaultSortField="createdAt"
          csvFilename="api-hub-tokens.csv"
          searchPlaceholder="Buscar por nome do token, prefixo mascarado ou empresa..."
          statusExtractor={(tok) => tok.status}
          searchExtractor={(tok) => `${tok.name} ${tok.maskedPreview} ${tok.companyName || ''}`}
          statusOptions={[
            { value: 'active', label: t('status.active') },
            { value: 'revoked', label: t('status.revoked') },
            { value: 'expired', label: t('status.expired') },
          ]}
          isArchivedExtractor={(tok) => tok.archiveMetadata.isArchived}
          columns={[
            {
              key: 'name',
              header: 'Identificação / Token Mascarado',
              width: '45%',
              sortable: true,
              render: (tok) => (
                <div>
                  <Link to={`/app/global/api-hub/tokens/${tok.id}/editar`} className="font-semibold">
                    {tok.name}
                  </Link>
                  <div>
                    <code className="text-xs">{tok.maskedPreview}</code>
                  </div>
                </div>
              ),
            },
            {
              key: 'scope',
              header: 'Escopo / Empresa & Validade',
              width: '45%',
              render: (tok) => (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-neutral uppercase">{tok.scope}</span>
                    <StatusBadge status={tok.status} />
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {tok.companyName || 'Plataforma Global'} • Expira: {formatDateTime(tok.expiresAt, session.language)}
                  </div>
                </div>
              ),
            },
            {
              key: 'actions',
              header: 'Ações',
              width: '10%',
              isNumeric: true,
              render: (tok) => (
                <ActionDropdownMenu
                  label="Ações"
                  items={[
                    {
                      id: 'edit',
                      label: 'Editar Token / Escopo (ID Único)',
                      icon: <Edit3 size={14} />,
                      onClick: () => navigate(`/app/global/api-hub/tokens/${tok.id}/editar`),
                    },
                    ...(tok.status === 'active' && hasPermission('api_hub', 'edit')
                      ? [
                          {
                            id: 'revoke',
                            label: 'Revogar Token',
                            icon: <KeyRound size={14} />,
                            variant: 'danger' as const,
                            onClick: () => setRevokeTokenTarget(tok),
                          },
                        ]
                      : []),
                  ]}
                />
              ),
            },
          ]}
        />
      )}

      {activeTab === 'historico' && (
        <UrlDataTable<ApiExecutionHistoryEntity>
          tableId="api-history-table"
          caption="Log cronológico de chamadas executadas no simulador local do API Hub"
          items={apiHistory}
          defaultSortField="executedAt"
          csvFilename="api-hub-historico.csv"
          searchPlaceholder="Buscar por serviço, URL resolvida ou executor..."
          statusExtractor={(h) => String(h.responseStatus)}
          searchExtractor={(h) => `${h.serviceName} ${h.resolvedUrl} ${h.executedByUserName}`}
          statusOptions={[
            { value: '200', label: '200 OK' },
            { value: '201', label: '201 Created' },
            { value: '401', label: '401 Unauthorized' },
            { value: '403', label: '403 Forbidden' },
            { value: '422', label: '422 Unprocessable' },
          ]}
          columns={[
            {
              key: 'executedAt',
              header: 'Data/Hora & Operador',
              width: '26%',
              sortable: true,
              render: (h) => (
                <div>
                  <span className="mono text-xs font-semibold">
                    {formatDateTime(h.executedAt, session.language)}
                  </span>
                  <div className="text-xs text-muted">
                    {h.executedByUserName} • {h.environmentName}
                  </div>
                </div>
              ),
            },
            {
              key: 'serviceName',
              header: 'Serviço / URL Resolvida',
              width: '44%',
              render: (h) => (
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`method-badge method-${h.method}`}>{h.method}</span>
                    <Link
                      to={`/app/global/api-hub/servicos/${h.serviceId}`}
                      className="font-semibold text-sm"
                    >
                      {h.serviceName}
                    </Link>
                  </div>
                  <code className="text-xs text-muted">{h.resolvedUrl}</code>
                </div>
              ),
            },
            {
              key: 'responseStatus',
              header: 'Status / Latência',
              width: '20%',
              sortable: true,
              render: (h) => (
                <div className="flex items-center gap-2">
                  <span
                    className={`badge ${
                      h.responseStatus >= 200 && h.responseStatus < 300
                        ? 'badge-success'
                        : 'badge-danger'
                    } mono`}
                  >
                    HTTP {h.responseStatus}
                  </span>
                  <span className="mono text-xs text-muted">{h.responseLatencyMs} ms</span>
                </div>
              ),
            },
            {
              key: 'inspect',
              header: 'Inspeção',
              width: '10%',
              isNumeric: true,
              render: (h) => (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setInspectHistory(h)}
                >
                  <Eye size={13} /> Payload
                </button>
              ),
            },
          ]}
        />
      )}

      {/* Modal: Importar cURL */}
      <ModalDialog
        open={curlModalOpen}
        onClose={() => setCurlModalOpen(false)}
        title="Importar Comando cURL como Serviço HTTP"
        description="Cole qualquer comando cURL (do Postman, Insomnia, Bling ou documentação REST) para extrair automaticamente Método, URL, Headers e Payload JSON."
        maxWidth="720px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setCurlModalOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="import-curl-form" className="btn btn-primary">
              <Code2 size={14} />
              Importar &amp; Abrir no Runner
            </button>
          </>
        }
      >
        <form id="import-curl-form" onSubmit={handleImportCurlAsService} className="flex flex-col gap-3">
          <div className="form-group">
            <label className="form-label" htmlFor="curl-srv-name">
              Nome do Serviço a Catalogar *
            </label>
            <input
              id="curl-srv-name"
              className="form-input"
              required
              value={curlServiceName}
              onChange={(e) => setCurlServiceName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="curl-raw-input">
              Comando cURL *
            </label>
            <textarea
              id="curl-raw-input"
              className="form-textarea mono"
              rows={6}
              required
              value={curlRawText}
              onChange={(e) => setCurlRawText(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>

      {/* Modal: Estúdio De -> Para & Sincronização em Lote */}
      <ModalDialog
        open={mapperModalOpen}
        onClose={() => setMapperModalOpen(false)}
        title="Estúdio Conector ERP — Mapeamento De -> Para, Transformadores & Dry-Run"
        description="Transforme respostas JSON de APIs externas (Bling, Tiny, HubSpot, Webhooks) em registros operacionais auditados para Estoque, Pedidos ou CRM de qualquer empresa."
        maxWidth="960px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setMapperModalOpen(false)}>
              Fechar
            </button>
            {(() => {
              const preset = API_INTEGRATION_PRESETS.find((p) => p.id === selectedPresetId);
              return preset ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCreatePresetAsService(preset)}
                >
                  <Plus size={14} />
                  Salvar no Catálogo
                </button>
              ) : null;
            })()}
            <button type="button" className="btn btn-secondary" onClick={handleAutoMapFields}>
              <Wand2 size={14} />
              Auto-Mapear Campos
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleRunDryRun}>
              <RefreshCw size={14} />
              Simular Dry-Run
            </button>
            <button type="button" className="btn btn-primary" onClick={handleExecuteBatchSync}>
              <CheckCircle2 size={14} />
              Sincronizar em Lote no Banco ({dryRunRows.filter((r) => r.action !== 'INVALID').length})
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="map-preset">
                Template de Conector ERP
              </label>
              <select
                id="map-preset"
                className="form-select"
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
              >
                {API_INTEGRATION_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="map-company">
                Empresa Destino (Matriz / Filial)
              </label>
              <select
                id="map-company"
                className="form-select"
                value={targetCompanyId}
                onChange={(e) => setTargetCompanyId(e.target.value)}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.tradeName} ({!c.isBranch ? 'Matriz' : `Filial ${c.branchCode || ''}`})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="map-module">
                Módulo Destino na Empresa
              </label>
              <select
                id="map-module"
                className="form-select"
                value={targetModule}
                onChange={(e) => setTargetModule(e.target.value as 'inventory' | 'orders' | 'crm')}
              >
                <option value="inventory">Allin Estoque (SKUs &amp; Saldos)</option>
                <option value="orders">Allin Vendas (Pedidos Faturados)</option>
                <option value="crm">Allin CRM (Contas &amp; Oportunidades)</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="map-root">
                Caminho Raiz da Lista JSON (Root Path)
              </label>
              <input
                id="map-root"
                className="form-input mono"
                value={dataRootPath}
                onChange={(e) => setDataRootPath(e.target.value)}
                placeholder="Ex.: data, pedidos, results (vazio = raiz)"
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title text-sm">Regras de Mapeamento De -&gt; Para &amp; Transformação</h3>
              <span className="badge badge-teal">5 Campos Operacionais</span>
            </div>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Campo Destino (All In)</th>
                    <th>Caminho JSON Origem (Source Path)</th>
                    <th>Transformador</th>
                    <th>Valor Padrão (Fallback)</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldMappings.map((rule, idx) => (
                    <tr key={rule.targetField}>
                      <td>
                        <strong>{rule.targetLabel}</strong>
                        <div className="text-xs text-muted mono">
                          {rule.targetField} {rule.required ? '*' : ''}
                        </div>
                      </td>
                      <td>
                        <input
                          className="form-input mono text-xs"
                          value={rule.sourcePath}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFieldMappings((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, sourcePath: val } : r)),
                            );
                          }}
                        />
                      </td>
                      <td>
                        <select
                          className="form-select text-xs mono"
                          value={rule.transform}
                          onChange={(e) => {
                            const val = e.target.value as DataTransformType;
                            setFieldMappings((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, transform: val } : r)),
                            );
                          }}
                        >
                          <option value="NONE">NONE (Original)</option>
                          <option value="TRIM">TRIM (Limpar Espaços)</option>
                          <option value="UPPERCASE">UPPERCASE (Maiúsculas)</option>
                          <option value="LOWERCASE">LOWERCASE (Minúsculas)</option>
                          <option value="DIGITS_ONLY">DIGITS_ONLY (Apenas Números)</option>
                          <option value="CURRENCY_NUMBER">CURRENCY_NUMBER (Moeda/Decimal)</option>
                          <option value="AUTO_SKU">AUTO_SKU (Gerar SKU se vazio)</option>
                        </select>
                      </td>
                      <td>
                        <input
                          className="form-input text-xs"
                          value={rule.defaultValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFieldMappings((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, defaultValue: val } : r)),
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="map-json-source">
                Payload JSON Retornado pela API Externa
              </label>
              <textarea
                id="map-json-source"
                className="form-textarea mono text-xs"
                rows={8}
                value={rawSourceJson}
                onChange={(e) => setRawSourceJson(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="form-label">Prévia Dry-Run (Simulação antes de Gravar)</span>
                <span className="badge badge-info">{dryRunRows.length} item(ns)</span>
              </div>
              {dryRunRows.length === 0 ? (
                <div className="empty-state" style={{ padding: '1.5rem' }}>
                  <p className="text-xs text-muted">
                    Clique em <strong>Simular Dry-Run</strong> para pré-visualizar os registros transformados.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ação</th>
                        <th>Código</th>
                        <th>Título</th>
                        <th className="num">Qtd</th>
                        <th className="num">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dryRunRows.map((r, i) => (
                        <tr key={`${r.code}-${i}`}>
                          <td>
                            <span
                              className={`badge ${
                                r.action === 'CREATE'
                                  ? 'badge-success'
                                  : r.action === 'UPDATE'
                                    ? 'badge-info'
                                    : 'badge-danger'
                              } mono`}
                            >
                              {r.action}
                            </span>
                          </td>
                          <td className="mono text-xs font-semibold">{r.code}</td>
                          <td className="text-xs">{r.title}</td>
                          <td className="num tabular text-xs">{r.quantity}</td>
                          <td className="num tabular text-xs font-semibold">
                            {formatCurrency(r.amount, 'BRL', session.language)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </ModalDialog>

      {/* Modal: Inspeção Rápida de Serviço HTTP + Snippet cURL */}
      <ModalDialog
        open={Boolean(inspectService)}
        onClose={() => setInspectService(null)}
        title={inspectService ? `${inspectService.method} — ${inspectService.name}` : 'Serviço HTTP'}
        description={inspectService?.description}
        maxWidth="740px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setInspectService(null)}>
              Fechar
            </button>
            {inspectService && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const id = inspectService.id;
                  setInspectService(null);
                  navigate(`/app/global/api-hub/servicos/${id}`);
                }}
              >
                <Play size={14} /> Abrir no Console Executor
              </button>
            )}
          </>
        }
      >
        {inspectService && (
          <div className="flex flex-col gap-3">
            <div className="grid-2 text-xs">
              <div>
                <span className="text-muted uppercase block">Endpoint Completo</span>
                <code className="mono font-semibold">
                  {inspectService.baseUrl}
                  {inspectService.path}
                </code>
              </div>
              <div>
                <span className="text-muted uppercase block">Autenticação / Timeout</span>
                <strong>
                  {inspectService.authType} • {inspectService.timeoutMs} ms
                </strong>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-muted">Snippet cURL Pronto</span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      generateCurlSnippet({
                        method: inspectService.method,
                        url: `${inspectService.baseUrl}${inspectService.path}`,
                        authType: inspectService.authType,
                        body: inspectService.bodyTemplate,
                      }),
                    );
                    notify({ type: 'info', title: 'cURL copiado!' });
                  }}
                >
                  <Copy size={12} /> Copiar cURL
                </button>
              </div>
              <pre className="code-block">
                {generateCurlSnippet({
                  method: inspectService.method,
                  url: `${inspectService.baseUrl}${inspectService.path}`,
                  authType: inspectService.authType,
                  body: inspectService.bodyTemplate,
                })}
              </pre>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Modal: Inspeção de Histórico de Execução */}
      <ModalDialog
        open={Boolean(inspectHistory)}
        onClose={() => setInspectHistory(null)}
        title={inspectHistory ? `Execução HTTP ${inspectHistory.responseStatus} — ${inspectHistory.serviceName}` : 'Execução'}
        description={inspectHistory ? `${inspectHistory.method} ${inspectHistory.resolvedUrl}` : ''}
        maxWidth="760px"
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setInspectHistory(null)}>
            Fechar
          </button>
        }
      >
        {inspectHistory && (
          <div className="flex flex-col gap-3">
            <div className="grid-3 text-xs">
              <div>
                <span className="text-muted block">Operador</span>
                <strong>{inspectHistory.executedByUserName}</strong>
              </div>
              <div>
                <span className="text-muted block">Ambiente</span>
                <strong>{inspectHistory.environmentName}</strong>
              </div>
              <div>
                <span className="text-muted block">Latência / Horário</span>
                <strong className="mono">
                  {inspectHistory.responseLatencyMs} ms • {formatDateTime(inspectHistory.executedAt, session.language)}
                </strong>
              </div>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-muted block mb-1">Response Headers</span>
              <pre className="code-block">{JSON.stringify(inspectHistory.responseHeaders, null, 2)}</pre>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase text-muted block mb-1">Response Body (JSON)</span>
              <pre className="code-block">{inspectHistory.responseBody}</pre>
            </div>
          </div>
        )}
      </ModalDialog>

      {/* Modals for Collection, Environment, Token Creation & Revocation */}
      <ModalDialog
        open={newCollectionOpen}
        onClose={() => setNewCollectionOpen(false)}
        title="Nova Coleção de Serviços HTTP"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewCollectionOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="col-form" className="btn btn-primary">
              Criar Coleção
            </button>
          </>
        }
      >
        <form id="col-form" onSubmit={handleCreateCollection} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="col-name">
              Nome da Coleção *
            </label>
            <input
              id="col-name"
              className="form-input"
              required
              value={colName}
              onChange={(e) => setColName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="col-cat">
              Categoria Técnica *
            </label>
            <input
              id="col-cat"
              className="form-input"
              required
              value={colCategory}
              onChange={(e) => setColCategory(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="col-desc">
              Descrição
            </label>
            <textarea
              id="col-desc"
              className="form-textarea"
              value={colDesc}
              onChange={(e) => setColDesc(e.target.value)}
            />
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={newEnvOpen}
        onClose={() => setNewEnvOpen(false)}
        title="Novo Ambiente de Execução HTTP"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewEnvOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="env-form" className="btn btn-primary">
              Salvar Ambiente
            </button>
          </>
        }
      >
        <form id="env-form" onSubmit={handleCreateEnvironment} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="env-name">
              Nome do Ambiente *
            </label>
            <input
              id="env-name"
              className="form-input"
              required
              value={envName}
              onChange={(e) => setEnvName(e.target.value)}
              placeholder="Ex.: Sandbox Multi-Região"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="env-url">
              Base URL ({'{{BASE_URL}}'}) *
            </label>
            <input
              id="env-url"
              className="form-input mono"
              required
              value={envBaseUrl}
              onChange={(e) => setEnvBaseUrl(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="env-tenant">
              Variável Padrão {"{{TENANT_ID}}"}
            </label>
            <select
              id="env-tenant"
              className="form-select"
              value={envTenantId}
              onChange={(e) => setEnvTenantId(e.target.value)}
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.tradeName} ({c.id})
                </option>
              ))}
            </select>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={newTokenOpen}
        onClose={() => setNewTokenOpen(false)}
        title="Emitir Novo Token de API Corporativo"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setNewTokenOpen(false)}>
              {t('common.cancel')}
            </button>
            <button type="submit" form="tok-form" className="btn btn-primary">
              Emitir Credencial Mascarada
            </button>
          </>
        }
      >
        <form id="tok-form" onSubmit={handleCreateToken} className="flex flex-col gap-4">
          <div className="banner banner-simulated">
            <ShieldCheck size={16} />
            <div>
              Segurança por design: o token nunca é armazenado em texto aberto; apenas seu prefixo
              mascarado é sincronizado no Supabase PostgreSQL.
            </div>
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tok-name">
              Finalidade / Identificação do Token *
            </label>
            <input
              id="tok-name"
              className="form-input"
              required
              value={tokName}
              onChange={(e) => setTokName(e.target.value)}
              placeholder="Ex.: Integração ERP Contábil"
            />
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="tok-scope">
                Escopo
              </label>
              <select
                id="tok-scope"
                className="form-select"
                value={tokScope}
                onChange={(e) => setTokScope(e.target.value as PermissionScope)}
              >
                <option value="company">Empresa Específica (Tenant)</option>
                <option value="global">Plataforma Global</option>
              </select>
            </div>
            {tokScope === 'company' && (
              <div className="form-group">
                <label className="form-label" htmlFor="tok-comp">
                  Empresa Associada
                </label>
                <select
                  id="tok-comp"
                  className="form-select"
                  value={tokCompanyId}
                  onChange={(e) => setTokCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.tradeName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="tok-exp">
                Data de Expiração *
              </label>
              <input
                id="tok-exp"
                type="date"
                className="form-input"
                required
                value={tokExpiresAt}
                onChange={(e) => setTokExpiresAt(e.target.value)}
              />
            </div>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={Boolean(revokeTokenTarget)}
        onClose={() => setRevokeTokenTarget(null)}
        title={`Revogar Token ${revokeTokenTarget?.maskedPreview || ''}`}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setRevokeTokenTarget(null)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" form="revoke-tok-form" className="btn btn-danger">
              Confirmar Revogação Imediata
            </button>
          </>
        }
      >
        <form id="revoke-tok-form" onSubmit={handleConfirmRevokeToken} className="flex flex-col gap-4">
          <div className="form-group">
            <label className="form-label" htmlFor="rev-reason">
              Motivo da Revogação (Obrigatório para Auditoria) *
            </label>
            <textarea
              id="rev-reason"
              className="form-textarea"
              required
              value={revokeReason}
              onChange={(e) => setRevokeReason(e.target.value)}
              placeholder="Ex.: Rotação periódica de credenciais ou desligamento de conector."
            />
          </div>
        </form>
      </ModalDialog>

      <ArchiveRecordDialog
        open={Boolean(archiveServiceTarget)}
        onClose={() => setArchiveServiceTarget(null)}
        recordTitle={archiveServiceTarget?.name || ''}
        onConfirmArchive={async (reason) => {
          if (!archiveServiceTarget) return;
          await repositories.apiServices.archive(archiveServiceTarget.id, reason, getActor());
          await refreshData();
          notify({ type: 'warning', title: `Serviço HTTP ${archiveServiceTarget.name} arquivado.` });
        }}
      />
    </div>
  );
};

export const ApiServiceFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { servicoId } = useParams<{ servicoId: string }>();
  const { apiServices, apiCollections, hasPermission, getActor, refreshData, notify, t } = useApp();
  const navigate = useNavigate();

  const existing = mode === 'edit' ? apiServices.find((s) => s.id === servicoId) : undefined;

  const [name, setName] = useState(existing?.name || '');
  const [collectionId, setCollectionId] = useState(
    existing?.collectionId || apiCollections[0]?.id || 'col-erp-core',
  );
  const [method, setMethod] = useState<HttpMethod>(existing?.method || 'GET');
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || '{{BASE_URL}}');
  const [path, setPath] = useState(existing?.path || '/tenants/{{TENANT_ID}}/status');
  const [description, setDescription] = useState(existing?.description || '');
  const [authType, setAuthType] = useState<'none' | 'bearer_token' | 'api_key'>(
    existing?.authType || 'bearer_token',
  );
  const [bodyTemplate, setBodyTemplate] = useState(existing?.bodyTemplate || '');
  const [isDirty, setIsDirty] = useState(false);

  if (!hasPermission('api_hub', mode === 'create' ? 'create' : 'edit')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para cadastrar ou editar serviços HTTP no API Hub."
        requiredPermission={`api_hub:${mode}`}
      />
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (mode === 'create') {
      const newSrv: ApiServiceEntity = {
        id: generateId('srv'),
        collectionId,
        name: name.trim(),
        description: description.trim(),
        method,
        baseUrl: baseUrl.trim(),
        path: path.trim(),
        defaultHeaders: [{ key: 'Accept', value: 'application/json', enabled: true }],
        queryParams: [],
        authType,
        bodyType: method === 'GET' ? 'none' : 'json',
        bodyTemplate,
        timeoutMs: 2500,
        expectedResponses: [
          {
            statusCode: 200,
            label: '200 OK — Resposta Simulada Padrão',
            latencyMs: 64,
            headers: { 'content-type': 'application/json' },
            bodyJson: JSON.stringify(
              { status: 'OK_SIMULATED', endpoint: path.trim(), timestamp: now },
              null,
              2,
            ),
          },
        ],
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.apiServices.create(
        newSrv,
        getActor(),
        `Cadastro de novo serviço HTTP ${newSrv.method} ${newSrv.name}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Serviço HTTP ${newSrv.name} cadastrado.` });
      navigate(`/app/global/api-hub/servicos/${newSrv.id}`);
    } else if (existing) {
      await repositories.apiServices.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          collectionId,
          method,
          baseUrl: baseUrl.trim(),
          path: path.trim(),
          description: description.trim(),
          authType,
          bodyTemplate,
        }),
        getActor(),
        `Atualização de especificação do serviço HTTP ${name.trim()}.`,
      );
      await refreshData();
      notify({ type: 'success', title: `Serviço ${name} atualizado.` });
      navigate(`/app/global/api-hub/servicos/${existing.id}`);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/servicos' },
          { label: mode === 'create' ? 'Novo Serviço HTTP' : existing?.name || 'Editar' },
        ]}
        title={mode === 'create' ? 'Cadastrar Novo Serviço HTTP' : `Editar Serviço: ${existing?.name}`}
        subtitle="Defina método, template de URL com variáveis de ambiente, política de autenticação e payload."
      />

      <UnsavedChangesBanner isDirty={isDirty} onDiscard={() => setIsDirty(false)} />

      <form onSubmit={handleSave} onChange={() => setIsDirty(true)} className="card">
        <div className="card-body flex flex-col gap-4">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="srv-name">
                Nome do Serviço *
              </label>
              <input
                id="srv-name"
                className="form-input"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-col">
                Coleção
              </label>
              <select
                id="srv-col"
                className="form-select"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
              >
                {apiCollections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-method">
                Método HTTP
              </label>
              <select
                id="srv-method"
                className="form-select mono"
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-auth">
                Autenticação Exigida
              </label>
              <select
                id="srv-auth"
                className="form-select"
                value={authType}
                onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer_token' | 'api_key')}
              >
                <option value="bearer_token">Bearer Token (OAuth2 / JWT Simulado)</option>
                <option value="api_key">X-API-Key Header</option>
                <option value="none">Público / Sem Autenticação</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="srv-base">
                Base URL *
              </label>
              <input
                id="srv-base"
                className="form-input mono"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="srv-path">
                Caminho do Endpoint (Path) *
              </label>
              <input
                id="srv-path"
                className="form-input mono"
                required
                value={path}
                onChange={(e) => setPath(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="srv-desc">
              Descrição Técnica *
            </label>
            <input
              id="srv-desc"
              className="form-input"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="srv-body">
              Corpo da Requisição Padrão (JSON Template)
            </label>
            <textarea
              id="srv-body"
              className="form-textarea mono"
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <div className="card-footer flex justify-between">
          <Link to="/app/global/api-hub/servicos" className="btn btn-secondary">
            {t('common.cancel')}
          </Link>
          <button type="submit" className="btn btn-primary">
            <Save size={14} />
            Salvar Serviço HTTP
          </button>
        </div>
      </form>
    </div>
  );
};

export const ApiServiceInspectorAndRunnerPage: React.FC = () => {
  const { servicoId } = useParams<{ servicoId: string }>();
  const {
    apiServices,
    apiEnvironments,
    apiTokens,
    currentUser,
    hasPermission,
    getActor,
    refreshData,
    notify,
    t,
  } = useApp();

  const service = apiServices.find((s) => s.id === servicoId);
  const [selectedEnvId, setSelectedEnvId] = useState(
    apiEnvironments.find((e) => e.isDefault)?.id || apiEnvironments[0]?.id || '',
  );
  const [selectedTokenId, setSelectedTokenId] = useState(
    apiTokens.find((tok) => tok.status === 'active')?.id || '',
  );
  const [selectedStatusCode, setSelectedStatusCode] = useState<number>(
    service?.expectedResponses[0]?.statusCode || 200,
  );
  const [customUrlOverride, setCustomUrlOverride] = useState('');
  const [customBody, setCustomBody] = useState(service?.bodyTemplate || '');
  const [lastExecution, setLastExecution] = useState<ApiExecutionHistoryEntity | null>(null);
  const [securityBlockError, setSecurityBlockError] = useState<string | null>(null);

  if (!hasPermission('api_hub', 'view')) {
    return (
      <AccessDeniedView
        reason="Sem permissão para inspecionar ou testar endpoints no API Hub."
        requiredPermission="api_hub:view"
      />
    );
  }

  if (!service) {
    return (
      <AccessDeniedView
        reason="Serviço HTTP não encontrado no catálogo do API Hub."
        requiredPermission="api_hub:view"
      />
    );
  }

  const selectedEnv = apiEnvironments.find((e) => e.id === selectedEnvId);
  const selectedToken = apiTokens.find((tok) => tok.id === selectedTokenId);

  const previewUrl =
    customUrlOverride.trim() ||
    `${interpolateVariables(service.baseUrl, selectedEnv).replace(/\/$/, '')}/${interpolateVariables(
      service.path,
      selectedEnv,
    ).replace(/^\//, '')}`;

  const handleRunSimulation = async () => {
    setSecurityBlockError(null);
    const serviceToRun: ApiServiceEntity = customUrlOverride.trim()
      ? { ...service, baseUrl: customUrlOverride.trim(), path: '' }
      : service;

    const result = executeSimulatedHttpCall({
      service: serviceToRun,
      environment: selectedEnv,
      token: selectedToken,
      selectedStatusCode,
      customBody,
      actorUserId: currentUser?.id || 'usr-super-admin',
      actorUserName: currentUser?.name || 'Super Admin',
    });

    if (!result.ok) {
      setSecurityBlockError(result.error || 'Execução bloqueada pela política Anti-SSRF.');
      notify({
        type: 'error',
        title: 'Bloqueio de Segurança (Anti-SSRF)',
        description: result.error,
      });
      return;
    }

    if (result.historyEntry) {
      await repositories.apiHistory.create(result.historyEntry, getActor());
      if (isSupabaseConfigured) {
        try {
          await supabase.from('allin_api_history').insert({
            id: result.historyEntry.id,
            service_id: result.historyEntry.serviceId,
            service_name: result.historyEntry.serviceName,
            method: result.historyEntry.method,
            resolved_url: result.historyEntry.resolvedUrl,
            environment_name: result.historyEntry.environmentName,
            token_masked: selectedToken?.maskedPreview || 'TOK_API_****',
            response_status: result.historyEntry.responseStatus,
            response_latency_ms: result.historyEntry.responseLatencyMs,
            executed_by: result.historyEntry.executedByUserName,
            executed_at: result.historyEntry.executedAt,
          });
        } catch {
          // Non-blocking audit sync
        }
      }
      await refreshData();
      setLastExecution(result.historyEntry);
      notify({
        type: result.historyEntry.responseStatus < 300 ? 'success' : 'warning',
        title: `Execução concluída: HTTP ${result.historyEntry.responseStatus} (${result.historyEntry.responseLatencyMs} ms)`,
      });
    }
  };

  const handleRunLivePostgrest = async () => {
    setSecurityBlockError(null);
    const startMs = performance.now();
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,full_name,role,status,primary_company_id')
        .limit(10);
      const latency = Math.max(12, Math.round(performance.now() - startMs));
      const status = error ? 400 : 200;
      const bodyStr = JSON.stringify(
        error
          ? { error: error.message }
          : {
              provider: 'Supabase PostgREST 17',
              table: 'public.profiles',
              count: data?.length || 0,
              records: data || [],
            },
        null,
        2,
      );

      const entry: ApiExecutionHistoryEntity = {
        id: generateId('apih'),
        serviceId: service.id,
        serviceName: `${service.name} (Live PostgREST)`,
        environmentId: selectedEnv?.id || 'env-supabase-live',
        environmentName: 'Supabase Production (uaxeevcbkgvcctxrfdyh)',
        tokenId: selectedToken?.id,
        method: 'GET',
        resolvedUrl: 'https://uaxeevcbkgvcctxrfdyh.supabase.co/rest/v1/profiles?select=id,email,full_name,role,status',
        requestHeaders: {
          Accept: 'application/json',
          'Accept-Profile': 'public',
          Authorization: 'Bearer sb_publishable_****',
        },
        requestBody: '',
        responseStatus: status,
        responseLatencyMs: latency,
        responseHeaders: {
          'content-type': 'application/json; charset=utf-8',
          'x-supabase-project': 'uaxeevcbkgvcctxrfdyh',
          'x-correlation-id': `SUPA-${Date.now()}`,
        },
        responseBody: bodyStr,
        executedByUserId: currentUser?.id || 'usr-super-admin',
        executedByUserName: currentUser?.name || 'Super Admin',
        executedAt: new Date().toISOString(),
        isSimulated: false,
      };

      await repositories.apiHistory.create(entry, getActor());
      if (isSupabaseConfigured) {
        try {
          await supabase.from('allin_api_history').insert({
            id: entry.id,
            service_id: entry.serviceId,
            service_name: entry.serviceName,
            method: entry.method,
            resolved_url: entry.resolvedUrl,
            environment_name: entry.environmentName,
            token_masked: selectedToken?.maskedPreview || 'sb_publishable_****_live',
            response_status: entry.responseStatus,
            response_latency_ms: entry.responseLatencyMs,
            executed_by: entry.executedByUserName,
            executed_at: entry.executedAt,
          });
        } catch {
          // Non-blocking
        }
      }
      await refreshData();
      setLastExecution(entry);
      notify({
        type: status === 200 ? 'success' : 'error',
        title: `Live Supabase PostgREST: HTTP ${status} (${latency} ms)`,
      });
    } catch (err) {
      notify({
        type: 'error',
        title: 'Falha na chamada PostgREST',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/servicos' },
          { label: service.name },
        ]}
        title={service.name}
        subtitle={service.description}
        scopeBadge={`HTTP ${service.method}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {hasPermission('api_hub', 'edit') && (
              <Link
                to={`/app/global/api-hub/servicos/${service.id}/editar`}
                className="btn btn-secondary btn-sm"
              >
                <Edit3 size={14} />
                Editar Especificação
              </Link>
            )}
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleRunLivePostgrest}>
              <Database size={14} />
              Testar Live PostgREST (Supabase)
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleRunSimulation}>
              <Play size={14} />
              Executar Chamada HTTP
            </button>
          </div>
        }
      />

      <div className="banner banner-simulated">
        <Terminal size={16} />
        <div>
          <strong>Executor HTTP Auditado (Anti-SSRF + Supabase PostgREST):</strong> Requisições para
          loopback (`localhost`, `127.0.0.1`) ou redes privadas internas são bloqueadas automaticamente.
          Todas as execuções são gravadas na tabela <code>public.allin_api_history</code> do Supabase.
        </div>
      </div>

      {securityBlockError && (
        <div className="banner banner-danger" role="alert">
          <ShieldAlert size={18} />
          <div>
            <strong>Execução Bloqueada por Política de Segurança:</strong> {securityBlockError}
          </div>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Configuração da Requisição (Request Builder)</h2>
            <span className={`method-badge method-${service.method}`}>{service.method}</span>
          </div>
          <div className="card-body flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label" htmlFor="run-url-preview">
                URL Resolvida com Variáveis do Ambiente (ou teste Anti-SSRF)
              </label>
              <span id="run-url-hint" className="form-hint">
                Deixe em branco para usar o template do serviço ({previewUrl}) ou informe uma URL para validar o filtro Anti-SSRF.
              </span>
              <input
                id="run-url-preview"
                aria-describedby="run-url-hint"
                className="form-input mono"
                value={customUrlOverride}
                onChange={(e) => setCustomUrlOverride(e.target.value)}
                placeholder={previewUrl}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label" htmlFor="run-env">
                  Ambiente de Variáveis
                </label>
                <select
                  id="run-env"
                  className="form-select"
                  value={selectedEnvId}
                  onChange={(e) => setSelectedEnvId(e.target.value)}
                >
                  {apiEnvironments.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.name} ({env.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="run-token">
                  Credencial / Token de API ({service.authType})
                </label>
                <select
                  id="run-token"
                  className="form-select"
                  value={selectedTokenId}
                  onChange={(e) => setSelectedTokenId(e.target.value)}
                >
                  <option value="">-- Sem Token (Testar 401) --</option>
                  {apiTokens.map((tok) => (
                    <option key={tok.id} value={tok.id}>
                      {tok.name} ({tok.maskedPreview}) [{tok.status}]
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="run-status">
                  Cenário de Resposta Esperado
                </label>
                <select
                  id="run-status"
                  className="form-select mono"
                  value={selectedStatusCode}
                  onChange={(e) => setSelectedStatusCode(Number(e.target.value))}
                >
                  {service.expectedResponses.map((r) => (
                    <option key={r.statusCode} value={r.statusCode}>
                      {r.label} ({r.latencyMs} ms)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {service.method !== 'GET' && (
              <div className="form-group">
                <label className="form-label" htmlFor="run-body">
                  Payload da Requisição (JSON)
                </label>
                <textarea
                  id="run-body"
                  className="form-textarea mono"
                  rows={6}
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-muted">
                  Comando cURL Equivalente (Postman / Terminal)
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const snippet = generateCurlSnippet({
                      method: service.method,
                      url: previewUrl,
                      authType: service.authType,
                      tokenPreview: selectedToken?.maskedPreview,
                      body: customBody,
                    });
                    navigator.clipboard?.writeText(snippet);
                    notify({ type: 'info', title: 'Snippet cURL copiado para a área de transferência!' });
                  }}
                >
                  <Copy size={12} /> Copiar cURL
                </button>
              </div>
              <pre className="code-block">
                {generateCurlSnippet({
                  method: service.method,
                  url: previewUrl,
                  authType: service.authType,
                  tokenPreview: selectedToken?.maskedPreview,
                  body: customBody,
                })}
              </pre>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Inspeção da Resposta (Response Inspector)</h2>
            {lastExecution && (
              <div className="flex items-center gap-2">
                <span
                  className={`badge ${
                    lastExecution.responseStatus < 300 ? 'badge-success' : 'badge-danger'
                  } mono`}
                >
                  HTTP {lastExecution.responseStatus}
                </span>
                <span className="mono text-xs text-muted">
                  {lastExecution.responseLatencyMs} ms
                </span>
              </div>
            )}
          </div>
          <div className="card-body flex flex-col gap-3">
            {!lastExecution ? (
              <div className="empty-state">
                <div className="empty-state-title">Aguardando Execução HTTP</div>
                <p className="text-xs text-muted">
                  Clique em &ldquo;Executar Chamada HTTP&rdquo; ou &ldquo;Testar Live PostgREST (Supabase)&rdquo; para interpolar variáveis,
                  validar o token e inspecionar os cabeçalhos e o payload JSON de retorno.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted mb-1">
                    URL Efetivamente Resolvida
                  </div>
                  <code className="text-xs">{lastExecution.resolvedUrl}</code>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted mb-1">
                    Response Headers
                  </div>
                  <pre className="code-block">
                    {JSON.stringify(lastExecution.responseHeaders, null, 2)}
                  </pre>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase text-muted mb-1">
                    Response Body (JSON)
                  </div>
                  <pre className="code-block">{lastExecution.responseBody}</pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. DEDICATED PAGES: COLEÇÕES, AMBIENTES E TOKENS (COM ID ÚNICO)
// ============================================================================
export const ApiCollectionFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { colecaoId } = useParams<{ colecaoId: string }>();
  const navigate = useNavigate();
  const { apiCollections, refreshData, getActor, notify, t } = useApp();

  const existing = useMemo(
    () => (mode === 'edit' ? apiCollections.find((c) => c.id === colecaoId) : undefined),
    [apiCollections, colecaoId, mode],
  );

  const [name, setName] = useState(existing?.name || '');
  const [category, setCategory] = useState(existing?.category || 'Core');
  const [description, setDescription] = useState(existing?.description || '');

  if (mode === 'edit' && !existing) {
    return (
      <div className="card">
        <div className="card-body">Coleção não localizada ({colecaoId}).</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (mode === 'create') {
      const col: ApiCollectionEntity = {
        id: generateId('col'),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.apiCollections.create(col, getActor(), `Criação de coleção HTTP "${col.name}".`);
      await refreshData();
      notify({ type: 'success', title: `Coleção ${col.name} criada.` });
      navigate('/app/global/api-hub/colecoes');
    } else if (existing) {
      await repositories.apiCollections.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          updatedAt: now,
        }),
        getActor(),
        `Edição da coleção HTTP "${name}".`,
      );
      await refreshData();
      notify({ type: 'success', title: `Coleção ${name} atualizada.` });
      navigate('/app/global/api-hub/colecoes');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/colecoes' },
          { label: mode === 'create' ? 'Nova Coleção' : `Editar ${existing?.name}` },
        ]}
        title={mode === 'create' ? 'Nova Coleção HTTP' : `Editar Coleção: ${existing?.name}`}
        subtitle={mode === 'edit' ? `ID Único: ${existing?.id}` : 'Agrupamento lógico de endpoints HTTP por domínio técnico.'}
        actions={
          <Link to="/app/global/api-hub/colecoes" className="btn btn-secondary">
            <ArrowLeft size={15} />
            {t('common.back')}
          </Link>
        }
      />
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="col-page-name">Nome da Coleção *</label>
            <input
              id="col-page-name"
              className="form-input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="col-page-cat">Domínio Técnico *</label>
            <input
              id="col-page-cat"
              className="form-input"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="col-page-desc">Descrição</label>
            <textarea
              id="col-page-desc"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer">
          <Link to="/app/global/api-hub/colecoes" className="btn btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </div>
  );
};

export const ApiEnvironmentFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { ambienteId } = useParams<{ ambienteId: string }>();
  const navigate = useNavigate();
  const { apiEnvironments, refreshData, getActor, notify, t } = useApp();

  const existing = useMemo(
    () => (mode === 'edit' ? apiEnvironments.find((e) => e.id === ambienteId) : undefined),
    [apiEnvironments, ambienteId, mode],
  );

  const [name, setName] = useState(existing?.name || '');
  const [slug, setSlug] = useState(existing?.slug || 'staging-v2');
  const [baseUrl, setBaseUrl] = useState(existing?.baseUrl || 'https://staging.api.allin.local/v1');
  const [isDefault, setIsDefault] = useState(existing?.isDefault || false);
  const [variablesJson, setVariablesJson] = useState(
    JSON.stringify(
      existing?.variables || { TENANT_ID: 'emp-olivelas-matriz', API_VERSION: '2026-10', TIMEOUT_MS: '3000' },
      null,
      2,
    ),
  );

  if (mode === 'edit' && !existing) {
    return (
      <div className="card">
        <div className="card-body">Ambiente não localizado ({ambienteId}).</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let parsedVars: Record<string, string> = {};
    try {
      parsedVars = JSON.parse(variablesJson);
    } catch {
      notify({ type: 'error', title: 'JSON de variáveis inválido.' });
      return;
    }

    const now = new Date().toISOString();
    if (mode === 'create') {
      const env: ApiEnvironmentEntity = {
        id: generateId('env'),
        name: name.trim(),
        slug: slug.trim(),
        baseUrl: baseUrl.trim(),
        variables: parsedVars,
        isDefault,
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.apiEnvironments.create(env, getActor(), `Criação do ambiente "${env.name}".`);
      await refreshData();
      notify({ type: 'success', title: `Ambiente ${env.name} registrado.` });
      navigate('/app/global/api-hub/ambientes');
    } else if (existing) {
      await repositories.apiEnvironments.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          slug: slug.trim(),
          baseUrl: baseUrl.trim(),
          variables: parsedVars,
          isDefault,
          updatedAt: now,
        }),
        getActor(),
        `Edição do ambiente "${name}".`,
      );
      await refreshData();
      notify({ type: 'success', title: `Ambiente ${name} atualizado.` });
      navigate('/app/global/api-hub/ambientes');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/ambientes' },
          { label: mode === 'create' ? 'Novo Ambiente' : `Editar ${existing?.name}` },
        ]}
        title={mode === 'create' ? 'Novo Ambiente de API' : `Editar Ambiente: ${existing?.name}`}
        subtitle={mode === 'edit' ? `ID Único: ${existing?.id}` : 'Configuração de URL Base e variáveis de interpolação {{VAR}}.'}
        actions={
          <Link to="/app/global/api-hub/ambientes" className="btn btn-secondary">
            <ArrowLeft size={15} />
            {t('common.back')}
          </Link>
        }
      />
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="env-page-name">Nome do Ambiente *</label>
            <input id="env-page-name" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="env-page-slug">Slug Técnico *</label>
            <input id="env-page-slug" className="form-input mono" required value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="env-page-url">URL Base ({`{{BASE_URL}}`}) *</label>
            <input id="env-page-url" className="form-input mono" required value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="form-group" style={{ justifyContent: 'flex-end' }}>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
              Definir como Ambiente Padrão
            </label>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" htmlFor="env-page-vars">Variáveis de Interpolação (JSON) *</label>
            <textarea
              id="env-page-vars"
              className="form-textarea mono"
              rows={5}
              value={variablesJson}
              onChange={(e) => setVariablesJson(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer">
          <Link to="/app/global/api-hub/ambientes" className="btn btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </div>
  );
};

export const ApiTokenFormPage: React.FC<{ mode: 'create' | 'edit' }> = ({ mode }) => {
  const { tokenId } = useParams<{ tokenId: string }>();
  const navigate = useNavigate();
  const { apiTokens, companies, currentUser, refreshData, getActor, notify, t } = useApp();

  const existing = useMemo(
    () => (mode === 'edit' ? apiTokens.find((tk) => tk.id === tokenId) : undefined),
    [apiTokens, tokenId, mode],
  );

  const [name, setName] = useState(existing?.name || '');
  const [scope, setScope] = useState<'global' | 'company'>(
    existing?.scope === 'global' ? 'global' : 'company',
  );
  const [companyId, setCompanyId] = useState(existing?.companyId || companies[0]?.id || 'emp-olivelas-matriz');
  const [expiresAt, setExpiresAt] = useState(
    existing?.expiresAt ? existing.expiresAt.slice(0, 10) : '2027-12-31',
  );

  if (mode === 'edit' && !existing) {
    return (
      <div className="card">
        <div className="card-body">Token não localizado ({tokenId}).</div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const comp = companies.find((c) => c.id === companyId);

    if (mode === 'create') {
      const suffix = Math.random().toString(16).slice(2, 6);
      const tok: ApiTokenEntity = {
        id: generateId('tok'),
        name: name.trim(),
        maskedPreview: `allin_${scope === 'global' ? 'live' : 'ten'}_sim_****_${suffix}`,
        scope,
        companyId: scope === 'company' ? companyId : undefined,
        companyName: scope === 'company' ? comp?.legalName : undefined,
        permissions: ['api_hub:view', 'modules:view', 'orders:view'],
        expiresAt: `${expiresAt}T23:59:59.000Z`,
        status: 'active',
        createdByUserId: currentUser?.id || 'usr-super-admin',
        createdByUserName: currentUser?.name || 'Super Admin',
        createdAt: now,
        updatedAt: now,
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      };
      await repositories.apiTokens.create(tok, getActor(tok.companyId), `Emissão de token mascarado (${tok.maskedPreview}).`);
      await refreshData();
      notify({ type: 'success', title: `Token emitido: ${tok.maskedPreview}` });
      navigate('/app/global/api-hub/tokens');
    } else if (existing) {
      await repositories.apiTokens.update(
        existing.id,
        (curr) => ({
          ...curr,
          name: name.trim(),
          scope,
          companyId: scope === 'company' ? companyId : undefined,
          companyName: scope === 'company' ? comp?.legalName : undefined,
          expiresAt: `${expiresAt}T23:59:59.000Z`,
          updatedAt: now,
        }),
        getActor(scope === 'company' ? companyId : undefined),
        `Atualização do token de API "${name}".`,
      );
      await refreshData();
      notify({ type: 'success', title: `Token ${name} atualizado.` });
      navigate('/app/global/api-hub/tokens');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        breadcrumbs={[
          { label: t('scope.global'), to: '/app/global' },
          { label: t('nav.apiHub'), to: '/app/global/api-hub/tokens' },
          { label: mode === 'create' ? 'Gerar Token' : `Editar ${existing?.name}` },
        ]}
        title={mode === 'create' ? 'Emitir Novo Token de API Mascarado' : `Editar Token: ${existing?.name}`}
        subtitle={mode === 'edit' ? `ID Único: ${existing?.id} • ${existing?.maskedPreview}` : 'Tokens são gravados com máscara criptográfica.'}
        actions={
          <Link to="/app/global/api-hub/tokens" className="btn btn-secondary">
            <ArrowLeft size={15} />
            {t('common.back')}
          </Link>
        }
      />
      <form onSubmit={handleSubmit} className="card">
        <div className="card-body grid-2">
          <div className="form-group">
            <label className="form-label" htmlFor="tok-page-name">Identificação do Token *</label>
            <input id="tok-page-name" className="form-input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="tok-page-scope">Escopo *</label>
            <select
              id="tok-page-scope"
              className="form-select"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'global' | 'company')}
            >
              <option value="company">Tenant / Empresa Específica</option>
              <option value="global">Global Plataforma</option>
            </select>
          </div>
          {scope === 'company' && (
            <div className="form-group">
              <label className="form-label" htmlFor="tok-page-comp">Empresa Vinculada *</label>
              <select
                id="tok-page-comp"
                className="form-select"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.tradeName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label" htmlFor="tok-page-exp">Data de Expiração *</label>
            <input
              id="tok-page-exp"
              type="date"
              className="form-input"
              required
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
        </div>
        <div className="card-footer">
          <Link to="/app/global/api-hub/tokens" className="btn btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn btn-primary">{t('common.save')}</button>
        </div>
      </form>
    </div>
  );
};

