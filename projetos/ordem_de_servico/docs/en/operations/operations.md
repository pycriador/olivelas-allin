---
title: "Operations and Deployment Model"
status: "ACCEPTED"
owner: "serviceforge-devops"
updated: "2026-10-15"
---

# Operations and Deployment Model — ServiceForge Platform

> Language: English (EN) | [Português (pt-BR)](../../pt-BR/operations/operations.md)
>
> Status: ACCEPTED | Version: v1.0.0-RC1

This document outlines standard operating procedures for building, running, validating, and deploying the ServiceForge platform across cloud providers and static hosting environments.

---

## 🛠️ Build and Development Commands

```bash
# Start local development server on port 8080
npm run dev

# Compile for production (Vite + Cloudflare Nitro SSR)
npm run build

# Generate static SPA distribution for GitHub Pages
npm run build:gh-pages

# Execute database integration tests on live PostgreSQL
npm run test:e2e
```

---

## 🚀 GitHub Pages Automation

ServiceForge features turn-key deployment to GitHub Pages via `scripts/build-gh-pages.mjs` and `.github/workflows/deploy-gh-pages.yml`.

### Deployment Mechanism:
1. **Compilation**: Vite bundles all frontend JavaScript and CSS modules into `.output/public/assets/`.
2. **SPA History Routing**: Generates `404.html` with deep-link path preserving script that reroutes inbound traffic to `index.html`.
3. **Asset Unblocker**: Adds `.nojekyll` to the output root to prevent GitHub Pages from bypassing underscore-prefixed asset paths.
4. **CI/CD Pipeline**: GitHub Actions automatically triggers on pushes to `main`, validating and publishing the latest production bundle.

---

## 🐘 Database Utility Scripts

Pre-configured diagnostic and migration tools in `scripts/`:

| Script | Purpose |
| :--- | :--- |
| `scripts/test-e2e-real-db.mjs` | Executes end-to-end CRUD operations against live Supabase PostgreSQL. |
| `scripts/fix-security-views.mjs` | Automatically recreates database views with `security_invoker = on`. |
| `scripts/create-missing-tables.mjs` | Verifies and creates any missing operational tables with UUID defaults. |
| `scripts/grant-rls.mjs` | Configures and audits Row Level Security policies. |
