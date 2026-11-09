# Sprint 12 — Seguranca, LGPD e Hardening

**Status:** Concluida  
**Commit:** `8fd71e4`  
**Objetivo:** Auditar superficie de ataque, proteger segredos e introduzir mascaramento de PII.

---

## Correcoes criticas

### 1. `.env` versionado

- Problema: `.env` com chaves Supabase estava no historico Git (ex.: commit `08cd754`)
- Fix: entradas adicionadas ao `.gitignore`:
  ```
  .env
  .env.local
  .env.production
  ```

### 2. Data masking LGPD — `src/lib/mask.ts`

| Helper      | Exemplo            |
| ----------- | ------------------ |
| `maskPhone` | `(11) *****-1234`  |
| `maskEmail` | `w*****@gmail.com` |
| `maskCPF`   | `***.***.***-42`   |

Uso recomendado em listagens publicas ou compartilhadas onde PII completa nao e necessaria.

---

## Auditoria — confirmado OK

| Area         | Situacao                                                |
| ------------ | ------------------------------------------------------- |
| RLS          | Politicas via `is_global_admin()` nas tabelas sensiveis |
| RPCs         | `SECURITY DEFINER` com check de admin no corpo          |
| Service role | Apenas server-side (`client.server.ts`)                 |
| Webhooks     | Idempotencia `UNIQUE(gateway, event_id)`                |
| Grants       | Restritos por funcao/papel nas migracoes                |

---

## Recomendacoes de producao (ainda manuais)

1. **Rotacionar** chaves Supabase expostas no historico antigo
2. Configurar **CSP headers** no deploy
3. **Rate limiting** em auth, checkout e reserva
4. Revisar onde PII ainda aparece sem mask nas UIs publicas
5. Testes de autorizacao negativos (USER tentando RPC de admin)

---

## Arquivos

- `.gitignore`
- `src/lib/mask.ts`

---

## Resultado de negocio

Base de seguranca documentada e hardening inicial de LGPD. Reduz risco de vazamento acidental de credenciais e dados pessoais em telas.
