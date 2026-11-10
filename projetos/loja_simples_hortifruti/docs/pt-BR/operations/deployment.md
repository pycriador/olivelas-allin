---
id: "DOC-OPS-DEPLOY"
title: "Guia de Hospedagem Estática e Deploy"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Operations"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Guia de Hospedagem Estática e Deploy

> Idioma: Português (pt-BR) | [English (EN)](../../en/operations/deployment.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Guia de Hospedagem Estática e Deploy

Por ser uma aplicação totalmente client-side, o **Hortifruti Natural** pode ser hospedado com custo zero em qualquer provedor de hospedagem estática.

## Provedores Recomendados

### 1. GitHub Pages
1. Acesse o repositório no GitHub.
2. Vá em **Settings** > **Pages**.
3. Em **Source**, selecione a branch `main` e a pasta `/ (root)`.
4. Clique em **Save**. O site estará disponível em `https://<usuario>.github.io/<repo>/`.

### 2. Vercel
1. Conecte o repositório ao dashboard da Vercel.
2. Como não há etapas de build, mantenha as configurações padrão (Framework Preset: *Other*).
3. Clique em **Deploy**.

### 3. Netlify
1. Crie um novo site a partir do repositório Git.
2. Defina o diretório de publicação como `.` (raiz).
3. Salve e publique.

Consulte [catalog-maintenance.md](catalog-maintenance.md) para gerenciamento contínuo de produtos.
