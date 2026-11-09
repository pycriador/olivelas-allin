import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { AuthContext, WorkspaceContext } from "@/contexts/app-context";

export function AppProviders({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const workspace = useWorkspace();

  return (
    <AuthContext.Provider value={auth}>
      <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>
    </AuthContext.Provider>
  );
}
