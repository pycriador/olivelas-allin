# Sprint 7 — Webhooks, Confirmação Automática, Conciliação e Recuperação de Pagamentos

## Objetivo

Continuar o desenvolvimento da plataforma **RaffleHub**.

A Sprint 6 implementou o Checkout, PIX e a arquitetura de integração com:

- InfinityPay
- Mercado Pago
- PagBank

Nesta Sprint o objetivo é tornar o fluxo de pagamento confiável e consistente de ponta a ponta.

Implementar:

- Webhooks
- Confirmação automática
- Idempotência
- Conciliação
- Reconciliação automática
- Expiração de reservas
- Recuperação de pagamentos
- Reprocessamento de eventos
- Histórico de eventos
- Comprovante de pagamento
- Dashboard financeiro
- Auditoria financeira

---

# REGRA PRINCIPAL

A confirmação de um pagamento deverá ser baseada em uma confirmação confiável do gateway.

NUNCA marcar um pedido como `PAID` apenas porque:

- o frontend voltou para a página de sucesso;
- o cliente fechou o QR Code;
- o cliente clicou em "já paguei";
- a criação do PIX retornou sucesso;
- uma informação enviada pelo navegador indica pagamento.

O estado definitivo deverá ser confirmado pelo backend através do gateway e/ou webhook confiável.

---

# Fluxo Oficial

O fluxo deverá ser:

```text
Cliente
   ↓
Checkout
   ↓
Order
   ↓
Reservation
   ↓
Payment
   ↓
Gateway
   ↓
PIX
   ↓
Cliente paga
   ↓
Gateway confirma
   ↓
Webhook
   ↓
Backend valida evento
   ↓
Payment = PAID
   ↓
Order = PAID
   ↓
Campaign Numbers = PAID
   ↓
Dashboard atualizado
   ↓
Realtime
```

---

# Máquina de Estados

## Payment

Utilizar:

```text
CREATED
WAITING_PAYMENT
PAID
FAILED
CANCELLED
EXPIRED
REFUNDED
```

Evitar transições inválidas.

Exemplo:

```text
PAID
```

não pode voltar para:

```text
WAITING_PAYMENT
```

sem uma operação explícita e autorizada.

---

# Order

Utilizar:

```text
OPEN
WAITING_CONTACT
WAITING_PAYMENT
PAID
CANCELLED
EXPIRED
REFUNDED
```

Garantir consistência entre:

```text
Order
Payment
CampaignNumbers
```

---

# Campaign Numbers

Estados:

```text
AVAILABLE
RESERVED
PAID
BLOCKED
CANCELLED
```

Fluxo online:

```text
AVAILABLE
    ↓
RESERVED
    ↓
PAID
```

Se pagamento expirar:

```text
RESERVED
    ↓
AVAILABLE
```

---

# Webhooks

Criar infraestrutura:

```text
/api/payments/webhook/{gateway}
```

Gateways:

```text
/api/payments/webhook/infinitypay

/api/payments/webhook/mercadopago

/api/payments/webhook/pagbank
```

Cada gateway deverá possuir processamento independente.

---

# Segurança do Webhook

Validar assinatura ou mecanismo de autenticação disponibilizado pelo gateway.

Nunca confiar apenas no corpo da requisição.

Validar:

- origem;
- assinatura;
- evento;
- payment ID;
- valor;
- moeda;
- pedido;
- status.

Nunca aceitar um webhook que tente alterar um pedido arbitrariamente.

---

# Idempotência

Implementar obrigatoriamente.

O mesmo evento poderá ser recebido várias vezes.

Criar estrutura:

```text
payment_events
```

Campos:

```text
id

gateway

event_id

event_type

payment_id

order_id

payload_hash

payload

received_at

processed_at

processing_status

error_message

created_at
```

Criar índice único:

```text
gateway + event_id
```

O mesmo evento nunca deverá ser processado duas vezes.

---

# Payment Events

Registrar:

