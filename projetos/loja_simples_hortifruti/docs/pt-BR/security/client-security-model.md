---
id: "DOC-SEC-MODEL"
title: "Modelo de Segurança Client-Side"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Security"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Modelo de Segurança Client-Side

> Idioma: Português (pt-BR) | [English (EN)](../../en/security/client-security-model.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Modelo de Segurança Client-Side

Como a aplicação opera exclusivamente no cliente (Zero-Backend), a superfície de ataque é significativamente reduzida em comparação com servidores e bancos de dados tradicionais.

## Diretrizes de Segurança

1. **Sem Segredos em Código**: O projeto não contém chaves de API privadas, tokens de banco de dados ou segredos de servidor.
2. **Prevenção contra XSS**:
   - Todo texto inserido pelo usuário (busca, formulário de entrega) é tratado e escapado antes de qualquer renderização no DOM (`textContent` ou escape de strings HTML).
3. **Isolamento de Origem no LocalStorage**:
   - Os dados gravados no `localStorage` são confinados à origem exata (protocolo, domínio e porta) do site.
4. **Comunicação Segura**:
   - A finalização de pedidos redireciona para a API oficial do WhatsApp utilizando conexões HTTPS criptografadas ponta a ponta.

Consulte [privacy-and-data-handling.md](privacy-and-data-handling.md) para o tratamento de privacidade.
