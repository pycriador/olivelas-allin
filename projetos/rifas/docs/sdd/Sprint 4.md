Sprint 4 — Number Selection, Temporary Reservations & Realtime
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

Nesta Sprint implementar o sistema completo de seleção de números, reservas temporárias e sincronização em tempo real.

NÃO implementar pagamentos.

NÃO implementar PIX.

NÃO implementar gateways.

NÃO implementar sorteio.

Os pagamentos serão implementados na Sprint 5.

Objetivos

Implementar:

Grade dinâmica de números
Seleção manual
Seleção automática
Reserva temporária
Expiração automática
Atualização em tempo real
Carrinho de compra
Persistência no Lovable Cloud
Arquitetura

Não criar uma linha para cada número disponível.

A campanha continua armazenando apenas:

number_start

number_end

Exemplo

0

200

A interface deverá gerar dinamicamente:

000

001

002

...

200

Persistir apenas números que possuam algum estado.

Banco

Criar tabela

campaign_numbers
id

campaign_id

number

status

reserved_by

reservation_token

reserved_until

purchase_id

created_at

updated_at

Status

AVAILABLE

RESERVED

PENDING_PAYMENT

PAID

BLOCKED

CANCELLED

WINNER

Não criar registros para números disponíveis.

Somente registrar quando o estado deixar de ser AVAILABLE.

Reservation Token

Criar token único.

UUID.

Esse token identifica toda a reserva.

Mesmo usuário

↓

Mesmo token

↓

Vários números

Reserva

Fluxo

Selecionar números

↓

Validar disponibilidade

↓

Criar reservation_token

↓

Persistir

↓

Alterar status

↓

RESERVED

↓

Definir expiration

Tempo de Reserva

Utilizar

reservation_timeout_minutes

da campanha.

Exemplo

15 minutos

Quando expirar

↓

Liberar automaticamente.

Job Automático

Criar Edge Function.

Executar periodicamente.

Responsável por:

Localizar reservas expiradas.

↓

Remover reserva.

↓

Alterar status

↓

AVAILABLE

↓

Registrar auditoria.

Atualização em Tempo Real

Utilizar Realtime do Lovable Cloud.

Sempre que um número mudar:

Todos os clientes conectados devem atualizar automaticamente.

Sem refresh.

Grade dos Números

Criar componente

NumberGrid

Responsivo.

Desktop

Tablet

Mobile

Cada card representa um número.

Exemplo

001

002

003

004

Estados Visuais

Disponível

Cinza claro

Reservado

Amarelo

Pagamento iniciado

Azul

Pago

Verde

Bloqueado

Preto

Cancelado

Vermelho

Premiado

Dourado

Criar legenda.

Seleção

Permitir

Selecionar

Desmarcar

Multi seleção

Arrastar seleção (desktop)

Toque múltiplo (mobile)

Criar contador.

Exemplo

Selecionados

15

Criar total.

15 × R$10

Total

R$150
Seleção Aleatória

Criar botão

Escolher automaticamente.

Opções

1

5

10

20

50

100

Quantidade personalizada

Selecionar somente números disponíveis.

Nunca repetir.

Busca

Campo

Ir para número.

Exemplo

150

↓

Rolagem automática.

↓

Destacar.

Filtros

Mostrar

Todos

Disponíveis

Reservados

Pagos

Bloqueados

Carrinho

Criar painel lateral.

Mostrar

Campanha

Quantidade

Lista

Subtotal

Valor unitário

Total

Botão

Continuar

Ainda não criar checkout.

Botão deve navegar para

Checkout

Em desenvolvimento
Reserva

Ao clicar

Continuar

↓

Persistir reserva

↓

Atualizar realtime

↓

Abrir tela de confirmação

Tela de Reserva

Mostrar

Token

Horário limite

Cronômetro

Lista dos números

Valor total

Cronômetro

Criar contador regressivo.

Exemplo

14:59

14:58

14:57

Ao expirar

↓

Liberar números.

↓

Atualizar interface.

↓

Mostrar aviso.

Conflitos

Caso outro usuário reserve antes

↓

Mostrar mensagem.

↓

Atualizar grade.

↓

Remover seleção inválida.

Concorrência

Garantir transação.

Nunca permitir dois usuários reservarem o mesmo número.

Implementar bloqueio utilizando transações e restrições no banco.

Página Pública

Atualizar automaticamente.

Sem refresh.

Sempre refletir

Disponíveis

Reservados

Pagos

Dashboard

Adicionar

Reservas ativas

Reservas expiradas

Números reservados

Tempo médio de reserva

Auditoria

Registrar

Seleção

Reserva

Expiração

Cancelamento

Tentativas inválidas

Componentes Novos

Criar

NumberGrid

NumberCard

ReservationDrawer

ReservationSummary

ReservationTimer

QuickPick

NumberSearch

NumberLegend

NumberFilter

ReservationDialog

Todos reutilizáveis.

Hooks

Criar

useReservation()

useRealtimeCampaign()

useNumberGrid()

useCountdown()

useQuickPick()

useReservationValidation()
Segurança

Validar

Número existente.

Número disponível.

Campanha ativa.

Reserva não expirada.

Token válido.

Proteção contra múltiplas reservas simultâneas.

Rate Limit para tentativas excessivas.

Performance

Virtualização da grade para campanhas com milhares de números.

Lazy Loading.

Memoização.

Realtime otimizado.

Cache inteligente.

Renderização incremental.

UX

Animações suaves.

Feedback visual imediato.

Skeletons.

Toast.

Confirmações.

Nenhum bloqueio visual durante sincronizações.

Não implementar nesta Sprint

Não integrar PIX.

Não integrar Mercado Pago.

Não integrar PagBank.

Não integrar InfinityPay.

Não criar webhook.

Não confirmar pagamentos.

Não gerar comprovantes.

Não realizar sorteio.

Preparação para a Sprint 5

A arquitetura deve deixar pronto:

Checkout
PIX
QR Code
Pix Copia e Cola
Mercado Pago
PagBank
InfinityPay
Webhooks
Aprovação automática
Mudança automática para PAID
Geração do pedido (Purchase)
Emissão de comprovante

Esses recursos não devem ser implementados nesta Sprint.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

A grade de números for gerada dinamicamente a partir do intervalo da campanha.
Apenas números com estado diferente de AVAILABLE forem persistidos no banco.
A seleção manual e aleatória estiver funcional.
As reservas temporárias forem criadas com reservation_token e data de expiração.
A Edge Function liberar automaticamente reservas expiradas.
A atualização em tempo real sincronizar todos os clientes conectados sem necessidade de recarregar a página.
O carrinho exibir corretamente os números e o valor total.
Conflitos de concorrência impedirem reservas duplicadas.
Toda a interface for responsiva e otimizada para campanhas com milhares de números.
Não existirem erros de TypeScript, ESLint ou warnings críticos.
A arquitetura permanecer preparada para a Sprint 5, sem necessidade de refatorações estruturais.
