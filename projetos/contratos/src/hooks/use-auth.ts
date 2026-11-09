import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth";
import { authService } from "@/services/auth";
import { profileService, roleService } from "@/services/workspace";

export function useAuth() {
  const {
    session,
    profile,
    roles,
    permissions,
    isGlobalAdmin,
    isLoading,
    error,
    setSession,
    setProfile,
    setRoles,
    setPermissions,
    setIsGlobalAdmin,
    setLoading,
    setError,
    reset,
  } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      try {
        const currentSession = await authService.getSession();
        if (!mounted) return;
        setSession(currentSession);

        if (currentSession?.user) {
          const [profileData, rolesData, permissionsData] = await Promise.all([
            profileService.getById(currentSession.user.id),
            roleService.listByUser(currentSession.user.id),
            roleService.listPermissions(),
          ]);
          if (!mounted) return;
          setProfile(profileData);
          setRoles(rolesData);
          setPermissions(permissionsData);
          setIsGlobalAdmin(
            rolesData.some((r) => r.role === "super_admin" && r.workspace_id === null),
          );
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : "Erro de autenticação");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrap();

    const subscription = authService.onAuthStateChange(async (nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        reset();
        return;
      }
      try {
        const [profileData, rolesData, permissionsData] = await Promise.all([
          profileService.getById(nextSession.user.id),
          roleService.listByUser(nextSession.user.id),
          roleService.listPermissions(),
        ]);
        setProfile(profileData);
        setRoles(rolesData);
        setPermissions(permissionsData);
        setIsGlobalAdmin(
          rolesData.some((r) => r.role === "super_admin" && r.workspace_id === null),
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    session,
    user: session?.user ?? null,
    profile,
    roles,
    permissions,
    isGlobalAdmin,
    isLoading,
    error,
    isAuthenticated: !!session?.user,
    signInWithEmail: authService.signInWithEmail.bind(authService),
    signInWithGoogle: authService.signInWithGoogle.bind(authService),
    signUpWithEmail: authService.signUpWithEmail.bind(authService),
    resetPassword: authService.resetPassword.bind(authService),
    signOut: authService.signOut.bind(authService),
  };
}
