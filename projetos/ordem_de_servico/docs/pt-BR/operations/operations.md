---
title: "Modelo de Operações e Deploy"
status: "ACCEPTED"
owner: "serviceforge-devops"
updated: "2026-10-15"
---

# Modelo de Operações e Deploy — ServiceForge Platform

> Language: pt-BR | [English (EN)](../../en/operations/operations.md)
>
> Status: ACCEPTED | Versão: v1.0.0-RC1

Este documento descreve os procedimentos operacionais de build, verificação de qualidade, migrações de banco de dados e pipelines de deploy automatizados.

---

## 🛠️ Comandos de Desenvolvimento e Build

```bash
# Iniciar servidor de desenvolvimento com hot-reload (porta 8080)
npm run dev

# Compilar para produção (Vite + Nitro Cloudflare Worker)
npm run build

# Gerar distribuição estática SPA para GitHub Pages
npm run build:gh-pages

# Executar suite de testes de integração e banco real
npm run test:e2e
```

---

## 🚀 Pipeline de Publicação no GitHub Pages

O ServiceForge possui suporte nativo para hospedagem estática via GitHub Pages através do script `scripts/build-gh-pages.mjs` e do workflow `.github/workflows/deploy-gh-pages.yml`.

### Como Funciona o Pacote Estático (`dist-gh-pages`):
1. **Compilação**: O Vite gera os chunks client-side em `.output/public/assets/`.
2. **SPA Router Fallback**: Cria um `404.html` com script de preservação de rotas que redireciona URLs profundas (`/service-orders`, `/customers`) para o `index.html`.
3. **Bypass de Jekyll**: Um arquivo `.nojekyll` é criado para permitir que o GitHub Pages sirva diretórios iniciados por `_`.
4. **Deploy Automático**: Ao enviar commits para a branch `main`, a Action `.github/workflows/deploy-gh-pages.yml` compila e publica os artefatos de forma contínua.

---

## 🐘 Operações de Banco de Dados (Supabase)

Scripts utilitários para manutenção e auditoria do PostgreSQL localizados em `scripts/`:

| Script | Função |
| :--- | :--- |
| `scripts/test-e2e-real-db.mjs` | Executa validação de ponta a ponta com inserts e selects reais no Supabase. |
| `scripts/fix-security-views.mjs` | Recria views com `security_invoker = on` eliminando alertas do Supabase Linter. |
| `scripts/create-missing-tables.mjs` | Cria estruturas de tabelas ausentes e adiciona defaults de UUID. |
| `scripts/grant-rls.mjs` | Configura políticas de Row Level Security para tabelas operacionais. |
