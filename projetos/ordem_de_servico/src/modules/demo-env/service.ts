import { getStorage } from "@/core/providers/storage";
import { eventBus } from "@/modules/events/service";
import type { AuditLog } from "@/modules/admin/types";
import {
  DEMO_ENV_COLLECTION, DEMO_SCENARIO_COLLECTION, DEMO_LOG_COLLECTION,
  DEMO_HISTORY_COLLECTION, DEMO_SEED_COLLECTION, DEMO_DIAGNOSIS_COLLECTION,
  DEMO_INTEGRITY_COLLECTION, SCENARIOS, DEFAULT_CUSTOM_CONFIG,
  type DemoEnvironmentConfig, type DemoEnvLog, type DemoEnvHistory,
  type DemoSeedEntry, type DiagnosisResult, type IntegrityCheck,
  type DashboardStats, type CustomGeneratorConfig, type ScenarioType,
  type ExportPayload,
} from "./types";

const COLLECTIONS_OPERATIONAL = [
  "customers", "customer_devices", "technicians",
  "service_orders", "so_returns", "so_warranties", "so_payments",
  "so_documents", "so_events", "so_timeline", "so_comments",
  "so_attachments", "so_photos", "so_signatures",
  "so_approvals", "so_receipts", "so_delivery",
  "so_financial_history", "so_budgets", "so_execution_activities",
  "reports", "report_exports", "report_kpis",
  "report_dashboards", "report_charts",
  "events", "evt_store", "evt_subscribers",
  "audit_logs", "system_logs",
  "integration_logs", "sync_runs",
  "workflow_executions", "workflow_runs",
];

const COLLECTIONS_PRESERVE = [
  "configuration", "admin_users", "admin_roles", "admin_groups",
  "admin_permissions", "admin_policies", "admin_feature_flags",
  "admin_themes", "admin_languages", "admin_providers",
  "admin_data_sources", "admin_connectors",
  "admin_env_config", "admin_secrets",
  "admin_global_config",
  "metadata_entities", "metadata_fields", "metadata_forms",
  "metadata_views", "metadata_dashboards",
  "metadata_config", "metadata_templates", "metadata_versions",
  "workflows", "workflow_templates",
  "evt_workflows", "evt_event_names",
  "doc_templates", "doc_designer_templates",
  "comm_templates",
  "ai_providers", "ai_prompts",
  "int_connectors", "int_templates",
  "brands", "categories", "defects", "manufacturers",
  "measurement_units", "models", "parts", "services", "suppliers",
  "payment_methods", "payment_terms",
  "automation_workflows", "automation_rules",
  "automation_state_machines", "automation_sla",
  "automation_timers", "automation_variables",
  "portal_config", "portal_branding",
  "demo_env_config", "demo_env_scenarios", "demo_env_logs",
  "demo_env_history", "demo_env_seeds",
  "demo_env_diagnosis", "demo_env_integrity",
];

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

async function getConfig(): Promise<DemoEnvironmentConfig> {
  const existing = await getStorage().findAll<DemoEnvironmentConfig>(DEMO_ENV_COLLECTION);
  if (existing.length > 0) return existing[0];
  const cfg: DemoEnvironmentConfig = {
    id: uid(), lastRestore: null, lastClean: null,
    lastImport: null, lastExport: null, lastGeneration: null,
    currentScenario: null, status: "clean",
  };
  return getStorage().create(DEMO_ENV_COLLECTION, cfg);
}

async function updateConfig(patch: Partial<DemoEnvironmentConfig>): Promise<DemoEnvironmentConfig> {
  const cfg = await getConfig();
  return getStorage().update(DEMO_ENV_COLLECTION, cfg.id, patch);
}

