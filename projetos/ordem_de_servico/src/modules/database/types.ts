export type ConnectionType = "localstorage" | "supabase" | "postgresql" | "mariadb" | "sqlite";

export interface DatabaseConnection {
  id: string;
  name: string;
  type: ConnectionType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  description?: string;
  status: "active" | "inactive" | "error";
  isDefault?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  deletedBy?: string | null;
  deletedAt?: string | null;
}

export const CONNECTION_TYPE_LABELS: Record<ConnectionType, string> = {
  localstorage: "Local Storage",
  supabase: "Supabase",
  postgresql: "PostgreSQL",
  mariadb: "MariaDB",
  sqlite: "SQLite",
};
