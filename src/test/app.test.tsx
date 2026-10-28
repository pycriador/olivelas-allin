import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { ensureSeeded, resetToInitialSeed } from '../storage/indexedDb';
import { queryAndPaginate, repositories } from '../repositories/repositories';
import {
  buildEffectivePermissionMatrix,
  canAccessCompany,
  evaluateEffectivePermission,
  isModuleActiveForCompany,
  validateNoPrivilegeEscalation,
} from '../services/hbacService';
import {
  executeSimulatedHttpCall,
  interpolateVariables,
  validateSafeSandboxUrl,
} from '../services/operationalUtils';
import { formatCurrency, translations } from '../i18n/translations';
import {
  INITIAL_API_TOKENS,
  INITIAL_OPERATIONAL_ITEMS,
  INITIAL_PAYMENT_METHODS,
  INITIAL_ROLES,
  INITIAL_USERS,
} from '../seed/initialData';
import {
  ALL_THEME_PRESETS,
  applyThemePresetToDom,
  DARK_THEMES,
  findThemePreset,
  LIGHT_THEMES,
} from '../styles/themes';

const testActor = {
  userId: 'usr-super-admin',
  userName: 'Helena Vasconcelos',
  userRole: 'Super Admin',
};

describe('Olivelas Allin — Fundação Mock V1 Architecture & Governance Suite', () => {
  beforeEach(async () => {
    await resetToInitialSeed();
  });

  it('1. Seeding & IndexedDB Repositories: populates 6 roles, 4 companies, 7 users, 10 modules and persists CRUD + logical archiving without physical deletion', async () => {
    await ensureSeeded();

    const roles = await repositories.roles.listAll();
    const companies = await repositories.companies.listAll();
    const users = await repositories.users.listAll();
    const modules = await repositories.modules.listAll();

    expect(roles.length).toBeGreaterThanOrEqual(6);
    expect(companies.length).toBe(4);
    expect(users.length).toBe(7);
    expect(modules.length).toBe(10);

    // Create a new company via repository
    const created = await repositories.companies.create(
      {
        id: 'emp-teste-integrado',
        legalName: 'Padaria Artesanal São Bento Ltda.',
        tradeName: 'Padaria São Bento',
        taxId: '45.123.789/0001-99',
        country: 'BR',
        defaultLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        contacts: [{ name: 'João Bento', role: 'Sócio', email: 'joao@saobento.com.br', phone: '+55 11 99999-0000' }],
        address: {
          street: 'Rua São Bento',
          number: '100',
          district: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          postalCode: '01011-100',
          country: 'BR',
        },
        registrationStatus: 'active',
        operationalStatus: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      },
      testActor,
      'Empresa criada no teste automatizado',
    );

    expect(created.id).toBe('emp-teste-integrado');

    // Logical Archive (No physical deletion!)
    const archived = await repositories.companies.archive(
      'emp-teste-integrado',
      'Encerramento temporário de contrato para validação',
      testActor,
    );
    expect(archived?.archiveMetadata.isArchived).toBe(true);
    expect(archived?.archiveMetadata.archiveReason).toContain('Encerramento temporário');

    // Verify record still physically exists in IndexedDB
    const stillInDb = await repositories.companies.getById('emp-teste-integrado');
    expect(stillInDb).toBeDefined();
    expect(stillInDb?.archiveMetadata.isArchived).toBe(true);

    // Restore archived record
    const restored = await repositories.companies.restore('emp-teste-integrado', testActor);
    expect(restored?.archiveMetadata.isArchived).toBe(false);

    // Verify Audit Events were automatically recorded
    const audits = await repositories.audit.listAll();
    const relatedAudits = audits.filter((a) => a.entityId === 'emp-teste-integrado');
    expect(relatedAudits.length).toBeGreaterThanOrEqual(3); // create, archive, restore
  });

  it('2. HBAC Engine: evaluates direct roles, hierarchy, individual overrides, and prevents privilege escalation', () => {
    const superAdmin = INITIAL_USERS.find((u) => u.id === 'usr-super-admin')!;
    const financeiro = INITIAL_USERS.find((u) => u.id === 'usr-financeiro')!;
    const cliente = INITIAL_USERS.find((u) => u.id === 'usr-cliente')!;
    const gerente = INITIAL_USERS.find((u) => u.id === 'usr-gerente')!;

    // Super Admin has global administer access
    const saEval = evaluateEffectivePermission(superAdmin, INITIAL_ROLES, 'api_hub', 'administer');
    expect(saEval.allowed).toBe(true);

    // Financeiro Global can view/approve finance, but cannot administer roles or api_hub
    const finFinance = evaluateEffectivePermission(financeiro, INITIAL_ROLES, 'finance', 'approve');
    const finRoles = evaluateEffectivePermission(financeiro, INITIAL_ROLES, 'roles', 'edit');
    expect(finFinance.allowed).toBe(true);
    expect(finRoles.allowed).toBe(false);

    // Gerente has individual allow override on contracts:view in emp-olivelas-matriz
    const gerenteContracts = evaluateEffectivePermission(
      gerente,
      INITIAL_ROLES,
      'contracts',
      'view',
      'emp-olivelas-matriz',
    );
    expect(gerenteContracts.allowed).toBe(true);
    expect(gerenteContracts.originType).toBe('individual_allow');

    // Effective Matrix generation returns all 15 resources x 7 actions = 105 cells
    const matrix = buildEffectivePermissionMatrix(cliente, INITIAL_ROLES, 'emp-olivelas-matriz');
    expect(matrix.length).toBe(105);

    // Privilege Escalation Prevention: Cliente cannot grant Super Admin role or global scope
    const escalationGlobalScope = validateNoPrivilegeEscalation({
      actor: cliente,
      allRoles: INITIAL_ROLES,
      targetScope: 'global',
      targetCompanyId: 'emp-olivelas-matriz',
    });
    expect(escalationGlobalScope.valid).toBe(false);

    const escalationHigherRole = validateNoPrivilegeEscalation({
      actor: cliente,
      allRoles: INITIAL_ROLES,
      targetScope: 'company',
      targetCompanyId: 'emp-olivelas-matriz',
      requestedRoleIds: ['role-super-admin'],
    });
    expect(escalationHigherRole.valid).toBe(false);

    // Cliente can delegate Gerente or Funcionario role within their own company
    const validDelegation = validateNoPrivilegeEscalation({
      actor: cliente,
      allRoles: INITIAL_ROLES,
      targetScope: 'company',
      targetCompanyId: 'emp-olivelas-matriz',
      requestedRoleIds: ['role-funcionario'],
    });
    expect(validDelegation.valid).toBe(true);
  });

  it('3. Multi-Company Isolation & Contracted Modules: blocks cross-tenant access and checks active module subscriptions', async () => {
    const clienteOlivelas = INITIAL_USERS.find((u) => u.id === 'usr-cliente')!;
    const gerenteOlivelas = INITIAL_USERS.find((u) => u.id === 'usr-gerente')!;
    const adminOperacional = INITIAL_USERS.find((u) => u.id === 'usr-admin')!;

    // Cliente of Olivelas Matriz & Vega Retail can access both, but CANNOT access Aurora Log (emp-aurora-log)
    expect(canAccessCompany(clienteOlivelas, 'emp-olivelas-matriz', INITIAL_ROLES)).toBe(true);
    expect(canAccessCompany(clienteOlivelas, 'emp-vega-retail', INITIAL_ROLES)).toBe(true);
    expect(canAccessCompany(clienteOlivelas, 'emp-aurora-log', INITIAL_ROLES)).toBe(false);

    // Gerente only belongs to emp-olivelas-matriz, not emp-vega-retail
    expect(canAccessCompany(gerenteOlivelas, 'emp-olivelas-matriz', INITIAL_ROLES)).toBe(true);
    expect(canAccessCompany(gerenteOlivelas, 'emp-vega-retail', INITIAL_ROLES)).toBe(false);

    // Global staff in explicit support impersonation can access target company
    expect(
      canAccessCompany(adminOperacional, 'emp-solaris-bio', INITIAL_ROLES, 'emp-solaris-bio'),
    ).toBe(true);

    // Module subscription verification
    const subs = await repositories.companyModules.listAll();
    expect(isModuleActiveForCompany('emp-olivelas-matriz', 'allin_estoque', subs)).toBe(true);
    expect(isModuleActiveForCompany('emp-aurora-log', 'allin_crm', subs)).toBe(false);
  });

  it('4. Real Pagination, Search & Archive Filtering: paginates local datasets accurately', async () => {
    const modules = await repositories.modules.listAll();
    const page1 = queryAndPaginate(modules, {
      search: '',
      status: 'all',
      includeArchived: 'false',
      page: 1,
      pageSize: 4,
      sort: 'priceMonthly',
      order: 'asc',
    });

    expect(page1.total).toBe(10);
    expect(page1.totalPages).toBe(3);
    expect(page1.items.length).toBe(4);
    expect(page1.items[0].priceMonthly).toBeLessThanOrEqual(page1.items[1].priceMonthly);

    const searched = queryAndPaginate(
      modules,
      {
        search: 'Estoque',
        status: 'all',
        includeArchived: 'false',
        page: 1,
        pageSize: 10,
        sort: 'code',
        order: 'asc',
      },
      undefined,
      (m) => `${m.name['pt-BR']} ${m.code}`,
    );
    expect(searched.total).toBe(1);
    expect(searched.items[0].code).toBe('allin_estoque');
  });

  it('5. API Hub Security & Variable Interpolation: blocks SSRF targets and interpolates environment variables', async () => {
    expect(validateSafeSandboxUrl('https://sandbox.api.olivelasallin.com.br/v1/orders').safe).toBe(
      true,
    );
    expect(validateSafeSandboxUrl('http://127.0.0.1:8080/admin').safe).toBe(false);
    expect(validateSafeSandboxUrl('http://169.254.169.254/latest/meta-data').safe).toBe(false);
    expect(validateSafeSandboxUrl('javascript:alert(1)').safe).toBe(false);

    const envs = await repositories.apiEnvironments.listAll();
    const services = await repositories.apiServices.listAll();
    const tokens = await repositories.apiTokens.listAll();

    const interpolated = interpolateVariables('{{BASE_URL}}/tenants/{{TENANT_ID}}/ping', envs[0]);
    expect(interpolated).toContain('https://');
    expect(interpolated).not.toContain('{{BASE_URL}}');

    const simResult = executeSimulatedHttpCall({
      service: services[0],
      environment: envs[0],
      token: tokens.find((t) => t.status === 'active'),
      actorUserId: 'usr-super-admin',
      actorUserName: 'Helena Vasconcelos',
    });

    expect(simResult.ok).toBe(true);
    expect(simResult.historyEntry?.isSimulated).toBe(true);
    expect([200, 201]).toContain(simResult.historyEntry?.responseStatus);
  });

  it('6. Internationalization (PT-BR, EN, ES): provides complete translations and locale currency formatting', () => {
    expect(translations['pt-BR']['app.name']).toBe('Olivelas Allin');
    expect(translations.en['app.name']).toBe('Olivelas Allin');
    expect(translations.es['app.name']).toBe('Olivelas Allin');

    const brl = formatCurrency(1250.5, 'BRL', 'pt-BR');
    const usd = formatCurrency(1250.5, 'USD', 'en');
    expect(brl).toContain('1.250,50');
    expect(usd).toContain('1,250.50');
  });

  it('7. Theme Engine: provides exactly 15 Light Themes and 15 Dark Themes (30 total) and applies CSS custom properties cleanly', () => {
    expect(LIGHT_THEMES.length).toBe(15);
    expect(DARK_THEMES.length).toBe(15);
    expect(ALL_THEME_PRESETS.length).toBe(30);

    for (const light of LIGHT_THEMES) {
      expect(light.category).toBe('light');
      expect(light.tokens.bgCanvas).toMatch(/^#/);
      expect(light.tokens.accentPrimary).toMatch(/^#/);
    }

    for (const dark of DARK_THEMES) {
      expect(dark.category).toBe('dark');
      expect(dark.tokens.bgCanvas).toMatch(/^#/);
      expect(dark.tokens.accentPrimary).toMatch(/^#/);
    }

    // Apply a light theme and a dark theme to DOM
    const sampleLight = LIGHT_THEMES[4];
    applyThemePresetToDom(sampleLight.id);
    expect(document.documentElement.getAttribute('data-theme')).toBe(sampleLight.id);
    expect(findThemePreset(sampleLight.id)?.category).toBe('light');

    const sampleDark = DARK_THEMES[7];
    applyThemePresetToDom(sampleDark.id);
    expect(document.documentElement.getAttribute('data-theme')).toBe(sampleDark.id);
    expect(findThemePreset(sampleDark.id)?.category).toBe('dark');
  });

  it('8. Security & Password Governance: zero passwords on user records, masked credentials on payment methods & API tokens, and strict SSRF prevention', () => {
    // 1. Users must NEVER contain password, senha, hash, or pin fields
    for (const user of INITIAL_USERS) {
      const rawJson = JSON.stringify(user).toLowerCase();
      expect(rawJson).not.toContain('"password"');
      expect(rawJson).not.toContain('"senha"');
      expect(rawJson).not.toContain('"passwordhash"');
      expect(rawJson).not.toContain('"secret"');
    }

    // 2. Payment methods must only store masked credential previews (with * or •) and never full PAN (16 digits)
    for (const pm of INITIAL_PAYMENT_METHODS) {
      expect(pm.environment).toBe('sandbox_mock');
      expect(pm.maskedCredentialPreview).toMatch(/[\*•]/);
      expect(pm.maskedCredentialPreview).not.toMatch(/\b\d{13,19}\b/);
    }

    // 3. API tokens must only store masked previews and never raw secrets
    for (const tok of INITIAL_API_TOKENS) {
      expect(tok.maskedPreview).toMatch(/[\*•]/);
      const rawJson = JSON.stringify(tok);
      expect(rawJson).not.toMatch(/sk_live_[a-zA-Z0-9]{16,}/);
      expect(rawJson).not.toMatch(/ghp_[a-zA-Z0-9]{16,}/);
    }

    // 4. SSRF protection blocks private networks and file/javascript schemes
    expect(validateSafeSandboxUrl('http://localhost:3000/secret').safe).toBe(false);
    expect(validateSafeSandboxUrl('http://10.0.0.1/internal').safe).toBe(false);
    expect(validateSafeSandboxUrl('http://192.168.1.1/router').safe).toBe(false);
    expect(validateSafeSandboxUrl('http://172.16.0.5/cluster').safe).toBe(false);
    expect(validateSafeSandboxUrl('file:///etc/passwd').safe).toBe(false);
  });

  it('9. Operational Modules Persistence: persists Inventory, Sales Orders, and CRM Leads in IndexedDB with logical archiving', async () => {
    await ensureSeeded();
    const initialOps = await repositories.operationalItems.listAll();
    expect(initialOps.length).toBe(INITIAL_OPERATIONAL_ITEMS.length);

    const newItem = await repositories.operationalItems.create(
      {
        id: 'op-test-crm-lead',
        companyId: 'emp-olivelas-matriz',
        moduleType: 'crm',
        code: 'CRM-900',
        title: 'Grupo Comercial Atlântico S.A.',
        category: 'Negociação Contratual',
        quantity: 1,
        amount: 48000,
        currency: 'BRL',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        archiveMetadata: { isArchived: false },
        changeHistory: [],
      },
      testActor,
      'Criação de lead em teste automatizado',
    );
    expect(newItem.code).toBe('CRM-900');

    const archived = await repositories.operationalItems.archive(
      'op-test-crm-lead',
      'Lead postergado para Q1',
      testActor,
    );
    expect(archived?.archiveMetadata.isArchived).toBe(true);

    const restored = await repositories.operationalItems.restore('op-test-crm-lead', testActor);
    expect(restored?.archiveMetadata.isArchived).toBe(false);
  });
});