async function getOperationalCounts(): Promise<DashboardStats> {
  const [companies, users, customers, devices, technicians, orders,
    returns, warranties, payments, documents, events, workflows,
    audits, integrations, reports, dashboards,
    lastGen, lastClean, lastImport, lastExport] = await Promise.all([
    getStorage().count("companies"),
    getStorage().count("admin_users"),
    getStorage().count("customers"),
    getStorage().count("customer_devices"),
    getStorage().count("technicians"),
    getStorage().count("service_orders"),
    getStorage().count("so_returns"),
    getStorage().count("so_warranties"),
    getStorage().count("so_payments"),
    getStorage().count("so_documents"),
    getStorage().count("events"),
    getStorage().count("workflows"),
    getStorage().count("audit_logs"),
    getStorage().count("int_connectors"),
    getStorage().count("reports"),
    getStorage().count("report_dashboards"),
    getStorage().count("demo_last_gen"),
    getStorage().count("demo_last_clean"),
    getStorage().count("demo_last_import"),
    getStorage().count("demo_last_export"),
  ]);
  void lastGen; void lastClean; void lastImport; void lastExport;
  const cfg = await getConfig();
  return {
    companies, users, customers, devices, technicians, serviceOrders: orders,
    returns, warranties, payments, documents, events, workflows,
    audits, integrations, reports, dashboards,
    lastGeneration: cfg.lastGeneration,
    lastClean: cfg.lastClean,
    lastImport: cfg.lastImport,
    lastExport: cfg.lastExport,
  };
}

function brFlag(): string[] {
  const cidades = [
    "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Fortaleza",
    "Brasília", "Curitiba", "Manaus", "Recife", "Porto Alegre",
    "Belém", "Goiânia", "Guarulhos", "Campinas", "São Luís",
  ];
  const estados = ["SP", "RJ", "MG", "BA", "CE", "DF", "PR", "AM", "PE", "RS", "PA", "GO", "SP", "SP", "MA"];
  const ruas = [
    "Rua Augusta", "Avenida Paulista", "Rua da Consolação", "Avenida Atlântica",
    "Rua Oscar Freire", "Avenida Brasil", "Rua 25 de Março", "Rua da Paz",
    "Avenida São João", "Rua XV de Novembro", "Rua das Flores", "Avenida Rio Branco",
    "Rua Direita", "Praça da Sé", "Rua do Ouvidor",
  ];
  const bairros = [
    "Centro", "Copacabana", "Savassi", "Boa Viagem", "Aldeota",
    "Asa Sul", "Batel", "Adrianópolis", "Boa Vista", "Moinhos de Vento",
    "Umarizal", "Setor Oeste", "Vila Mariana", "Pinheiros", "Barra da Tijuca",
  ];
  const cep = `${Math.floor(10000 + Math.random() * 89999)}-${Math.floor(100 + Math.random() * 899)}`;
  const idx = Math.floor(Math.random() * cidades.length);
  return [cidades[idx], estados[idx], ruas[Math.floor(Math.random() * ruas.length)], bairros[Math.floor(Math.random() * bairros.length)], cep];
}

function brName(gender?: "m" | "f"): string {
  const nomesM = [
    "João", "Pedro", "Lucas", "Gabriel", "Rafael", "Felipe", "Mateus", "Daniel",
    "Thiago", "Eduardo", "Bruno", "Rodrigo", "Marcelo", "Paulo", "Carlos",
    "André", "Alexandre", "Leonardo", "Diego", "Vinícius", "Guilherme", "Gustavo",
    "Fábio", "Ricardo", "Fernando", "Roberto", "José", "Antônio", "Francisco", "Luís",
  ];
  const nomesF = [
    "Maria", "Ana", "Juliana", "Carla", "Patrícia", "Fernanda", "Amanda", "Camila",
    "Beatriz", "Larissa", "Natália", "Isabela", "Letícia", "Mariana", "Gabriela",
    "Vitória", "Bianca", "Carolina", "Daniela", "Rafaela", "Luciana", "Renata",
    "Vanessa", "Tatiane", "Aline", "Cristiane", "Priscila", "Andressa", "Michele", "Simone",
  ];
  const sobrenomes = [
    "Silva", "Santos", "Oliveira", "Souza", "Lima", "Pereira", "Costa", "Ferreira",
    "Rodrigues", "Almeida", "Nascimento", "Araújo", "Ribeiro", "Carvalho", "Gomes",
    "Martins", "Barbosa", "Rocha", "Dias", "Moreira", "Nunes", "Alves", "Mendes",
    "Cardoso", "Teixeira", "Cavalcanti", "Pinto", "Correia", "Cunha", "Campos",
  ];
  const nome = (gender === "f" ? nomesF : nomesM)[Math.floor(Math.random() * 30)];
  const sn1 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  const sn2 = sobrenomes[Math.floor(Math.random() * sobrenomes.length)];
  return `${nome} ${sn1} ${sn2}`;
}

