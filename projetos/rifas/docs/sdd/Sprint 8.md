# Sprint 8 — Notificações, WhatsApp, E-mail e Comunicação com o Comprador

## Objetivo

Continuar o desenvolvimento da plataforma **RaffleHub**.

As Sprints 6 e 7 implementaram:

- Checkout
- PIX
- Gateways
- Webhooks
- Confirmação de pagamento
- Conciliação
- Expiração de reservas
- Comprovante de pagamento

Nesta Sprint implementar a camada de comunicação com o comprador.

O objetivo é permitir que eventos importantes da campanha, pedido e pagamento possam gerar notificações por:

- WhatsApp
- E-mail

A arquitetura deverá ser orientada a eventos e desacoplada dos módulos de:

- Campaign
- Order
- Payment
- Customer
- Checkout

---

# REGRA ARQUITETURAL

NÃO colocar chamadas de WhatsApp ou E-mail diretamente dentro de:

- PaymentService
- OrderService
- Checkout
- Webhook
- CampaignService

Utilizar:

```text
Business Event
      ↓
Notification Service
      ↓
Notification Provider
      ↓
WhatsApp / Email
```
