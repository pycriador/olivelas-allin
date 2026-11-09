# Sprint 5 — Auth expandida e base de PIX/Gateways

**Status:** Concluida  
**Commits:** `2250334` (auth), `0f81a9d` (qrcode), `7c363ca` (Pix/gateway layers)  
**Objetivo:** Expandir autenticacao alem do Google e preparar a camada de pagamentos usada nas Sprints 6–7.

---

## Parte A — Autenticacao por email/senha

### Pagina `/auth` com 3 modos

1. **Login** — email + senha (mostrar/ocultar senha)
2. **Criar conta** — nome + email + senha (confirmacao por email)
3. **Recuperar senha** — envia link de reset

Google OAuth permanece como opcao secundaria.

### AuthContext expandido

- `signInWithEmail`
- `signUpWithEmail`
- `resetPassword`

Arquivos:

- `src/routes/auth.tsx`
- `src/contexts/auth-context.tsx`

---

## Parte B — Camada de pagamentos (base)

Infraestrutura server-side (Lovable + projeto):

| Camada           | Arquivo                              |
| ---------------- | ------------------------------------ |
| Orquestracao     | `src/lib/payments/payment.server.ts` |
| Contrato gateway | `gateway.server.ts`                  |
| Factory          | `gateway-factory.server.ts`          |
| Adapters         | `adapters/infinity-pay.server.ts`    |
|                  | `adapters/mercado-pago.server.ts`    |
|                  | `adapters/pagbank.server.ts`         |

Dependencia: pacote `qrcode` instalado para renderizacao PIX.

Tambem nesta fase:

- Hardening de rotinas privilegiadas no banco (`Locked privileged DB routines`)
- Service role apenas em `client.server.ts`

---

## Resultado de negocio

Login funciona mesmo se OAuth falhar. Backend de pagamento existe para checkout PIX e webhooks das sprints seguintes.
