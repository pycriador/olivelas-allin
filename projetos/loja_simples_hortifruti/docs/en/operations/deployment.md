---
id: "DOC-OPS-DEPLOY"
title: "Static Hosting & Deployment Guide"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Operations"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Static Hosting & Deployment Guide

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/operations/deployment.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Static Hosting & Deployment Guide

As a purely static client-side web application, **Hortifruti Natural** can be hosted with zero server costs on any modern static web host.

## Recommended Hosting Providers

### 1. GitHub Pages
1. Open the repository on GitHub.
2. Navigate to **Settings** > **Pages**.
3. Under **Source**, select the `main` branch and root `/` directory.
4. Click **Save**. The live storefront will be served at `https://<username>.github.io/<repo>/`.

### 2. Vercel
1. Import repository on Vercel Dashboard.
2. Keep default settings (Framework Preset: *Other*).
3. Click **Deploy**.

### 3. Netlify
1. Create new site from Git repository.
2. Set publish directory to `.` (root).
3. Click **Deploy Site**.

See [catalog-maintenance.md](catalog-maintenance.md) for catalog management workflows.