```text
PAYMENT_CREATED

PAYMENT_PENDING

PAYMENT_PAID

PAYMENT_FAILED

PAYMENT_CANCELLED

PAYMENT_EXPIRED

PAYMENT_REFUNDED

WEBHOOK_RECEIVED

WEBHOOK_PROCESSED

WEBHOOK_FAILED

PAYMENT_RECONCILED
```

---

# Processamento do Webhook

Fluxo:

```text
Webhook recebido
        ↓
Validar assinatura
        ↓
Identificar gateway
        ↓
Identificar evento
        ↓
Verificar idempotência
        ↓
Validar Payment
        ↓
Consultar gateway quando necessário
        ↓
Validar valor
        ↓
Validar Order
        ↓
Atualizar Payment
        ↓
Atualizar Order
        ↓
Atualizar Campaign Numbers
        ↓
Registrar auditoria
        ↓
Realtime
```

---

# Validação de Valor

Nunca confiar apenas no valor enviado no webhook.

Comparar:

```text
Payment.amount

Order.total

Gateway.amount
```

Os valores deverão ser compatíveis.

Se houver divergência:

```text
PAYMENT_REVIEW_REQUIRED
```

Não marcar automaticamente como pago.

Registrar alerta administrativo.

---

# Validação do Pedido

Antes de marcar como pago:

Verificar:

- Order existe;
- Payment existe;
- Campaign existe;
- números pertencem ao Order;
- Order não está cancelado;
- Payment ainda não está pago;
- valor é correto.

---

# Proteção contra pagamento duplicado

Se um pedido já estiver:

```text
PAID
```

um novo webhook não poderá gerar:

- novo pedido;
- nova receita;
- nova venda;
- nova alteração nos números.

Registrar apenas o evento.

---

# Pagamento confirmado

Quando o gateway confirmar:

```text
Payment

WAITING_PAYMENT
        ↓
PAID
```

```text
Order

WAITING_PAYMENT
        ↓
PAID
```

```text
Campaign Numbers

RESERVED
        ↓
PAID
```

Registrar:

```text
paid_at
```

---

# Realtime

Ao confirmar pagamento atualizar automaticamente:

- Checkout;
- página de confirmação;
- pedido;
- campanha;
- grade de números;
- dashboard;
- percentual vendido;
- receita recebida.

Não exigir refresh manual.

---

# Expiração de Reserva

Criar processo automático.

Quando:

```text
reserved_until < now()
```

e:

```text
Payment != PAID
```

executar:

```text
Campaign Numbers

RESERVED
        ↓
AVAILABLE
```

e:

```text
Order

WAITING_PAYMENT
        ↓
EXPIRED
```

```text
Payment

WAITING_PAYMENT
        ↓
EXPIRED
```

---

# Proteção contra Race Condition

Antes de liberar números:

Verificar novamente se o pagamento foi confirmado.

Nunca liberar números se:

```text
Payment = PAID
```

Mesmo que a reserva tenha ultrapassado o horário previsto.

---

# Job de Expiração

Criar mecanismo agendado no Lovable Cloud.

Executar periodicamente.

O processo deverá ser idempotente.

Executar novamente não poderá causar inconsistência.

---

# Recuperação de Pagamentos

Criar mecanismo para identificar:

```text
Gateway = PAID
RaffleHub = WAITING_PAYMENT
```

e:

```text
Gateway = EXPIRED
RaffleHub = WAITING_PAYMENT
```

e:

```text
Gateway = CANCELLED
RaffleHub = WAITING_PAYMENT
```

---

# Reconciliação

Criar serviço:

```text
PaymentReconciliationService
```

Responsável por comparar:

```text
RaffleHub

versus

Gateway
```

---

# Conciliação Automática

Executar periodicamente.

Consultar pagamentos recentes.

Comparar:

```text
status

amount

currency

payment_id

order_id
```

Se tudo estiver correto:

```text
RECONCILED
```

---

# Divergência

Se houver divergência:

```text
REVIEW_REQUIRED
```

Não alterar automaticamente valores financeiros quando houver inconsistência.

