Sprint 4.1 — Vendas Manuais, Clientes (CRM) e Fluxo WhatsApp
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

Esta Sprint complementa a Sprint 4.

NÃO implementar meios de pagamento automáticos.

NÃO implementar PIX.

NÃO implementar Mercado Pago.

NÃO implementar PagBank.

NÃO implementar InfinityPay.

Todo o fluxo desta Sprint será baseado em Pedidos (Orders), permitindo que a Sprint 5 reutilize exatamente a mesma arquitetura para os pagamentos automáticos.

Objetivos

Implementar:

Cadastro de Clientes
Pedidos (Orders)
Venda Manual
Reserva via WhatsApp
Cadastro manual de números vendidos
Histórico completo
Gestão administrativa das reservas
Preparação para Checkout da Sprint 5
Arquitetura

Toda venda deverá obrigatoriamente gerar um Order.

Não permitir alterar diretamente o status dos números.

O fluxo correto será:

Order

↓

Atualiza Number

↓

Atualiza Dashboard

↓

Atualiza Auditoria

Toda mudança deve partir do Pedido.

Banco de Dados
customers

Criar tabela

Campos

id

full_name

phone

email

city

notes

created_by

created_at

updated_at

deleted_at
orders

Criar tabela

id

campaign_id

customer_id

reservation_token

source

status

payment_method

subtotal

discount

total

notes

created_by

created_at

updated_at
order_items

Criar tabela

id

order_id

campaign_id

number

unit_price

status

created_at
Sources

Criar enum

ONLINE

WHATSAPP

MANUAL
Status do Pedido

Criar enum

OPEN

WAITING_CONTACT

WAITING_PAYMENT

PAID

CANCELLED

EXPIRED

REFUNDED
Formas de Pagamento

Criar enum

PIX

DINHEIRO

CARTAO

TRANSFERENCIA

MERCADO_PAGO

PAGBANK

INFINITYPAY

OUTRO

Nesta Sprint apenas persistir.

Não integrar.

Cadastro de Clientes

Criar CRUD completo.

Campos

Nome

Telefone

Email

Cidade

Observações

Pesquisar

Ordenar

Paginar

Soft Delete

Inteligência

Ao digitar telefone

↓

Pesquisar automaticamente.

Caso exista

↓

Reutilizar cliente.

Não criar duplicado.

Dashboard do Cliente

Mostrar

Quantidade de pedidos

Quantidade de números

Valor gasto

Última compra

Campanhas

Venda Manual

Adicionar botão

Nova Venda Manual

Disponível apenas para GLOBAL_ADMIN.

Fluxo

Selecionar campanha

↓

Selecionar cliente

↓

Selecionar números

↓

Forma de pagamento

↓

Observações

↓

Salvar

↓

Criar Order

↓

Atualizar grade

Seleção dos Números

Reutilizar exatamente o componente criado na Sprint 4.

Adicionar

Campo inteligente.

Exemplo

1,5,8,20

ou

1-50

ou

1-10,50,70-90

Interpretar automaticamente.

Status Inicial

Administrador poderá escolher

RESERVED

PAID

PENDING_PAYMENT
Troca de Número

Criar ação

Trocar Número.

Fluxo

Selecionar número antigo

↓

Selecionar novo

↓

Liberar anterior

↓

Reservar novo

↓

Atualizar pedido

↓

Auditoria

Editar Pedido

Permitir

Adicionar números

Remover números

Trocar números

Editar cliente

Editar observações

Alterar forma de pagamento

Alterar status

Reserva via WhatsApp

Na campanha

Adicionar campos

Contact Name

Contact Phone

WhatsApp Message Template

Purchase Mode

Purchase Mode

MANUAL

AUTOMATIC

Nesta Sprint utilizar

MANUAL
Fluxo WhatsApp

Cliente seleciona números.

↓

Modal

Deseja solicitar estes números?

Cancelar

Enviar WhatsApp

↓

Criar Order

↓

Status

WAITING_CONTACT

↓

Criar Reservation Token

↓

Reservar números

↓

Abrir automaticamente

https://wa.me/

Mensagem

Substituir automaticamente

Olá!

Tenho interesse na campanha

{campaign}

Gostaria de reservar os números

{numbers}

Valor

{total}

Nome

{name}
Tela de Pedidos

Criar DataTable moderna.

Mostrar

Pedido

Cliente

Campanha

Origem

Status

Quantidade

Valor

Data

Administrador

Filtros

Status

Origem

Campanha

Cliente

Período

Timeline

Cada pedido deverá possuir histórico.

Exemplo

Criado

↓

Reserva criada

↓

WhatsApp aberto

↓

Administrador confirmou

↓

Pago
Dashboard

Adicionar

Pedidos

Pedidos pagos

Pedidos pendentes

Pedidos WhatsApp

Pedidos manuais

Clientes cadastrados

Clientes recorrentes

Ticket médio

Cadastro Manual de Números

Adicionar ferramenta

Adicionar Números Manualmente

Administrador poderá informar

1

5

8

10

20-50

80-90

Sistema interpreta automaticamente.

Valida conflitos.

Importação

Criar importador.

Aceitar

TXT

CSV

Cada linha representa um número.

Exemplo

1

5

8

20

50

Criar pedido automaticamente.

Comprovantes

Permitir upload.

Imagem

PDF

Associar ao pedido.

Sem validação financeira.

Auditoria

Registrar

Criação do cliente

Venda manual

Troca de número

Inclusão de números

Remoção

Alteração

Mudança de status

WhatsApp enviado

Segurança

Somente GLOBAL_ADMIN

Criar pedidos manuais

Editar pedidos

Trocar números

Excluir pedidos

Cadastrar clientes

Componentes

Criar

CustomerPicker

CustomerCard

CustomerHistory

OrderTable

OrderTimeline

ManualSaleDialog

QuickNumberInput

WhatsAppDialog

PaymentBadge

OrderStatusBadge

Todos reutilizáveis.

Preparação para Sprint 5

Toda arquitetura deverá permitir que um Order criado manualmente ou por WhatsApp utilize exatamente o mesmo fluxo dos pedidos online.

Na Sprint 5, apenas será adicionada a etapa:

Order

↓

Checkout

↓

PIX

↓

Webhook

↓

PAID

Sem alterar a estrutura do banco ou dos componentes.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

Existir um cadastro completo de clientes (CRM básico).
Toda venda manual gerar um Order.
Toda solicitação via WhatsApp gerar um Order com status WAITING_CONTACT.
O administrador puder cadastrar compradores e reutilizar cadastros existentes.
A seleção de números suportar entrada por lista (1,5,8) e intervalos (10-20).
O administrador puder adicionar, remover e trocar números de um pedido sem recriá-lo.
O envio para WhatsApp utilizar o telefone e o template configurados na campanha.
Toda alteração gerar registros de auditoria.
O sistema impedir conflitos de numeração entre pedidos.
A arquitetura permanecer compatível com a Sprint 5, sem necessidade de mudanças estruturais.
Recomendação adicional

Inclua um Painel de Operação da Campanha na tela administrativa, com três abas:

Grade Visual — mostra todos os números e seus estados, permitindo operações diretamente sobre a grade.
Pedidos — lista todos os pedidos (online, WhatsApp e manuais) com filtros e histórico.
Clientes — exibe o CRM da campanha, permitindo localizar rapidamente um comprador e registrar novas vendas.

Essa organização tende a oferecer uma experiência muito mais eficiente para quem administra rifas pelo celular, WhatsApp e atendimento presencial, mantendo a mesma base preparada para os pagamentos automatizados das próximas Sprints.
