/**
 * Legacy shim — new code should use `useAuth()` from `@/hooks/useAuth`
 * or `authService` from `@/services/auth.service`.
 * Kept only to preserve existing imports.
 */
import { authService, type AppUser } from "@/services/auth.service";

export type AuthUser = AppUser;

export const authProvider = {
  name: "Supabase" as const,
  getCurrentUser: () => authService.getUser(),
  signIn: (email: string, password: string) => authService.login(email, password),
  signUp: (name: string, email: string, password: string) =>
    authService.register(name, email, password),
  signInWithGoogle: () => authService.loginGoogle(),
  signOut: () => authService.logout(),
};
