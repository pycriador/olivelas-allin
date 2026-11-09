# Sprint 6 — Checkout, PIX e Integração com Gateways de Pagamento

## Objetivo

Continuar o desenvolvimento da plataforma **RaffleHub**.

Nesta Sprint implementar o fluxo completo de Checkout para campanhas configuradas no modo automático e criar uma arquitetura de pagamentos baseada em gateways, permitindo integração com:

- InfinityPay
- Mercado Pago
- PagBank

O sistema deverá utilizar **PIX como principal método de pagamento** nesta primeira versão.

A arquitetura deve ser preparada para futuramente suportar cartão de crédito, cartão de débito e outros métodos sem necessidade de reconstruir o checkout.

---

# IMPORTANTE

Antes de implementar qualquer código:

1. Revisar a arquitetura existente das Sprints 1 a 5.
2. Reutilizar `Orders`, `OrderItems`, `Customers`, `Campaigns`, `CampaignNumbers` e reservas existentes.
3. Não criar um segundo sistema de pedidos.
4. Não duplicar lógica de reserva.
5. Não duplicar lógica de clientes.
6. Não espalhar código específico dos gateways pelo frontend.
7. Criar uma camada de abstração para pagamentos.

O checkout deve utilizar a mesma entidade `Order` já criada.

---

# Escopo

Implementar:

- Checkout
- Resumo da compra
- Identificação do comprador
- Validação dos números
- Reserva dos números
- Criação do pagamento
- PIX
- QR Code
- Pix Copia e Cola
- Integração InfinityPay
- Integração Mercado Pago
- Integração PagBank
- Seleção/configuração do gateway
- Histórico de pagamentos
- Status de pagamento
- Tela de pagamento
- Tratamento de erros
- Expiração do pagamento
- Preparação para Webhooks

---

# Não implementar nesta Sprint

Não implementar:

- Sorteio
- Premiação
- Programa de afiliados
- Cupons
- Cashback
- Assinaturas
- Parcelamento
- Relatórios financeiros avançados

O foco é exclusivamente Checkout + PIX + infraestrutura de pagamentos.

---

# Arquitetura de Pagamentos

Criar uma camada abstrata.

Utilizar o conceito:

```text
PaymentGateway
```

Criar interface comum para todos os provedores.

Exemplo conceitual:

```text
createPayment()

getPaymentStatus()

cancelPayment()

refundPayment()

generatePix()

```

Cada gateway deverá implementar essa interface.

---

# Gateways

Criar adaptadores independentes:

```text
InfinityPayGateway

MercadoPagoGateway

PagBankGateway
```

Não colocar código específico desses provedores dentro de:

- Checkout
- Campaign
- Order
- NumberGrid
- CustomerPicker

---

# Seleção do Gateway

O administrador poderá configurar o gateway da campanha.

Opções:

```text
INFINITYPAY

MERCADO_PAGO

PAGBANK
```

Também permitir configurar um gateway padrão global.

Hierarquia:

```text
Configuração da campanha

↓

se não existir

↓

Configuração global

↓

Gateway padrão
```

---

# Configuração Global

Criar:

```text
Configurações
>
Pagamentos
```

Somente `GLOBAL_ADMIN`.

Permitir cadastrar:

### InfinityPay

```text
enabled

environment

client_id

client_secret

api_key

webhook_secret
```

### Mercado Pago

```text
enabled

environment

access_token

public_key

webhook_secret
```

### PagBank

```text
enabled

environment

client_id

client_secret

certificate/configuração necessária

webhook_secret
```

---

# Segurança das Credenciais

NUNCA armazenar secrets diretamente no frontend.

NUNCA expor:

```text
client_secret

access_token

api_key

webhook_secret
```

ao navegador.

As credenciais devem ser armazenadas utilizando mecanismo seguro do backend/Lovable Cloud.

O frontend deve receber somente informações públicas necessárias.

---

# Ambientes

Suportar:

```text
SANDBOX

PRODUCTION
```

Nunca misturar credenciais de ambientes.

Mostrar claramente no painel:

```text
🟡 Sandbox
```

ou

```text
🟢 Produção
```

---

