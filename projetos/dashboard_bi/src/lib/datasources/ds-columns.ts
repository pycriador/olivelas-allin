// Column list used for every client-facing read of `data_sources`.
// Credential columns (secret_ciphertext, ssl_client_key, ssl_client_certificate,
// ssl_ca_certificate) are deliberately excluded: SELECT on them is revoked in
// the database for `authenticated`, so `select("*")` would be rejected.
export const DS_PUBLIC_COLUMNS =
  "id, organization_id, workspace_id, name, description, type, environment, host, port, database_name, default_schema, username, ssl_enabled, timeout_ms, extra_config, tags, active, health, health_message, health_checked_at, latency_ms, server_version, sync_mode, sync_frequency, last_synced_at, schema_count, table_count, view_count, column_count, created_by, created_at, updated_at" as const;
