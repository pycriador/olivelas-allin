# Sprint 11 — Gestão Avançada da Campanha + Participantes

## Objetivo

Continuar o desenvolvimento da plataforma **RaffleHub**.

As Sprints anteriores implementaram:

- Login Google
- GLOBAL_ADMIN
- Usuários
- Campanhas
- Produtos
- Imagens
- Capa da campanha
- Compartilhamento
- Números
- Reservas
- Vendas manuais
- Checkout
- PIX
- InfinityPay
- Mercado Pago
- PagBank
- Webhooks
- Conciliação
- Notificações
- Sorteio
- Apuração
- Auditoria
- Dashboard Executivo
- Relatórios
- Exportação CSV

Nesta Sprint melhorar significativamente a gestão operacional das campanhas e dos participantes.

O objetivo é permitir que o administrador consiga responder facilmente:

- Quem participou desta campanha?
- Quais números essa pessoa comprou?
- Quantos números possui?
- Quanto já pagou?
- Qual pedido originou cada número?
- A compra foi manual ou online?
- Qual é o status da compra?
- Como entrar em contato com o participante?
- Quais participantes possuem pagamentos pendentes?
- Quais números estão vinculados a cada participante?
- Existe histórico de alterações?
- Posso editar corretamente um cadastro ou corrigir uma venda manual?

---

# PRINCÍPIO PRINCIPAL

Não criar um segundo cadastro de participante separado do cadastro de Customer já existente.

Utilizar o domínio atual:

```text
Customer
   ↓
Order
   ↓
Order Items / Numbers
   ↓
Campaign
```