# Teste de Conexão

Adicionar botão:

```text
Testar conexão
```

O sistema deverá verificar se as credenciais estão funcionando.

Resultado:

```text
✓ Conexão realizada com sucesso
```

ou

```text
✕ Não foi possível conectar
```

Nunca mostrar secrets no erro.

---

# Configuração da Campanha

Adicionar em:

```text
Campanha
>
Configurações
>
Pagamento
```

Campos:

```text
Modo de compra

MANUAL

AUTOMATIC
```

Quando:

```text
MANUAL
```

Utilizar WhatsApp.

Quando:

```text
AUTOMATIC
```

Utilizar Checkout.

---

# Gateway

Permitir selecionar:

```text
Gateway padrão

InfinityPay

Mercado Pago

PagBank
```

---

# Métodos de Pagamento

Nesta Sprint:

```text
PIX
```

Preparar estrutura para:

```text
CREDIT_CARD

DEBIT_CARD

BOLETO
```

mas não implementar esses métodos agora.

---

# Fluxo do Cliente

Campanha:

```text
/r/{slug}
```

Cliente seleciona números.

↓

Sistema valida disponibilidade.

↓

Cliente clica:

```text
Comprar
```

↓

Criar/atualizar Order.

↓

Criar reserva.

↓

Ir para:

```text
/checkout/{order_id}
```

---

# Checkout

Criar página moderna.

Mostrar:

```text
Resumo da campanha

Produto

Imagem da capa

Números selecionados

Quantidade

Valor unitário

Subtotal

Desconto

Total
```

---

# Cliente

Utilizar `CustomerPicker` quando aplicável.

Para comprador público, permitir:

```text
Nome

Telefone

Email
```

Nome e telefone obrigatórios.

Email recomendado.

Validar telefone.

Validar email quando informado.

---

# Aceites

Adicionar:

```text
☐ Li e aceito os termos da campanha

☐ Concordo com a política de privacidade
```

Não permitir finalizar sem aceitar.

---

# Resumo

Exemplo:

```text
Campanha

iPhone 17 Pro

Números

001
015
088
120

4 números

R$ 10,00 cada

Total

R$ 40,00
```

---

# Confirmar Pedido

Botão:

```text
Continuar para pagamento
```

Antes de criar pagamento:

1. Validar campanha.
2. Validar status.
3. Validar números.
4. Validar reservas.
5. Validar cliente.
6. Validar gateway.
7. Criar pagamento.

---

# Concorrência

A validação deverá ocorrer novamente no backend.

Nunca confiar apenas no frontend.

Caso algum número tenha sido adquirido por outro usuário:

```text
Não foi possível concluir a compra.

Os seguintes números não estão mais disponíveis:

015
088
```

Atualizar a grade.

---

# Reserva

Quando o cliente iniciar checkout:

```text
AVAILABLE

↓

RESERVED

↓

Order criado
```

Definir:

```text
reservation_token

reserved_until
```

---

# Tempo de Reserva

Utilizar configuração da campanha.

Exemplo:

```text
15 minutos
```

Durante esse período:

```text
Reserva ativa

Pagamento pendente
```

Após expiração:

```text
RESERVED

↓

AVAILABLE
```

e:

```text
Order

↓

EXPIRED
```

---

# Modelo de Pagamento

Criar tabela:

## payments

Campos:

```text
id

order_id

campaign_id

customer_id

gateway

gateway_payment_id

gateway_order_id

method

status

amount

currency

pix_qr_code

pix_copy_paste

expires_at

paid_at

cancelled_at

refunded_at

failure_code

failure_message

metadata

created_at

updated_at
```

---

# Status do Payment

Criar enum:

```text
CREATED

PENDING

WAITING_PAYMENT

PAID

FAILED

CANCELLED

EXPIRED

REFUNDED
```

---

# Status do Order

Revisar os existentes.

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

---

# Relação

```text
Customer

    ↓

Order

    ↓

OrderItems

    ↓

CampaignNumbers

    ↓

Payment
```

Um Order poderá possuir mais de uma tentativa de pagamento.

Não sobrescrever pagamentos anteriores.

---

# Tentativas de Pagamento

