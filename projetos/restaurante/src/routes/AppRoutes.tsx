import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { TestEvidencePage } from '@/pages/TestEvidencePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { SetupRestaurantPage } from '@/pages/SetupRestaurantPage';
import { SelectRestaurantPage } from '@/pages/SelectRestaurantPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { RestaurantSettingsPage } from '@/pages/RestaurantSettingsPage';
import { TeamPage } from '@/pages/TeamPage';
import { TeamMemberDetailsPage } from '@/pages/TeamMemberDetailsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { MenuOverviewPage } from '@/pages/menu/MenuOverviewPage';
import { CategoriesPage } from '@/pages/menu/CategoriesPage';
import { CategoryDetailsPage } from '@/pages/menu/CategoryDetailsPage';
import { ProductsPage } from '@/pages/menu/ProductsPage';
import { ProductDetailsPage } from '@/pages/menu/ProductDetailsPage';
import { AddOnsPage } from '@/pages/menu/AddOnsPage';
import { AddOnDetailsPage } from '@/pages/menu/AddOnDetailsPage';
import { TablesPage } from '@/pages/operations/TablesPage';
import { TableDetailsPage } from '@/pages/operations/TableDetailsPage';
import { TableAreasPage } from '@/pages/operations/TableAreasPage';
import { CustomerComandaPage } from '@/pages/operations/CustomerComandaPage';
import { OrdersPage } from '@/pages/operations/OrdersPage';
import { OrderDetailsPage } from '@/pages/operations/OrderDetailsPage';
import { KdsPage } from '@/pages/operations/KdsPage';
import { CashierPage } from '@/pages/operations/CashierPage';
import { ReportsPage } from '@/pages/operations/ReportsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminUserDetailsPage } from '@/pages/admin/AdminUserDetailsPage';
import { AdminEmployeesPage } from '@/pages/admin/AdminEmployeesPage';
import { AdminEmployeeDetailsPage } from '@/pages/admin/AdminEmployeeDetailsPage';
import { AdminRestaurantsPage } from '@/pages/admin/AdminRestaurantsPage';
import { AdminRestaurantDetailsPage } from '@/pages/admin/AdminRestaurantDetailsPage';
import { AdminRestaurantSupportPage } from '@/pages/admin/AdminRestaurantSupportPage';
import { AdminSupportPage } from '@/pages/admin/AdminSupportPage';
import { AdminAuditPage } from '@/pages/admin/AdminAuditPage';
import { AdminSessionsPage } from '@/pages/admin/AdminSessionsPage';
import { AdminIamPage } from '@/pages/admin/AdminIamPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { AdminRoute } from './AdminRoute';

export function AppRoutes() {
  const basename = window.location.pathname.startsWith('/olivelas-restaurant')
    ? '/olivelas-restaurant'
    : '/';

  return (
    <BrowserRouter basename={basename}>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Test Evidence Page */}
        <Route path="/evidence" element={<TestEvidencePage />} />
        <Route path="/test-evidence" element={<TestEvidencePage />} />

        {/* Public Customer Comanda View (accessed via QR Code) */}
        <Route path="/comanda/:tableId" element={<CustomerComandaPage />} />
        <Route path="/c/:restaurantId/:tableId" element={<CustomerComandaPage />} />

        {/* Public Only Auth Routes */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        {/* Protected Restaurant App Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Restaurant onboarding & picker */}
          <Route path="/app/setup/restaurant" element={<SetupRestaurantPage />} />
          <Route path="/app/select-restaurant" element={<SelectRestaurantPage />} />

          {/* Authenticated Restaurant Layout */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="restaurant" element={<RestaurantSettingsPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="team/:memberId" element={<TeamMemberDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Menu Module Routes (Fase 03) */}
            <Route path="menu" element={<MenuOverviewPage />} />
            <Route path="menu/categories" element={<CategoriesPage />} />
            <Route path="menu/categories/:categoryId" element={<CategoryDetailsPage />} />
            <Route path="menu/products" element={<ProductsPage />} />
            <Route path="menu/products/:productId" element={<ProductDetailsPage />} />
            <Route path="menu/add-ons" element={<AddOnsPage />} />
            <Route path="menu/add-ons/:addOnId" element={<AddOnDetailsPage />} />

            {/* Operational Modules (Mesas, Pedidos, KDS, Caixa, Relatórios) */}
            <Route path="tables" element={<TablesPage />} />
            <Route path="tables/areas" element={<TableAreasPage />} />
            <Route path="tables/:tableId" element={<TableDetailsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:orderId" element={<OrderDetailsPage />} />
            <Route path="kds" element={<KdsPage />} />
            <Route path="cashier" element={<CashierPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          {/* Dedicated Global Admin Layout */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="users/:userId" element={<AdminUserDetailsPage />} />
              <Route path="employees" element={<AdminEmployeesPage />} />
              <Route path="employees/:employeeId" element={<AdminEmployeeDetailsPage />} />
              <Route path="restaurants" element={<AdminRestaurantsPage />} />
              <Route path="restaurants/:restaurantId" element={<AdminRestaurantDetailsPage />} />
              <Route path="restaurants/:restaurantId/support" element={<AdminRestaurantSupportPage />} />
              <Route path="support" element={<AdminSupportPage />} />
              <Route path="audit" element={<AdminAuditPage />} />
              <Route path="sessions" element={<AdminSessionsPage />} />
              <Route path="iam" element={<AdminIamPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="profile" element={<AdminProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
