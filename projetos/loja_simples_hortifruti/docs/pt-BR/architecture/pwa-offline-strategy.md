---
id: "DOC-ARCH-PWA"
title: "Estratégia PWA e Funcionamento Offline"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Architecture"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Estratégia PWA e Funcionamento Offline

> Idioma: Português (pt-BR) | [English (EN)](../../en/architecture/pwa-offline-strategy.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Estratégia PWA e Funcionamento Offline

A aplicação implementa os padrões modernos de Progressive Web App (PWA) para permitir instalação em celulares/desktops e funcionamento confiável sob conexões intermitentes.

## Recursos de PWA

1. **Service Worker ([sw.js](../../../sw.js))**:
   - Estratégia de cache: **Cache First** para recursos estáticos (HTML, CSS, JS, ícones) e **Stale-While-Revalidate** para o catálogo `produtos.json`.
   - Gerenciamento automático de cache por versão (`CACHE_NAME = 'hortifruti-v1.x'`).
2. **Manifesto Web ([manifest.webmanifest](../../../manifest.webmanifest))**:
   - Define nome, cores do tema (`#2d7a3a`), ícones de alta resolução e modo de exibição `standalone`.
3. **Página de Fallback Offline ([offline.html](../../../offline.html))**:
   - Página apresentada caso o usuário tente acessar rotas não cacheadas enquanto completamente sem conexão.

Consulte [../operations/deployment.md](../operations/deployment.md) para detalhes de instalação e cache em produção.