function brCompanyName(): string {
  const prefixes = [
    "Tech", "Info", "Mega", "Total", "Ultra", "Super", "Plus", "Digital",
    "Global", "Nacional", "Premium", "Master", "Prime", "Top", "New",
  ];
  const suffixes = [
    "Assistência Técnica", "Serviços", "Soluções", "Tecnologia", "Informática",
    "Eletrônicos", "Manutenção", "Suporte", "Reparos", "Sistemas",
    "Consultoria", "Engenharia", "Comércio", "Distribuidora", "Representações",
  ];
  const cities = ["São Paulo", "Rio", "Brasil", "Nacional", "Digital", "Tech", "Solutions", "Master"];
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  const c = cities[Math.floor(Math.random() * cities.length)];
  return `${p} ${s} ${c} Ltda`;
}

function brPhone(): string {
  const ddd = String(11 + Math.floor(Math.random() * 19));
  const p1 = String(9_0000 + Math.floor(Math.random() * 9999));
  const p2 = String(1000 + Math.floor(Math.random() * 8999));
  return `(${ddd}) ${p1}-${p2}`;
}

function brCpf(): string {
  const d1 = String(100 + Math.floor(Math.random() * 899));
  const d2 = String(100 + Math.floor(Math.random() * 899));
  const d3 = String(100 + Math.floor(Math.random() * 899));
  const d4 = String(10 + Math.floor(Math.random() * 89));
  return `${d1}.${d2}.${d3}-${d4}`;
}

