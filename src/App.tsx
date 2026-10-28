import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicLayout, WorkspaceLayout } from './components/layout/AppShell';
import {
  LandingPage,
  LoginPage,
  PlansPage,
  PrivacyPage,
  RecoverPasswordPage,
  TermsPage,
} from './pages/public/PublicPages';
import {
  CompanyDashboardPage,
  GlobalDashboardPage,
  ReportsAnalyticsPage,
} from './pages/shared/DashboardsAndReports';
import {
  CompaniesListPage,
  CompanyDetailHubPage,
  CompanyFormPage,
} from './pages/global/CompaniesModule';
import {
  RolesAndHbacPage,
  UserDetailAndMatrixPage,
  UserFormPage,
  UsersListPage,
} from './pages/shared/UsersAndHbacModule';
import {
  CompanyModulesSubscriptionPage,
  ContractDetailAndSignaturePage,
  ContractFormPage,
  ContractsListPage,
  GlobalModulesCatalogPage,
  ModuleDetailPage,
  ModuleFormPage,
} from './pages/shared/ModulesAndContractsModule';
import {
  FinanceHubPage,
  PaymentMethodDetailPage,
  PaymentMethodFormPage,
  PaymentMethodsPage,
} from './pages/shared/FinanceModule';
import {
  ApiHubCatalogPage,
  ApiServiceFormPage,
  ApiServiceInspectorAndRunnerPage,
} from './pages/global/ApiHubModule';
import {
  AuditEventDetailPage,
  AuditListPage,
  CompanyOperationModulePage,
  TicketDetailPage,
  TicketFormPage,
  TicketsListPage,
} from './pages/shared/TicketsAuditAndOperationsModule';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* 1. ÁREA PÚBLICA */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-senha" element={<RecoverPasswordPage />} />
        <Route path="/planos" element={<PlansPage />} />
        <Route path="/termos" element={<TermsPage />} />
        <Route path="/privacidade" element={<PrivacyPage />} />
      </Route>

      {/* 2. CONSOLE GLOBAL DA PLATAFORMA (/app/global) */}
      <Route path="/app/global" element={<WorkspaceLayout mode="global" />}>
        <Route index element={<GlobalDashboardPage />} />

        {/* 7. Gestão Multiempresa */}
        <Route path="empresas" element={<CompaniesListPage />} />
        <Route path="empresas/nova" element={<CompanyFormPage mode="create" />} />
        <Route path="empresas/:empresaId" element={<CompanyDetailHubPage tab="overview" />} />
        <Route path="empresas/:empresaId/editar" element={<CompanyFormPage mode="edit" />} />
        <Route path="empresas/:empresaId/usuarios" element={<CompanyDetailHubPage tab="usuarios" />} />
        <Route path="empresas/:empresaId/modulos" element={<CompanyDetailHubPage tab="modulos" />} />
        <Route path="empresas/:empresaId/contratos" element={<CompanyDetailHubPage tab="contratos" />} />
        <Route path="empresas/:empresaId/financeiro" element={<CompanyDetailHubPage tab="financeiro" />} />

        {/* 8. Gestão de Usuários & HBAC Global */}
        <Route path="usuarios" element={<UsersListPage scope="global" />} />
        <Route path="usuarios/novo" element={<UserFormPage scope="global" mode="create" />} />
        <Route path="usuarios/:usuarioId" element={<UserDetailAndMatrixPage scope="global" />} />
        <Route path="usuarios/:usuarioId/editar" element={<UserFormPage scope="global" mode="edit" />} />
        <Route path="papeis" element={<RolesAndHbacPage scope="global" />} />

        {/* 9. Catálogo Comercial de Módulos */}
        <Route path="modulos" element={<GlobalModulesCatalogPage />} />
        <Route path="modulos/novo" element={<ModuleFormPage mode="create" />} />
        <Route path="modulos/:moduloId" element={<ModuleDetailPage />} />
        <Route path="modulos/:moduloId/editar" element={<ModuleFormPage mode="edit" />} />

        {/* 10. Contratos e Assinaturas */}
        <Route path="contratos" element={<ContractsListPage scope="global" />} />
        <Route path="contratos/novo" element={<ContractFormPage mode="create" />} />
        <Route path="contratos/:contratoId" element={<ContractDetailAndSignaturePage scope="global" />} />
        <Route path="contratos/:contratoId/editar" element={<ContractFormPage mode="edit" />} />
        <Route path="contratos/:contratoId/assinatura" element={<ContractDetailAndSignaturePage scope="global" />} />

        {/* 11. Financeiro, Cobranças, Parcelas e Pagamentos */}
        <Route path="financeiro" element={<FinanceHubPage scope="global" activeTab="overview" />} />
        <Route path="financeiro/cobrancas" element={<FinanceHubPage scope="global" activeTab="cobrancas" />} />
        <Route path="financeiro/pagamentos" element={<FinanceHubPage scope="global" activeTab="pagamentos" />} />
        <Route path="financeiro/parcelas" element={<FinanceHubPage scope="global" activeTab="parcelas" />} />
        <Route path="financeiro/conciliacao" element={<FinanceHubPage scope="global" activeTab="conciliacao" />} />
        <Route path="financeiro/relatorios" element={<FinanceHubPage scope="global" activeTab="relatorios" />} />

        {/* 12. Meios de Pagamento */}
        <Route path="meios-pagamento" element={<PaymentMethodsPage />} />
        <Route path="meios-pagamento/novo" element={<PaymentMethodFormPage mode="create" />} />
        <Route path="meios-pagamento/:metodoId" element={<PaymentMethodDetailPage />} />
        <Route path="meios-pagamento/:metodoId/editar" element={<PaymentMethodFormPage mode="edit" />} />

        {/* 13. API Hub */}
        <Route path="api-hub" element={<Navigate to="/app/global/api-hub/servicos" replace />} />
        <Route path="api-hub/servicos" element={<ApiHubCatalogPage activeTab="servicos" />} />
        <Route path="api-hub/servicos/novo" element={<ApiServiceFormPage mode="create" />} />
        <Route path="api-hub/servicos/:servicoId" element={<ApiServiceInspectorAndRunnerPage />} />
        <Route path="api-hub/servicos/:servicoId/editar" element={<ApiServiceFormPage mode="edit" />} />
        <Route path="api-hub/servicos/:servicoId/testar" element={<ApiServiceInspectorAndRunnerPage />} />
        <Route path="api-hub/colecoes" element={<ApiHubCatalogPage activeTab="colecoes" />} />
        <Route path="api-hub/ambientes" element={<ApiHubCatalogPage activeTab="ambientes" />} />
        <Route path="api-hub/tokens" element={<ApiHubCatalogPage activeTab="tokens" />} />
        <Route path="api-hub/historico" element={<ApiHubCatalogPage activeTab="historico" />} />

        {/* 14. Tickets e Suporte */}
        <Route path="tickets" element={<TicketsListPage scope="global" />} />
        <Route path="tickets/novo" element={<TicketFormPage scope="global" mode="create" />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage scope="global" />} />
        <Route path="tickets/:ticketId/editar" element={<TicketFormPage scope="global" mode="edit" />} />

        {/* 15. Auditoria Global */}
        <Route path="auditoria" element={<AuditListPage scope="global" />} />
        <Route path="auditoria/:eventoId" element={<AuditEventDetailPage scope="global" />} />

        {/* 16. Relatórios e Indicadores Globais */}
        <Route path="relatorios" element={<ReportsAnalyticsPage scope="global" />} />
      </Route>

      {/* 3. AMBIENTE DA EMPRESA CLIENTE (/app/empresa/:empresaId) */}
      <Route path="/app/empresa/:empresaId" element={<WorkspaceLayout mode="company" />}>
        <Route index element={<CompanyDashboardPage />} />

        {/* Usuários & HBAC da Empresa */}
        <Route path="usuarios" element={<UsersListPage scope="company" />} />
        <Route path="usuarios/novo" element={<UserFormPage scope="company" mode="create" />} />
        <Route path="usuarios/:usuarioId" element={<UserDetailAndMatrixPage scope="company" />} />
        <Route path="usuarios/:usuarioId/editar" element={<UserFormPage scope="company" mode="edit" />} />
        <Route path="papeis" element={<RolesAndHbacPage scope="company" />} />

        {/* Módulos Contratados e Solicitação sob Demanda */}
        <Route path="modulos" element={<CompanyModulesSubscriptionPage />} />

        {/* Contratos da Empresa */}
        <Route path="contratos" element={<ContractsListPage scope="company" />} />
        <Route path="contratos/:contratoId" element={<ContractDetailAndSignaturePage scope="company" />} />
        <Route path="contratos/:contratoId/assinatura" element={<ContractDetailAndSignaturePage scope="company" />} />

        {/* Financeiro da Empresa */}
        <Route path="financeiro" element={<FinanceHubPage scope="company" activeTab="overview" />} />
        <Route path="financeiro/cobrancas" element={<FinanceHubPage scope="company" activeTab="cobrancas" />} />
        <Route path="financeiro/pagamentos" element={<FinanceHubPage scope="company" activeTab="pagamentos" />} />
        <Route path="financeiro/parcelas" element={<FinanceHubPage scope="company" activeTab="parcelas" />} />

        {/* Operação dos Módulos Contratados (Estoque, Vendas, CRM) */}
        <Route path="operacao/estoque" element={<CompanyOperationModulePage moduleType="inventory" />} />
        <Route path="operacao/vendas" element={<CompanyOperationModulePage moduleType="orders" />} />
        <Route path="operacao/crm" element={<CompanyOperationModulePage moduleType="crm" />} />

        {/* Tickets e Suporte da Empresa */}
        <Route path="tickets" element={<TicketsListPage scope="company" />} />
        <Route path="tickets/novo" element={<TicketFormPage scope="company" mode="create" />} />
        <Route path="tickets/:ticketId" element={<TicketDetailPage scope="company" />} />
        <Route path="tickets/:ticketId/editar" element={<TicketFormPage scope="company" mode="edit" />} />

        {/* Auditoria da Empresa */}
        <Route path="auditoria" element={<AuditListPage scope="company" />} />
        <Route path="auditoria/:eventoId" element={<AuditEventDetailPage scope="company" />} />

        {/* Relatórios da Empresa */}
        <Route path="relatorios" element={<ReportsAnalyticsPage scope="company" />} />
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
