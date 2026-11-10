---
id: "DOC-SEC-MODEL"
title: "Client-Side Security Model"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Security"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Client-Side Security Model

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/security/client-security-model.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Client-Side Security Model

Operating with a zero-backend architecture minimizes exposure to common server and database vulnerabilities.

## Security Controls & Policies

1. **No Hardcoded Secrets**: The codebase contains zero server-side API keys, database credentials, or secret tokens.
2. **Cross-Site Scripting (XSS) Prevention**:
   - User inputs (search keywords, delivery fields) are escaped or assigned via safe DOM properties (`textContent`).
3. **Origin Isolation for LocalStorage**:
   - Runtime data stored in `localStorage` is restricted to the site's exact origin (protocol, domain, port).
4. **Secure Transport**:
   - Order dispatches redirect to WhatsApp's official API using end-to-end encrypted HTTPS connections.

See [privacy-and-data-handling.md](privacy-and-data-handling.md) for data privacy practices.