Exemplo:

```text
Order #100

Payment #1

Mercado Pago

FAILED

↓

Payment #2

PagBank

WAITING_PAYMENT

↓

Payment #3

InfinityPay

PAID
```

Manter histórico.

---

# PIX

Após criação do pagamento:

Mostrar:

```text
QR Code

Pix Copia e Cola

Valor

Tempo restante
```

---

# Tela PIX

Criar:

```text
/checkout/{order_id}/pix
```

Mostrar:

```text
Pagamento via PIX

R$ 120,00

QR CODE

[ Copiar Pix Copia e Cola ]

Expira em:

14:32
```

---

# Copiar PIX

Botão:

```text
Copiar código PIX
```

Mostrar feedback:

```text
Código PIX copiado.
```

---

# Status

Mostrar:

```text
Aguardando pagamento
```

Atualizar automaticamente quando o backend receber confirmação do gateway.

---

# NÃO confiar somente no frontend

Nunca marcar um pedido como:

```text
PAID
```

somente porque o frontend recebeu uma resposta positiva.

A confirmação final deverá ocorrer através da infraestrutura segura do gateway/backend.

---

# Webhooks

Criar arquitetura preparada para Webhooks.

Nesta Sprint implementar a infraestrutura necessária para receber eventos dos gateways quando a API/documentação de cada provedor permitir.

Criar endpoint conceitual:

```text
/api/payments/webhook/{gateway}
```

Validar assinatura do webhook quando suportado.

Nunca confiar apenas no payload recebido.

---

# Idempotência

Implementar obrigatoriamente.

Um mesmo evento de pagamento poderá chegar várias vezes.

O sistema não pode:

- criar dois pagamentos;
- marcar duas vezes;
- duplicar pedido;
- duplicar receita;
- liberar números pagos.

Utilizar identificador único do evento.

---

# Fluxo de Confirmação

Quando o pagamento for confirmado:

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
CampaignNumber

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

Quando pagamento confirmado:

Atualizar automaticamente:

- Checkout
- Status do pedido
- Número
- Grade
- Dashboard
- Percentual vendido
- Receita recebida

Sem refresh.

---

# Percentual Vendido

Continuar utilizando:

```text
PAID / TOTAL × 100
```

Considerar:

- vendas manuais pagas;
- vendas online pagas.

Não considerar:

- reservas;
- pagamentos pendentes;
- pagamentos expirados;
- pedidos cancelados.

---

# Dashboard

Adicionar:

```text
Vendas Online

Vendas Manuais

Pagamentos Pendentes

Pagamentos Confirmados

Pagamentos Expirados

Pagamentos Falhos

Receita Recebida

Receita Pendente
```

---

# Página do Pedido

Criar:

```text
/orders/{order_id}
```

Mostrar:

Cliente

Campanha

Números

Valor

Origem

Status

Pagamento

Histórico

---

# Histórico do Pagamento

Mostrar:

```text
Pedido criado

Reserva criada

Pagamento criado

PIX gerado

Pagamento aguardando

Pagamento confirmado
```

---

# Falha de Pagamento

Mostrar mensagem amigável.

Exemplo:

```text
Não foi possível gerar o pagamento.

Seus números continuam reservados até:

14:32
```

Permitir:

```text
Tentar novamente
```

---

# Gateway indisponível

Caso o gateway esteja indisponível:

```text
O pagamento está temporariamente indisponível.

Tente novamente em alguns instantes.
```

Não mostrar detalhes internos.

Registrar erro nos logs.

---

# Troca de Gateway

O administrador poderá alterar o gateway da campanha.

Novos pedidos utilizarão a nova configuração.

Pedidos existentes não deverão mudar automaticamente de gateway.

O Payment existente continuará vinculado ao gateway original.

---

# Cancelamento

Se o pedido for cancelado antes do pagamento:

```text
Payment

↓

CANCELLED
```

```text
Order

↓

CANCELLED
```

```text
Numbers

↓

AVAILABLE
```

---

# Expiração

Se o PIX expirar:

```text
Payment

↓

EXPIRED
```

```text
Order

↓

EXPIRED
```

```text
Numbers

↓

AVAILABLE
```

