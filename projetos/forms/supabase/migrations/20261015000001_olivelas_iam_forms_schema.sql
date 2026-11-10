-- ========================================================
-- Olivelas IAM Forms - Dedicated Database Schema
-- Schema: olivelas_iam_forms
-- Complete isolation from other projects in the same database
-- ========================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. Dedicated Schema Creation
CREATE SCHEMA IF NOT EXISTS olivelas_iam_forms;
GRANT ALL ON SCHEMA olivelas_iam_forms TO postgres, anon, authenticated, service_role;

-- 1. Users table (IAM & Roles: admin, creator, viewer)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'creator', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    department TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Groups table
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#4f46e5',
    created_by UUID REFERENCES olivelas_iam_forms.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. User Groups mapping (HBAC membership)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.user_groups (
    user_id UUID REFERENCES olivelas_iam_forms.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES olivelas_iam_forms.groups(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, group_id)
);

-- 4. Forms table
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES olivelas_iam_forms.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'closed')),
    theme_id TEXT DEFAULT 'google-classic',
    header_image_url TEXT,
    logo_url TEXT,
    is_public BOOLEAN DEFAULT true,
    share_code TEXT UNIQUE NOT NULL,
    requires_login BOOLEAN DEFAULT false,
    allow_anonymous BOOLEAN DEFAULT true,
    limit_one_response BOOLEAN DEFAULT false,
    show_progress_bar BOOLEAN DEFAULT true,
    shuffle_questions BOOLEAN DEFAULT false,
    confirmation_message TEXT DEFAULT 'Sua resposta foi registrada com sucesso!',
    redirect_url TEXT,
    password_protect BOOLEAN DEFAULT false,
    password_hash TEXT,
    expires_at TIMESTAMPTZ,
    max_responses INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Form Fields table
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES olivelas_iam_forms.forms(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'integer', 'decimal', 'radio', 'checkbox', 'dropdown', 'info_text', 'file_upload', 'rating', 'scale', 'date', 'time', 'switch')),
    label TEXT NOT NULL,
    description TEXT,
    placeholder TEXT,
    required BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL DEFAULT 0,
    options JSONB DEFAULT '[]'::jsonb,
    validation JSONB DEFAULT '{}'::jsonb,
    conditional_logic JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Form Collaborators (Owner can share with editor or viewer by email)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.collaborators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES olivelas_iam_forms.forms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES olivelas_iam_forms.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
    invited_by UUID REFERENCES olivelas_iam_forms.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (form_id, user_email)
);

-- 7. Form Responses
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    form_id UUID NOT NULL REFERENCES olivelas_iam_forms.forms(id) ON DELETE CASCADE,
    respondent_id UUID REFERENCES olivelas_iam_forms.users(id) ON DELETE SET NULL,
    respondent_email TEXT,
    respondent_ip TEXT,
    user_agent TEXT,
    submitted_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'flagged'))
);

-- 8. Form Answers
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID NOT NULL REFERENCES olivelas_iam_forms.responses(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES olivelas_iam_forms.fields(id) ON DELETE CASCADE,
    value_text TEXT,
    value_number NUMERIC,
    value_json JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Dashboards (Interactive Dashboards with Google Sheet/Drive/Forms sync)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES olivelas_iam_forms.users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    share_code TEXT UNIQUE NOT NULL,
    form_id UUID REFERENCES olivelas_iam_forms.forms(id) ON DELETE SET NULL,
    google_sheet_source JSONB,
    refresh_interval_sec INTEGER DEFAULT 0,
    theme_id TEXT DEFAULT 'google-classic',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Dashboard Widgets (pie, doughnut, bar, bar_horizontal, line, area, metric, table)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES olivelas_iam_forms.dashboards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('pie', 'doughnut', 'bar', 'bar_horizontal', 'line', 'area', 'metric', 'table')),
    field_id UUID REFERENCES olivelas_iam_forms.fields(id) ON DELETE SET NULL,
    data_source TEXT DEFAULT 'form' CHECK (data_source IN ('form', 'google_sheet', 'custom')),
    config JSONB DEFAULT '{}'::jsonb,
    position JSONB DEFAULT '{"x": 0, "y": 0, "w": 6, "h": 4}'::jsonb,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 11. API Tokens (HBAC Bearer Token Auth with Granular Scopes)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.api_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES olivelas_iam_forms.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    token_prefix TEXT NOT NULL,
    scopes TEXT[] DEFAULT ARRAY['forms:read']::TEXT[],
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Google Integrations (Drive, Sheets, Forms Sync)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.google_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES olivelas_iam_forms.users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('google_drive', 'google_sheets', 'google_forms')),
    auth_mode TEXT NOT NULL DEFAULT 'oauth' CHECK (auth_mode IN ('oauth', 'service_account')),
    credentials_encrypted TEXT,
    connected_email TEXT,
    status TEXT DEFAULT 'connected',
    last_sync_at TIMESTAMPTZ,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Audit Logs (HBAC traceability)
CREATE TABLE IF NOT EXISTS olivelas_iam_forms.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id REFERENCES olivelas_iam_forms.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_oif_forms_owner ON olivelas_iam_forms.forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_oif_forms_share_code ON olivelas_iam_forms.forms(share_code);
CREATE INDEX IF NOT EXISTS idx_oif_fields_form ON olivelas_iam_forms.fields(form_id, order_index);
CREATE INDEX IF NOT EXISTS idx_oif_collab_form_user ON olivelas_iam_forms.collaborators(form_id, user_email);
CREATE INDEX IF NOT EXISTS idx_oif_responses_form ON olivelas_iam_forms.responses(form_id);
CREATE INDEX IF NOT EXISTS idx_oif_answers_response ON olivelas_iam_forms.answers(response_id);
CREATE INDEX IF NOT EXISTS idx_oif_dashboards_owner ON olivelas_iam_forms.dashboards(owner_id);
CREATE INDEX IF NOT EXISTS idx_oif_dash_widgets ON olivelas_iam_forms.dashboard_widgets(dashboard_id, order_index);
CREATE INDEX IF NOT EXISTS idx_oif_audit_created ON olivelas_iam_forms.audit_logs(created_at DESC);

-- Permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA olivelas_iam_forms TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA olivelas_iam_forms TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA olivelas_iam_forms GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA olivelas_iam_forms GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
