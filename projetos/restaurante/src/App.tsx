import { Toaster } from 'sonner';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RestaurantProvider } from '@/contexts/RestaurantContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { useTheme } from '@/hooks/useTheme';
import { AppRoutes } from '@/routes/AppRoutes';

function AppWithProviders() {
  const { resolvedTheme } = useTheme();

  return (
    <AuthProvider>
      <RestaurantProvider>
        <LanguageProvider>
          <AppRoutes />
          <Toaster
            theme={resolvedTheme}
            position="top-right"
            richColors
            closeButton
            duration={4000}
          />
        </LanguageProvider>
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppWithProviders />
    </ThemeProvider>
  );
}
