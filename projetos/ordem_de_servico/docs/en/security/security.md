---
title: "Security Model, RLS and Permissions"
status: "ACCEPTED"
owner: "serviceforge-sec"
updated: "2026-10-15"
---

# Security Model and Permissions — ServiceForge Platform

> Language: English (EN) | [Português (pt-BR)](../../pt-BR/security/security.md)
>
> Status: ACCEPTED | Version: v1.0.0-RC1

The security posture of ServiceForge follows defense-in-depth principles: zero-trust tenant boundaries, immutable auditing, and strict database-level access controls.

---

## 🛡️ Security Pillars

### 1. Row Level Security (RLS)
All transactional tables have RLS strictly enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
- Read and write policies check the JWT caller context to ensure `company_id` matches the user's active tenancy.

### 2. Views with `security_invoker = on`
In compliance with the PostgreSQL and Supabase Security Advisor guidelines, views in the `public` schema invoke caller privileges rather than definer privileges:

```sql
create or replace view public.serviceforge_hr_employees with (security_invoker = on) as
  select id, company_id, name, email, phone, role_title, salary, commission_rate, active, created_at, updated_at
  from hr_employees;
```

### 3. Session and Identity Management
- Authentication is token-based using cryptographic JWTs issued by Supabase Auth.
- Session tokens are refreshed transparently, and multi-tenancy organization switching is validated against `user_companies`.

### 4. Audit Trail (`audit_log`)
- All mission-critical state mutations (status transitions, quote approvals, payments, deletions) are appended to an immutable audit trail.