---

# Retry

Permitir criar nova tentativa de pagamento.

Nunca reutilizar o Payment anterior.

Criar um novo registro.

---

# Segurança

Implementar:

- RLS
- Validação server-side
- Idempotência
- Rate limiting
- Sanitização
- Validação de valores
- Validação de campanha
- Validação de números
- Proteção contra manipulação de preço

O valor do pedido deverá ser calculado no backend.

Nunca confiar no valor enviado pelo frontend.

---

# Regra crítica de preço

O frontend poderá enviar:

```text
números selecionados
```

mas nunca deverá ser a fonte de verdade para:

```text
unit_price

subtotal

total
```

O backend deverá obter:

```text
campaign.price_per_number
```

e recalcular:

```text
total = quantity × unit_price
```

---

# Proteção contra alteração de campanha

Se o administrador alterar o valor do número depois de uma reserva:

Pedidos já criados deverão manter o preço original do pedido.

Não recalcular pedidos existentes.

---

# Moeda

Inicialmente:

```text
BRL
```

Preparar estrutura para outras moedas no futuro.

---

# Logs

Registrar erros estruturados.

Informações:

```text
gateway

order_id

payment_id

campaign_id

customer_id

event

status

error_code

timestamp
```

Nunca registrar:

```text
access_token

client_secret

api_key

webhook_secret
```

---

# Painel Administrativo de Pagamentos

Criar:

```text
Administração

>

Pagamentos
```

Mostrar:

Pedido

Cliente

Campanha

Gateway

Método

Valor

Status

Data

---

# Filtros

Gateway

Status

Campanha

Período

Cliente

Pedido

---

# Detalhes

Ao abrir um pagamento:

Mostrar:

Gateway

Payment ID externo

Order ID

Valor

Status

Datas

Tentativas

Eventos

Erros

Nunca mostrar secrets.

---

# Configuração de Gateway por Campanha

Na tela:

```text
Campanha

>

Configurações

>

Pagamento
```

Mostrar:

```text
Modo:

Manual
Automático
```

Quando Automático:

```text
Gateway:

InfinityPay
Mercado Pago
PagBank
```

Mostrar somente gateways habilitados.

---

# Validação de Publicação

Uma campanha com:

```text
Purchase Mode = AUTOMATIC
```

não poderá ser publicada se:

- nenhum gateway estiver configurado;
- gateway estiver desabilitado;
- credenciais não forem válidas;
- método PIX não estiver habilitado.

Campanhas:

```text
MANUAL
```

continuam funcionando normalmente via WhatsApp.

---

# Compatibilidade com Sprint 4

Não quebrar:

- Venda Manual
- WhatsApp
- Customer Picker
- Number Grid
- Reservas
- Campaign Operations
- Dashboard
- Exportação
- Gerenciamento de imagens
- Publicação

---

# Compatibilidade com Venda Manual

Pedidos manuais continuarão funcionando.

Exemplo:

```text
Order

source = MANUAL

status = PAID

payment_method = PIX
```

Não criar Payment Gateway automaticamente para vendas manuais.

---

# Compatibilidade com WhatsApp

Pedidos WhatsApp continuarão funcionando:

```text
source = WHATSAPP

status = WAITING_CONTACT
```

Sem checkout automático.

---

# Fluxo Completo

## Manual

```text
Campanha

↓

Selecionar números

↓

WhatsApp

↓

Order

↓

Administrador confirma

↓

PAID
```

---

## Online

```text
Campanha

↓

Selecionar números

↓

Comprar

↓

Order

↓

Reserva

↓

Checkout

↓

PIX

↓

Gateway

↓

Pagamento confirmado

↓

PAID

↓

Número vendido
```

---

# Componentes

Criar:

```text
CheckoutPage

CheckoutSummary

CustomerCheckoutForm

PaymentMethodSelector

PaymentGatewaySelector

PixPayment

PixQRCode

PixCopyPaste

PaymentStatus

PaymentTimer

PaymentError

OrderSummary

PaymentHistory

GatewaySettings

PaymentAdminTable
```

---

# Services

Criar camada:

```text
PaymentService

OrderPaymentService

ReservationService

GatewayFactory
```

E adaptadores:

```text
InfinityPayAdapter

MercadoPagoAdapter

PagBankAdapter
```

---

# Hooks

Criar:

```text
useCheckout()

usePayment()

usePixPayment()

usePaymentStatus()

usePaymentTimer()

usePaymentGateway()
```

---

# UX

O checkout deverá ser extremamente simples.

Não adicionar informações desnecessárias.

Priorizar:

1. Campanha
2. Números
3. Cliente
4. Total
5. PIX
6. Pagamento

---

# Mobile First

O checkout deverá ser especialmente otimizado para celular.

A maior parte dos compradores deverá conseguir:

```text
Selecionar números

↓

Informar telefone

↓

Pagar PIX
```

sem precisar utilizar desktop.

---

# Acessibilidade

Garantir:

- contraste adequado;
- navegação por teclado;
- labels;
- aria-labels;
- foco visível;
- mensagens acessíveis;
- botões com tamanho adequado para mobile.

---

# Performance

Utilizar:

- TanStack Query
- Cache
- Realtime
- Lazy Loading
- Debounce
- Memoização

Evitar polling agressivo.

Quando possível, utilizar Realtime/Webhooks para atualização do pagamento.

---

# Testes

Criar testes para:

### Checkout

- campanha válida;
- campanha encerrada;
- números disponíveis;
- números indisponíveis;
- reserva expirada;
- cliente válido;
- cliente inválido.

### Pagamento

- pagamento criado;
- PIX criado;
- pagamento pendente;
- pagamento confirmado;
- pagamento recusado;
- pagamento expirado;
- cancelamento;
- retry.

### Concorrência

Testar dois usuários tentando comprar o mesmo número.

Somente um deverá conseguir.

### Idempotência

Enviar o mesmo evento várias vezes.

Resultado esperado:

```text
Um único pagamento confirmado.
```

---

# Testes de Gateway

Cada gateway deverá possuir testes isolados.

Não permitir que um erro do InfinityPay afete Mercado Pago ou PagBank.

---

# Definition of Done

A Sprint somente será considerada concluída quando:

- Checkout estiver funcionando para campanhas `AUTOMATIC`.
- Campanhas `MANUAL` continuarem funcionando sem alterações negativas.
- Cliente puder selecionar números e iniciar checkout.
- O sistema criar corretamente Order e reserva.
- O valor for calculado no backend.
- PIX puder ser gerado pelo gateway configurado.
- QR Code e Pix Copia e Cola forem exibidos corretamente.
- O status do pagamento puder ser atualizado com segurança.
- Orders pagos mudarem para `PAID`.
- Números pagos mudarem para `PAID`.
- Reservas expiradas forem liberadas.
- Pagamentos expirados não deixarem números presos.
- Tentativas de pagamento forem armazenadas separadamente.
- Idempotência estiver implementada.
- Gateway Factory estiver funcionando.
- InfinityPay estiver isolado em seu adapter.
- Mercado Pago estiver isolado em seu adapter.
- PagBank estiver isolado em seu adapter.
- Secrets nunca forem expostos no frontend.
- RLS estiver funcionando.
- Realtime atualizar campanha e dashboard.
- O percentual vendido considerar vendas manuais e online.
- Não houver duplicação de Orders ou pagamentos.
- Não houver inconsistências entre Order, Payment e CampaignNumber.
- Não existirem erros de TypeScript, ESLint ou warnings críticos.

---

# Regra arquitetural final

Não implementar integrações de pagamento diretamente nos componentes React.

O fluxo obrigatório deverá ser:

```text
React

↓

Checkout Service

↓

Payment Service

↓

Gateway Factory

↓

Gateway Adapter

↓

Edge Function / Backend

↓

Gateway externo
```

Nunca:

```text
React

↓

Mercado Pago API
```

ou:

```text
React

↓

PagBank API
```

ou:

```text
React

↓

InfinityPay API
```

As credenciais e operações sensíveis deverão permanecer no backend.

A arquitetura deve permitir adicionar um quarto gateway no futuro simplesmente criando um novo adapter, sem alterar o Checkout.