---

# Tela Administrativa

Criar:

```text
Administração

>

Pagamentos

>

Conciliação
```

---

# Dashboard de Conciliação

Mostrar:

```text
Pagamentos conciliados

Pagamentos pendentes

Pagamentos divergentes

Webhooks processados

Webhooks com erro

Pagamentos expirados

Pagamentos pagos
```

---

# Filtros

Permitir filtrar por:

- Campanha
- Gateway
- Status
- Período
- Cliente
- Pedido
- Payment ID
- Divergência

---

# Detalhes do Pagamento

Mostrar:

```text
Pedido

Cliente

Campanha

Números

Gateway

Payment ID externo

Order ID externo

Valor

Moeda

Status interno

Status gateway

Criado em

Pago em

Expirado em
```

---

# Histórico

Mostrar timeline:

```text
Pedido criado
        ↓
Reserva criada
        ↓
Pagamento criado
        ↓
PIX gerado
        ↓
Webhook recebido
        ↓
Pagamento confirmado
        ↓
Números confirmados
```

---

# Reprocessamento

Adicionar:

```text
Reprocessar Webhook
```

Somente `GLOBAL_ADMIN`.

Antes de executar:

```text
Tem certeza que deseja reprocessar este evento?
```

O processamento deverá continuar sendo idempotente.

---

# Reprocessamento de Pagamento

Adicionar:

```text
Consultar novamente no gateway
```

Utilizar quando:

```text
Payment = WAITING_PAYMENT
```

e houver suspeita de inconsistência.

Nunca criar um novo pagamento automaticamente.

---

# Retry de Pagamento

Quando o pagamento falhar ou expirar:

Permitir:

```text
Tentar novamente
```

Criar novo Payment.

Nunca reutilizar o Payment anterior.

Exemplo:

```text
Payment #1
EXPIRED

↓

Payment #2
WAITING_PAYMENT
```

Manter histórico completo.

---

# Comprovante

Criar:

```text
/confirmation/{order_id}
```

Mostrar:

```text
✓ Pagamento confirmado

Campanha

Produto

Números

Quantidade

Valor

Gateway

Código do pedido

Data do pagamento
```

---

# Compartilhamento

Adicionar:

```text
Compartilhar comprovante
```

Utilizar Web Share API quando disponível.

Fallback:

```text
Copiar link
```

---

# Download

Permitir:

```text
Baixar comprovante
```

Preparar estrutura para PDF.

Nesta Sprint pode ser implementado um comprovante visual responsivo, desde que não comprometa o escopo principal.

---

# Comunicação

Preparar eventos:

```text
PAYMENT_CONFIRMED
PAYMENT_EXPIRED
PAYMENT_FAILED
```

Esses eventos deverão permitir futuramente:

```text
WhatsApp

Email
```

Não implementar envio automático de mensagens nesta Sprint.

---

# Dashboard Financeiro

Evoluir o dashboard.

Mostrar:

```text
Receita recebida

Receita pendente

Receita expirada

Receita cancelada

Vendas online

Vendas manuais

Pagamentos confirmados

Pagamentos pendentes

Pagamentos expirados

Pagamentos falhos
```

---

# Regra dos Indicadores

Não considerar reserva como venda.

Somente:

```text
CampaignNumber = PAID
```

deve entrar como número vendido.

---

# Receita

Receita recebida:

```text
SUM(PAID payments)
```

Receita pendente:

```text
SUM(WAITING_PAYMENT payments)
```

Não incluir:

```text
EXPIRED

CANCELLED

FAILED
```

na receita recebida.

---

# Vendas Manuais

Continuar funcionando normalmente.

Exemplo:

```text
Order.source = MANUAL
Order.status = PAID
```

Essas vendas devem aparecer nos indicadores de:

```text
Vendas Manuais
```

e:

```text
Receita Recebida
```

---

# Vendas Online

Identificar:

```text
Order.source = ONLINE
```

Separar nos indicadores.

---

# Auditoria

Registrar:

```text
PAYMENT_CREATED

PAYMENT_STATUS_CHANGED

PAYMENT_PAID

PAYMENT_FAILED

PAYMENT_EXPIRED

PAYMENT_CANCELLED

PAYMENT_REFUNDED

WEBHOOK_RECEIVED

WEBHOOK_PROCESSED

WEBHOOK_FAILED

PAYMENT_RECONCILED

PAYMENT_REVIEW_REQUIRED

RESERVATION_EXPIRED

NUMBERS_RELEASED
```

Registrar:

```text
user_id

order_id

payment_id

campaign_id

event

old_status

new_status

timestamp

metadata
```

Nunca registrar secrets.

---

# Alertas Administrativos

Criar área:

```text
Alertas Financeiros
```

Exibir:

- pagamentos divergentes;
- webhook falho;
- valor divergente;
- pagamento confirmado sem Order;
- Order pago sem números;
- número pago sem Payment;
- pagamentos presos em estado intermediário.

---

# Integridade

Criar verificações automáticas.

Detectar situações como:

```text
Payment = PAID
Order != PAID
```

ou:

```text
Order = PAID
CampaignNumber != PAID
```

ou:

```text
CampaignNumber = PAID
Payment != PAID
```

Essas situações deverão gerar alerta.

Não corrigir automaticamente sem regra segura.

---

# Reconciliação Manual

O administrador poderá abrir uma divergência.

Mostrar:

```text
Estado RaffleHub

versus

Estado Gateway
```

Permitir ação controlada:

```text
Sincronizar com Gateway
```

ou:

```text
Marcar para revisão
```

Operações críticas devem exigir confirmação.

---

# Segurança

Manter:

- RLS;
- autenticação;
- autorização;
- validação server-side;
- idempotência;
- rate limiting;
- sanitização;
- logs;
- proteção de secrets.

---

# Secrets

Nunca mostrar:

```text
access_token

client_secret

api_key

webhook_secret
```

em:

- frontend;
- logs;
- mensagens de erro;
- auditoria;
- respostas de API.

---

# Gateway

Continuar utilizando:

```text
PaymentGateway

InfinityPayAdapter

MercadoPagoAdapter

PagBankAdapter
```

O processamento de Webhook também deverá ser isolado por gateway.

---

# Componentes

Criar:

```text
PaymentReconciliationPage

PaymentReconciliationTable

PaymentDetails

PaymentTimeline

WebhookEventTable

WebhookEventDetails

FinancialAlerts

PaymentStatusBadge

PaymentConfirmation

PaymentReceipt
```

---

# Services

Criar:

```text
PaymentWebhookService

PaymentReconciliationService

PaymentExpirationService

PaymentRecoveryService

PaymentIntegrityService
```

---

# Jobs

Criar processos para:

```text
expireReservations()

reconcilePayments()

detectPaymentInconsistencies()
```

Todos devem ser seguros para execução repetida.

---

# Testes

## Webhook

Testar:

- webhook válido;
- webhook inválido;
- assinatura inválida;
- evento duplicado;
- evento fora de ordem;
- pagamento inexistente;
- pedido inexistente;
- valor divergente;
- gateway indisponível.

---

# Testes de Idempotência

Enviar o mesmo webhook:

```text
1 vez

5 vezes

10 vezes
```

Resultado:

```text
Uma única alteração financeira.
```

---

# Testes de Concorrência

Simular:

```text
Pagamento confirmado

+

Expiração da reserva

ao mesmo tempo.
```

Resultado esperado:

Se o pagamento estiver confirmado:

```text
Numbers = PAID
```

Nunca:

```text
AVAILABLE
```

---

# Testes de Recuperação

Simular:

```text
Gateway = PAID
RaffleHub = WAITING_PAYMENT
```

Executar reconciliação.

Resultado:

```text
RaffleHub = PAID
```

---

# Teste inverso

Simular:

```text
Gateway = EXPIRED
RaffleHub = WAITING_PAYMENT
```

Resultado:

