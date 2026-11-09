import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import WeeklyPage from "./pages/WeeklyPage";
import LaundryPage from "./pages/LaundryPage";
import PetsPage from "./pages/PetsPage";
import BabyPage from "./pages/BabyPage";
import SettingsPage from "./pages/SettingsPage";
import UserManagementPage from "./pages/UserManagementPage";
import GlobalFormPage from "./pages/GlobalFormPage";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando...</div>
      </div>
    );
  }
  return user ? <Index /> : <LandingPage />;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<AuthRoute><AuthPage /></AuthRoute>} />
    <Route path="/" element={<HomeRoute />} />
    <Route path="/weekly" element={<ProtectedRoute><WeeklyPage /></ProtectedRoute>} />
    <Route path="/laundry" element={<ProtectedRoute><LaundryPage /></ProtectedRoute>} />
    <Route path="/pets" element={<ProtectedRoute><PetsPage /></ProtectedRoute>} />
    <Route path="/baby" element={<ProtectedRoute><BabyPage /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
    <Route path="/admin/users" element={<ProtectedRoute><UserManagementPage /></ProtectedRoute>} />
    <Route path="/global-form" element={<ProtectedRoute><GlobalFormPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
