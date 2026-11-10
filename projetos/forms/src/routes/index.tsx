import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';

const GoogleOAuthCallbackRedirect: React.FC = () => {
  const location = useLocation();
  return <Navigate to={`/app/integrations${location.search}`} replace />;
};
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { DashboardOverviewPage } from '../pages/DashboardOverviewPage';
import { FormsListPage } from '../pages/FormsListPage';
import { FormBuilderPage } from '../pages/FormBuilderPage';
import { FormResponsesPage } from '../pages/FormResponsesPage';
import { PublicFormPage } from '../pages/PublicFormPage';
import { DashboardsListPage } from '../pages/DashboardsListPage';
import { DashboardBuilderPage } from '../pages/DashboardBuilderPage';
import { PublicDashboardPage } from '../pages/PublicDashboardPage';
import { UsersManagementPage } from '../pages/UsersManagementPage';
import { UserFormPage } from '../pages/UserFormPage';
import { GroupsManagementPage } from '../pages/GroupsManagementPage';
import { GroupFormPage } from '../pages/GroupFormPage';
import { GroupGoogleConfigPage } from '../pages/GroupGoogleConfigPage';
import { ApiTokensPage } from '../pages/ApiTokensPage';
import { TokenCreatePage } from '../pages/TokenCreatePage';
import { GoogleIntegrationsPage } from '../pages/GoogleIntegrationsPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { ValidationHubPage } from '../pages/ValidationHubPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/f/:shareCode" element={<PublicFormPage />} />
      <Route path="/d/:shareCode" element={<PublicDashboardPage />} />
      <Route path="/integrations/google/callback" element={<GoogleOAuthCallbackRedirect />} />

      {/* Authenticated Dashboard App Shell */}
      <Route
        path="/app"
        element={
          <DashboardLayout>
            <DashboardOverviewPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/forms"
        element={
          <DashboardLayout>
            <FormsListPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/forms/new"
        element={
          <DashboardLayout>
            <FormBuilderPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/forms/:id"
        element={
          <DashboardLayout>
            <FormBuilderPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/forms/:id/responses"
        element={
          <DashboardLayout>
            <FormResponsesPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/dashboards"
        element={
          <DashboardLayout>
            <DashboardsListPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/dashboards/new"
        element={
          <DashboardLayout>
            <DashboardBuilderPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/dashboards/:id"
        element={
          <DashboardLayout>
            <DashboardBuilderPage />
          </DashboardLayout>
        }
      />

      {/* Users */}
      <Route
        path="/app/users"
        element={
          <DashboardLayout>
            <UsersManagementPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/users/new"
        element={
          <DashboardLayout>
            <UserFormPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/users/:id/edit"
        element={
          <DashboardLayout>
            <UserFormPage />
          </DashboardLayout>
        }
      />

      {/* Groups */}
      <Route
        path="/app/groups"
        element={
          <DashboardLayout>
            <GroupsManagementPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/groups/new"
        element={
          <DashboardLayout>
            <GroupFormPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/groups/:id/edit"
        element={
          <DashboardLayout>
            <GroupFormPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/groups/:id/google"
        element={
          <DashboardLayout>
            <GroupGoogleConfigPage />
          </DashboardLayout>
        }
      />

      {/* Tokens */}
      <Route
        path="/app/tokens"
        element={
          <DashboardLayout>
            <ApiTokensPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/tokens/new"
        element={
          <DashboardLayout>
            <TokenCreatePage />
          </DashboardLayout>
        }
      />

      {/* Integrations */}
      <Route
        path="/app/integrations"
        element={
          <DashboardLayout>
            <GoogleIntegrationsPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/app/integrations/groups/:groupId"
        element={
          <DashboardLayout>
            <GroupGoogleConfigPage />
          </DashboardLayout>
        }
      />

      <Route
        path="/app/audit"
        element={
          <DashboardLayout>
            <AuditLogsPage />
          </DashboardLayout>
        }
      />

      {/* Seção Validar */}
      <Route
        path="/app/validate"
        element={
          <DashboardLayout>
            <ValidationHubPage />
          </DashboardLayout>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