```text
Payment = EXPIRED

Order = EXPIRED

Numbers = AVAILABLE
```

---

# Regressão

Validar que continuam funcionando:

- Login Google;
- Admin Global;
- usuários;
- campanhas;
- clientes;
- CustomerPicker;
- venda manual;
- reservas;
- seleção de números;
- edição de vendas;
- exclusão de vendas;
- WhatsApp;
- gerenciamento de imagens;
- capa;
- galeria;
- compartilhamento;
- exportação da grade;
- configurações;
- publicação;
- checkout.

Nenhuma funcionalidade anterior poderá sofrer regressão.

---

# Performance

Evitar:

- polling excessivo;
- queries duplicadas;
- processamento repetido;
- consultas desnecessárias ao gateway.

Utilizar:

- jobs;
- cache;
- Realtime;
- TanStack Query;
- índices apropriados.

---

# Banco de Dados

Revisar índices.

Criar índices para:

```text
payments.order_id

payments.gateway

payments.status

payments.created_at

payments.gateway_payment_id

payment_events.gateway

payment_events.event_id

payment_events.payment_id

payment_events.processing_status
```

Garantir constraints e foreign keys.

---

# RLS

Revisar todas as políticas.

Usuários comuns não poderão:

- alterar pagamentos;
- reprocessar webhooks;
- reconciliar pagamentos;
- alterar status;
- acessar secrets.

Somente `GLOBAL_ADMIN` poderá executar operações administrativas críticas.

---

# Definition of Done

A Sprint somente será considerada concluída quando:

- Webhooks dos gateways estiverem estruturados e funcionando conforme as APIs disponíveis.
- Eventos forem validados no backend.
- Idempotência estiver implementada.
- Um mesmo webhook não puder gerar duas alterações financeiras.
- Pagamentos confirmados atualizarem Order e Campaign Numbers corretamente.
- Reservas expiradas forem liberadas automaticamente.
- Pagamentos expirados não deixarem números presos.
- Existir mecanismo de reconciliação.
- Divergências forem detectadas.
- O administrador puder visualizar eventos de webhook.
- O administrador puder reprocessar eventos com segurança.
- Existir histórico completo do pagamento.
- Existir comprovante após pagamento confirmado.
- Dashboard separar corretamente vendas manuais e online.
- Receita recebida considerar somente pagamentos confirmados.
- Existirem alertas para inconsistências financeiras.
- Race conditions críticas forem tratadas.
- RLS estiver funcionando.
- Secrets nunca forem expostos.
- Realtime atualizar os estados corretamente.
- Não existirem erros de TypeScript, ESLint ou warnings críticos.
- Nenhuma funcionalidade das Sprints anteriores sofrer regressão.

---

# Regra Arquitetural Final

O sistema deverá manter a separação:

```text
Frontend
   ↓
Application Services
   ↓
Payment Service
   ↓
Gateway Adapter
   ↓
Gateway
```

Para Webhooks:

```text
Gateway
   ↓
Webhook Endpoint
   ↓
Webhook Validation
   ↓
Payment Webhook Service
   ↓
Payment
   ↓
Order
   ↓
Campaign Numbers
   ↓
Realtime
```

Nunca permitir:

```text
Frontend
   ↓
Payment = PAID
```

O frontend apenas exibe o estado.

O backend é a fonte de verdade para o estado financeiro.

---

# Resultado esperado

Ao final desta Sprint, a RaffleHub deverá possuir um ciclo financeiro confiável:

```text
Selecionar números
       ↓
Reservar
       ↓
Checkout
       ↓
PIX
       ↓
Gateway
       ↓
Pagamento
       ↓
Webhook
       ↓
Validação
       ↓
Conciliação
       ↓
Pedido confirmado
       ↓
Números vendidos
       ↓
Dashboard atualizado
       ↓
Comprovante
```

A plataforma deverá estar preparada para avançar posteriormente para **notificações, comunicação com o comprador e módulo de sorteio**, sem necessidade de alterar a estrutura fundamental de pagamentos.
