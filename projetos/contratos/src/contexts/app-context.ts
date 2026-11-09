import { createContext } from "react";
import type { useAuth } from "@/hooks/use-auth";
import type { useWorkspace } from "@/hooks/use-workspace";

export const AuthContext = createContext<ReturnType<typeof useAuth> | null>(null);
export const WorkspaceContext = createContext<ReturnType<typeof useWorkspace> | null>(null);