function brCnpj(): string {
  const p1 = String(10 + Math.floor(Math.random() * 89));
  const p2 = String(100 + Math.floor(Math.random() * 899));
  const p3 = String(100 + Math.floor(Math.random() * 899));
  const p4 = String(100 + Math.floor(Math.random() * 899));
  const p5 = String(100 + Math.floor(Math.random() * 899));
  return `${p1}.${p2}.${p3}/${p4}${p5}-${String(10 + Math.floor(Math.random() * 89))}`;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export const demoEnvService = {
  getConfig,
  updateConfig,
  getOperationalCounts,
  getStats: getOperationalCounts,

  async restoreEnvironment(): Promise<DemoEnvHistory> {
    const start = Date.now();
    await updateConfig({ status: "generating" });
    try {
      for (const col of COLLECTIONS_OPERATIONAL) {
        const all = await getStorage().findAll(col);
        for (const item of all) {
          await getStorage().delete(col, item.id);
        }
      }
      await this.runScenario("small");
      const cfg = await getConfig();
      await updateConfig({ lastRestore: now(), status: "clean" });
      const elapsed = Date.now() - start;
      const history = await this.addHistory({
        action: "restore", scenarioType: "small", status: "completed",
        totalRecords: 0, duration: elapsed,
        details: "Ambiente restaurado com cenário Pequena Assistência",
      });
      await eventBus.publish("demo-env.restored", "system", "demo-env", {
        action: "restore", duration: elapsed, status: "completed",
      }).catch(() => {});
      return history;
    } catch (e) {
      await updateConfig({ status: "clean" });
      const elapsed = Date.now() - start;
      const history = await this.addHistory({
        action: "restore", status: "failed",
        totalRecords: 0, duration: elapsed,
        details: `Falha na restauração: ${e instanceof Error ? e.message : String(e)}`,
      });
      await eventBus.publish("demo-env.restored", "system", "demo-env", {
        action: "restore", status: "failed", error: String(e),
      }).catch(() => {});
      return history;
    }
  },

  async cleanOperationalData(): Promise<DemoEnvHistory> {
    const start = Date.now();
    let total = 0;
    try {
      for (const col of COLLECTIONS_OPERATIONAL) {
        const all = await getStorage().findAll(col);
        for (const item of all) {
          await getStorage().delete(col, item.id);
          total++;
        }
      }
      await updateConfig({ lastClean: now(), status: "clean", currentScenario: null });
      const elapsed = Date.now() - start;
      const history = await this.addHistory({
        action: "clean", status: "completed",
        totalRecords: total, duration: elapsed,
        details: `Limpeza concluída: ${total} registros removidos`,
      });
      await eventBus.publish("demo-env.cleaned", "system", "demo-env", {
        action: "clean", recordsRemoved: total, duration: elapsed,
      }).catch(() => {});
      return history;
    } catch (e) {
      const elapsed = Date.now() - start;
      return this.addHistory({
        action: "clean", status: "failed",
        totalRecords: total, duration: elapsed,
        details: `Falha na limpeza: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },

  async runScenario(type: ScenarioType): Promise<DemoEnvHistory> {
    const start = Date.now();
    const scenario = SCENARIOS.find((s) => s.type === type);
    if (!scenario) throw new Error(`Cenário ${type} não encontrado`);
    await updateConfig({ status: "generating" });
    try {
      const { companies, users, customers: nCustomers, devices: nDevices,
        technicians: nTechs, serviceOrders: nOrders } = scenario;
      const companyIds: string[] = [];
      const userIds: string[] = [];
      for (let c = 0; c < companies; c++) {
        const co = await getStorage().create<Record<string, unknown> & { id: string }>("companies", {
          legalName: brCompanyName(), tradeName: brCompanyName(),
          cnpj: brCnpj(), phone: brPhone(), email: `contato@empresa${c}.com.br`,
          address: "Rua Principal", number: String(100 + c), city: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador"]),
          state: pick(["SP", "RJ", "MG", "PR", "BA"]), status: "active",
          createdAt: now(), updatedAt: now(),
        });
        companyIds.push(co.id);
      }
      for (let u = 0; u < users; u++) {
        const us = await getStorage().create<Record<string, unknown> & { id: string }>("admin_users", {
          photoUrl: "", name: brName(), email: `usuario${u}@demo.com.br`,
          phone: brPhone(), cpf: brCpf(), position: pick(["Técnico", "Atendente", "Gerente", "Administrador", "Secretário"]),
          status: "active", language: "pt-BR", theme: "system",
          primaryCompanyId: pick(companyIds), linkedCompanyIds: [],
          roleIds: [], specialPermissions: [],
          lastAccess: now(), createdAt: now(), updatedAt: now(),
        });
        userIds.push(us.id);
      }
      for (let t = 0; t < nTechs; t++) {
        await getStorage().create<Record<string, unknown> & { id: string }>("technicians", {
          name: brName(), email: `tecnico${t}@demo.com.br`, phone: brPhone(),
          specialty: pick(["Eletrônicos", "Informática", "Celulares", "Áudio e Vídeo", "Eletrodomésticos", "Ar Condicionado"]),
          status: "active", companyId: pick(companyIds), userId: pick(userIds),
          createdAt: now(), updatedAt: now(),
        });
      }
      for (let cu = 0; cu < nCustomers; cu++) {
        await getStorage().create<Record<string, unknown> & { id: string }>("customers", {
          name: brName(), email: `cliente${cu}@email.com.br`, phone: brPhone(),
          cpf: brCpf(), address: `${pick(["Rua", "Avenida"])} ${brName().split(" ")[0]}, ${100 + cu}`,
          city: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador", "Porto Alegre", "Fortaleza", "Recife", "Brasília", "Manaus"]),
          state: pick(["SP", "RJ", "MG", "PR", "RS", "BA", "CE", "PE", "DF", "AM"]),
          status: "active", createdAt: now(), updatedAt: now(),
        });
      }
      for (let d = 0; d < nDevices; d++) {
        const modelos = ["iPhone 14", "Galaxy S24", "Xiaomi 13T", "Motorola Edge 40", "LG TV 55", "Notebook Dell", "iPad Air", "PS5", "Air Fryer", "Geladeira Brastemp"];
        await getStorage().create<Record<string, unknown> & { id: string }>("customer_devices", {
          model: pick(modelos), serialNumber: `SN-${uid().slice(0, 8).toUpperCase()}`,
          category: pick(["Smartphone", "Tablet", "Notebook", "TV", "Eletrodoméstico", "Console", "Áudio"]),
          customerId: "", companyId: pick(companyIds),
          createdAt: now(), updatedAt: now(),
        });
      }
      for (let o = 0; o < nOrders; o++) {
        const statuses = ["open", "diagnosis", "awaiting_approval", "awaiting_parts", "execution", "ready", "delivered", "cancelled"];
        const defects = [
          "Tela trincada", "Não liga", "Bateria viciada", "Conector USB danificado",
          "Som distorcido", "Superaquecimento", "Queda de conexão", "Teclas sem resposta",
          "Vazamento de água", "Porta não fecha", "Motor não funciona", "Display queimado",
        ];
        await getStorage().create<Record<string, unknown> & { id: string }>("service_orders", {
          number: `OS-${String(10000 + o).slice(0, 6)}`,
          customerId: "", deviceId: "", technicianId: "",
          companyId: pick(companyIds), category: pick(["Eletrônicos", "Informática", "Eletrodomésticos"]),
          defect: pick(defects), description: `Cliente relata: ${pick(defects)}`,
          status: pick(statuses), priority: pick(["low", "medium", "high", "urgent"]),
          entryDate: now(), deadline: now(), estimatedValue: Math.floor(50 + Math.random() * 950),
          createdAt: now(), updatedAt: now(),
        });
      }
      await updateConfig({ lastGeneration: now(), currentScenario: type, status: "populated" });
      const elapsed = Date.now() - start;
      const history = await this.addHistory({
        action: "scenario", scenarioType: type, status: "completed",
        totalRecords: companies + users + nTechs + nCustomers + nDevices + nOrders,
        duration: elapsed,
        details: `Cenário "${scenario.label}" gerado com sucesso`,
      });
      await eventBus.publish("demo-env.generated", "system", "demo-env", {
        action: "scenario", type, duration: elapsed, status: "completed",
      }).catch(() => {});
      return history;
    } catch (e) {
      await updateConfig({ status: "clean" });
      const elapsed = Date.now() - start;
      return this.addHistory({
        action: "scenario", scenarioType: type, status: "failed",
        totalRecords: 0, duration: elapsed,
        details: `Falha ao gerar cenário: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },

  async generateCustom(config: CustomGeneratorConfig): Promise<DemoEnvHistory> {
    const start = Date.now();
    await updateConfig({ status: "generating" });
    try {
      const companyIds: string[] = [];
      const userIds: string[] = [];
      const { companies, users, customers, devices, technicians, serviceOrders,
        payments, warranties, returns } = config;
      for (let c = 0; c < companies; c++) {
        const co = await getStorage().create<Record<string, unknown> & { id: string }>("companies", {
          legalName: brCompanyName(), tradeName: brCompanyName(),
          cnpj: brCnpj(), phone: brPhone(), email: `empresa${c}@demo.com.br`,
          address: "Avenida Principal", number: String(1000 + c),
          city: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador"]),
          state: pick(["SP", "RJ", "MG", "PR", "BA"]), status: "active",
          createdAt: now(), updatedAt: now(),
        });
        companyIds.push(co.id);
      }
      for (let u = 0; u < users; u++) {
        const us = await getStorage().create<Record<string, unknown> & { id: string }>("admin_users", {
          photoUrl: "", name: brName(), email: `user${u}@demo.com.br`,
          phone: brPhone(), cpf: brCpf(), position: pick(["Técnico", "Analista", "Gerente", "Supervisor", "Atendente"]),
          status: "active", language: "pt-BR", theme: "system",
          primaryCompanyId: pick(companyIds), linkedCompanyIds: [],
          roleIds: [], specialPermissions: [],
          lastAccess: now(), createdAt: now(), updatedAt: now(),
        });
        userIds.push(us.id);
      }
      for (let t = 0; t < technicians; t++) {
        await getStorage().create<Record<string, unknown> & { id: string }>("technicians", {
          name: brName(), email: `tecnico${t}@demo.com.br`, phone: brPhone(),
          specialty: pick(["Celulares", "Notebooks", "TVs", "Eletrodomésticos", "Áudio", "Redes"]),
          status: "active", companyId: pick(companyIds), userId: pick(userIds),
          createdAt: now(), updatedAt: now(),
        });
      }
      for (let cu = 0; cu < customers; cu++) {
        await getStorage().create<Record<string, unknown> & { id: string }>("customers", {
          name: brName(), email: `cliente${cu}@provedor.com.br`, phone: brPhone(),
          cpf: brCpf(), address: `Rua ${brName().split(" ")[1] || "das Flores"}, ${100 + cu}`,
          city: pick(["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Salvador", "Fortaleza", "Brasília", "Curitiba", "Porto Alegre"]),
          state: pick(["SP", "RJ", "MG", "BA", "CE", "DF", "PR", "RS"]),
          status: "active", createdAt: now(), updatedAt: now(),
        });
      }
      const modelos = [
        "iPhone 15", "Galaxy S24 Ultra", "Xiaomi 14", "Motorola Edge 50",
        "Notebook Dell Inspiron", "MacBook Air M3", "iPad Pro", "TV Samsung 65",
        "Geladeira Electrolux", "Micro-ondas Panasonic", "Lavadora Brastemp",
        "Air Fryer Philips", "PS5 Slim", "Alexa Echo", "Home Theater LG",
      ];
      for (let d = 0; d < devices; d++) {
        await getStorage().create<Record<string, unknown> & { id: string }>("customer_devices", {
          model: pick(modelos), serialNumber: `SN-${uid().slice(0, 10).toUpperCase()}`,
          category: pick(["Smartphone", "Notebook", "TV", "Eletrodoméstico", "Tablet", "Console", "Áudio", "Periférico"]),
          customerId: "", companyId: pick(companyIds),
          createdAt: now(), updatedAt: now(),
        });
      }
      for (let o = 0; o < serviceOrders; o++) {
        const defect = pick([
          "Tela quebrada", "Não liga", "Bateria não carrega", "Aquecimento excessivo",
          "Não conecta WiFi", "Som falhando", "Teclado não funciona", "Touchscreen sem resposta",
          "Vazamento", "Porta USB quebrada", "Travamentos constantes", "Superaquecimento",
        ]);
        await getStorage().create<Record<string, unknown> & { id: string }>("service_orders", {
          number: `OS-${String(20000 + o)}`,
          customerId: "", deviceId: "", technicianId: "",
          companyId: pick(companyIds), category: pick(["Eletrônicos", "Informática", "Eletrodomésticos", "Celulares"]),
          defect, description: `Defeito relatado: ${defect}`,
          status: pick(["open", "diagnosis", "execution", "ready", "delivered", "cancelled"]),
          priority: pick(["low", "medium", "high"]),
          entryDate: now(), deadline: now(), estimatedValue: 80 + Math.floor(Math.random() * 920),
          createdAt: now(), updatedAt: now(),
        });
      }
      const totalRecords = companies + users + technicians + customers + devices + serviceOrders;
      await updateConfig({ lastGeneration: now(), currentScenario: "custom", status: "populated" });
      const elapsed = Date.now() - start;
      const history = await this.addHistory({
        action: "generate", scenarioType: "custom", status: "completed",
        totalRecords, duration: elapsed,
        details: `Geração personalizada concluída: ${totalRecords} registros em ${(elapsed / 1000).toFixed(1)}s`,
      });
      await eventBus.publish("demo-env.generated", "system", "demo-env", {
        action: "generate", config, totalRecords, duration: elapsed,
      }).catch(() => {});
      return history;
    } catch (e) {
      await updateConfig({ status: "clean" });
      const elapsed = Date.now() - start;
      return this.addHistory({
        action: "generate", scenarioType: "custom", status: "failed",
        totalRecords: 0, duration: elapsed,
        details: `Falha na geração: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },

  async exportEnvironment(exportedBy: string): Promise<ExportPayload> {
    const collections = ["companies", "admin_users", "customers", "customer_devices",
      "technicians", "service_orders", "so_returns", "so_warranties", "so_payments",
      "so_documents", "events", "reports", "report_dashboards"];
    const data: Record<string, unknown[]> = {};
    let totalRecords = 0;
    for (const col of collections) {
      const items = await getStorage().findAll(col);
      data[col] = items;
      totalRecords += items.length;
    }
    await updateConfig({ lastExport: now() });
    await eventBus.publish("demo-env.exported", "system", "demo-env", {
      totalRecords, exportedBy,
    }).catch(() => {});
    return {
      companies: data.companies || [],
      users: data.admin_users || [],
      customers: data.customers || [],
      devices: data.customer_devices || [],
      serviceOrders: data.service_orders || [],
      returns: data.so_returns || [],
      warranties: data.so_warranties || [],
      payments: data.so_payments || [],
      documents: data.so_documents || [],
      events: data.events || [],
      reports: data.reports || [],
      dashboards: data.report_dashboards || [],
      metadata: {
        version: "1.0.0-RC1",
        exportedAt: now(),
        exportedBy,
        totalRecords,
      },
    };
  },

  async importEnvironment(payload: ExportPayload, importedBy: string): Promise<DemoEnvHistory> {
    const start = Date.now();
    const mappings: { key: keyof ExportPayload; collection: string }[] = [
      { key: "companies", collection: "companies" },
      { key: "users", collection: "admin_users" },
      { key: "customers", collection: "customers" },
      { key: "devices", collection: "customer_devices" },
      { key: "serviceOrders", collection: "service_orders" },
      { key: "returns", collection: "so_returns" },
      { key: "warranties", collection: "so_warranties" },
      { key: "payments", collection: "so_payments" },
      { key: "documents", collection: "so_documents" },
      { key: "events", collection: "events" },
      { key: "reports", collection: "reports" },
      { key: "dashboards", collection: "report_dashboards" },
    ];
    let imported = 0;
    try {
      for (const m of mappings) {
        const items = payload[m.key] as unknown[];
        for (const item of items) {
          await getStorage().create(m.collection, item as Record<string, unknown> & { id?: string });
          imported++;
        }
      }
      await updateConfig({ lastImport: now(), status: "populated", currentScenario: "custom" });
      const elapsed = Date.now() - start;
      const history = await this.addHistory({
        action: "import", status: "completed",
        totalRecords: imported, duration: elapsed,
        details: `Importação concluída: ${imported} registros em ${(elapsed / 1000).toFixed(1)}s`,
      });
      await eventBus.publish("demo-env.imported", "system", "demo-env", {
        action: "import", totalRecords: imported, duration: elapsed,
      }).catch(() => {});
      return history;
    } catch (e) {
      const elapsed = Date.now() - start;
      return this.addHistory({
        action: "import", status: "failed",
        totalRecords: imported, duration: elapsed,
        details: `Falha na importação: ${e instanceof Error ? e.message : String(e)}`,
      });
    }
  },

  async runDiagnosis(): Promise<DiagnosisResult[]> {
    const results: DiagnosisResult[] = [];
    const checks: { category: string; title: string; collection: string; refField?: string; refCollection?: string }[] = [
      { category: "service_orders", title: "Ordens sem cliente", collection: "service_orders" },
      { category: "service_orders", title: "Ordens sem equipamento", collection: "service_orders" },
      { category: "customers", title: "Clientes sem OS", collection: "customers" },
      { category: "devices", title: "Equipamentos sem OS", collection: "customer_devices" },
      { category: "returns", title: "Retornos sem OS vinculada", collection: "so_returns" },
      { category: "warranties", title: "Garantias expiradas", collection: "so_warranties" },
      { category: "payments", title: "Pagamentos órfãos", collection: "so_payments" },
    ];
    for (const check of checks) {
      try {
        const items = await getStorage().findAll(check.collection);
        results.push({
          id: uid(), category: check.category, status: items.length === 0 ? "warning" : "healthy",
          title: check.title, description: `${items.length} registros encontrados`,
          details: `Coleção: ${check.collection}, Total: ${items.length}`,
          affectedCount: items.length, timestamp: now(),
        });
      } catch {
        results.push({
          id: uid(), category: check.category, status: "error",
          title: check.title, description: "Erro ao verificar",
          details: `Não foi possível acessar ${check.collection}`,
          affectedCount: 0, timestamp: now(),
        });
      }
    }
    return results;
  },

  async checkIntegrity(): Promise<IntegrityCheck[]> {
    const checks: IntegrityCheck[] = [];
    const pairs: { name: string; from: string; to: string; label: string }[] = [
      { name: "clientes_empresas", from: "customers", to: "companies", label: "Clientes sem empresa" },
      { name: "tecnicos_empresas", from: "technicians", to: "companies", label: "Técnicos sem empresa" },
      { name: "os_clientes", from: "service_orders", to: "customers", label: "OS sem cliente" },
    ];
    for (const p of pairs) {
      try {
        const fromItems = await getStorage().findAll(p.from);
        checks.push({
          id: uid(), check: p.name, status: "passed",
          description: p.label, details: `${fromItems.length} registros verificados`,
          affectedEntities: [], timestamp: now(),
        });
      } catch {
        checks.push({
          id: uid(), check: p.name, status: "failed",
          description: p.label, details: "Erro na verificação de integridade",
          affectedEntities: [], timestamp: now(),
        });
      }
    }
    return checks;
  },

  async listSeeds(): Promise<DemoSeedEntry[]> {
    return getStorage().findAll<DemoSeedEntry>(DEMO_SEED_COLLECTION);
  },

  async getSeedLogs(): Promise<DemoSeedEntry[]> {
    return this.listSeeds();
  },

  async runSeed(seedName: string): Promise<DemoSeedEntry> {
    const entry: DemoSeedEntry = {
      id: uid(), name: seedName, collection: seedName,
      status: "running", recordsCount: 0, duration: 0,
      error: null, lastRun: now(), lastRunBy: "admin",
      createdAt: now(),
    };
    await getStorage().create(DEMO_SEED_COLLECTION, entry);
    const start = Date.now();
    try {
      const items = await getStorage().findAll(seedName);
      const count = items.length;
      const updated = await getStorage().update<DemoSeedEntry>(
        DEMO_SEED_COLLECTION, entry.id,
        { status: "completed", recordsCount: count, duration: Date.now() - start },
      );
      return updated;
    } catch (e) {
      return getStorage().update<DemoSeedEntry>(
        DEMO_SEED_COLLECTION, entry.id,
        { status: "failed", error: e instanceof Error ? e.message : String(e), duration: Date.now() - start },
      );
    }
  },

  async runAllSeeds(): Promise<DemoSeedEntry[]> {
    const seeds = ["companies", "admin_users", "customers", "customer_devices",
      "technicians", "service_orders", "so_returns", "so_warranties", "so_payments",
      "so_documents", "events"];
    const results: DemoSeedEntry[] = [];
    for (const seed of seeds) {
      const result = await this.runSeed(seed);
      results.push(result);
    }
    return results;
  },

  async addHistory(data: Partial<Omit<DemoEnvHistory, "id">>): Promise<DemoEnvHistory> {
    const entry = { id: uid(), createdBy: "system", timestamp: now(), ...data } as DemoEnvHistory;
    await getStorage().create(DEMO_HISTORY_COLLECTION, entry);
    return entry;
  },

  async listHistory(): Promise<DemoEnvHistory[]> {
    return getStorage().findAll<DemoEnvHistory>(DEMO_HISTORY_COLLECTION);
  },

  async addLog(data: Omit<DemoEnvLog, "id">): Promise<DemoEnvLog> {
    const entry: DemoEnvLog = { id: uid(), ...data };
    await getStorage().create(DEMO_LOG_COLLECTION, entry);
    return entry;
  },

  async listLogs(): Promise<DemoEnvLog[]> {
    return getStorage().findAll<DemoEnvLog>(DEMO_LOG_COLLECTION);
  },
};
