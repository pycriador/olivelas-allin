import { useContext } from "react";
import { AuthContext, WorkspaceContext } from "@/contexts/app-context";

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AppProviders");
  return ctx;
}

export function useWorkspaceContext() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspaceContext must be used within AppProviders");
  return ctx;
}
