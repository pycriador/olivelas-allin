Sprint 4.2 — Campaign Operations Center
Objetivo

Continuar o desenvolvimento do RaffleHub.

Esta Sprint complementa as Sprints 4 e 4.1.

Implementar uma Central de Operação da Campanha para gerenciamento completo de números, reservas, pedidos e indicadores em tempo real.

NÃO implementar gateways de pagamento.

NÃO implementar PIX.

NÃO implementar checkout automático.

Objetivos

Implementar

Central Operacional da Campanha
Gestão completa dos números
Gestão das reservas
Gestão dos pedidos
Liberação manual
Exclusão
Troca
Dashboard da campanha
Indicadores de vendas
Nova tela

Criar

Campaign Operations

Acessível apenas para

GLOBAL_ADMIN
Layout

Criar quatro abas.

Visão Geral

Números

Pedidos

Clientes
Aba Visão Geral

Mostrar

Imagem da campanha

Nome

Produto

Status

Valor

Quantidade de números

Período

Administrador

Criar indicadores

Total de números

Disponíveis

Reservados

Pagos

Bloqueados

Cancelados

Premiados

Criar indicador principal

Percentual vendido

Cálculo

(Pagos ÷ Total de números) × 100

Considerar como vendidos:

Venda manual (PAID)
Venda online (PAID)
Pagamentos futuros aprovados por gateway (PAID)

Não considerar:

Reservados
Pendentes
Cancelados

Adicionar também

Percentual reservado
(Reservados ÷ Total)

Criar barra de progresso.

Exemplo

██████████████░░░░░░░░░

65%

Atualização em tempo real.

Dashboard Financeiro

Mostrar

Valor previsto

Valor recebido

Valor reservado

Ticket médio

Pedidos

Clientes

Aba Números

Criar DataTable moderna.

Colunas

Número

Status

Cliente

Telefone

Pedido

Origem

Forma de pagamento

Data

Administrador

Filtros

Número

Status

Cliente

Telefone

Origem

Pedido

Pesquisa rápida

Pesquisar

150

↓

Abrir diretamente.

Clique no Número

Ao clicar

Abrir Drawer lateral.

Mostrar

Número

Status

Cliente

Telefone

Pedido

Forma de pagamento

Origem

Observações

Histórico

Data

Administrador responsável

Ações

Permitir

Editar

Trocar

Liberar

Cancelar

Excluir vínculo

Abrir pedido

Abrir cliente

Liberar Número

Fluxo

Confirmação

↓

Liberar

↓

Atualizar Order

↓

Atualizar Number

↓

Atualizar Dashboard

↓

Atualizar Auditoria

Caso seja o último número do pedido

Perguntar

Deseja cancelar o pedido também?
Trocar Número

Selecionar novo número.

↓

Validar disponibilidade.

↓

Trocar automaticamente.

↓

Atualizar auditoria.

Editar Número

Permitir

Editar observações

Alterar status

Alterar cliente

Mover para outro pedido

Excluir Registro

Criar

Soft Delete.

Nunca apagar fisicamente.

Registrar auditoria.

Restaurar

Administrador poderá restaurar registros excluídos.

Aba Pedidos

Melhorar tela criada anteriormente.

Adicionar

Resumo financeiro

Origem

Cliente

Quantidade

Valor

Status

Última atualização

Ações

Editar

Cancelar

Duplicar

Imprimir

Exportar

Aba Clientes

Mostrar

Nome

Telefone

Quantidade de compras

Quantidade de números

Valor total

Última compra

Ao abrir cliente

Mostrar histórico completo.

Histórico dos Números

Cada número deverá possuir timeline.

Exemplo

Número 150

Disponível

↓

Reservado

↓

WhatsApp

↓

Pago

↓

Transferido

↓

Cliente alterado

↓

Observação adicionada

Nunca apagar histórico.

Pesquisa Inteligente

Permitir pesquisar por

Número

Nome

Telefone

Pedido

Origem

Pagamento

Observação

Exportação

Exportar

CSV

Excel

PDF

Filtros aplicados.

Impressão

Criar impressão da campanha.

Mostrar

Todos os números

Status

Cliente

Telefone

Atualização em Tempo Real

Sempre que um número mudar

Atualizar automaticamente

Dashboard

Grade

Pedidos

Clientes

Indicadores

Sem refresh.

Dashboard da Campanha

Adicionar indicadores

Receita prevista

Receita recebida

Receita pendente

Clientes únicos

Pedidos

Conversão

Tempo médio de reserva

Indicadores

Criar

Taxa de Conversão

Pedidos pagos

÷

Pedidos criados
Ocupação da campanha

Reservados + Pagos

÷

Total
Percentual vendido

Pagos

÷

Total
Receita prevista

Pagos × Valor unitário
Componentes

Criar

CampaignDashboard

CampaignMetrics

NumberHistory

NumberDrawer

NumberTable

ReservationManager

OrderInspector

CustomerInspector

CampaignProgress

FinancialCards

Todos reutilizáveis.

Segurança

Somente

GLOBAL_ADMIN

poderá

Editar

Liberar

Excluir

Trocar

Cancelar

Restaurar

Auditoria

Registrar

Visualização

Liberação

Troca

Edição

Exclusão

Restauração

Mudança de cliente

Mudança de pedido

Responsividade

Validar

Desktop

Notebook

Tablet

Mobile

Drawer adaptativo.

Performance

Paginação

Virtualização

Realtime

Lazy Loading

Cache inteligente

Memoização

Preparação para Sprint 5

Toda a Central de Operação deverá funcionar da mesma forma para pedidos manuais, WhatsApp e pagamentos automáticos.

Quando os gateways forem implementados, os indicadores e a operação deverão refletir automaticamente as vendas aprovadas, sem necessidade de mudanças estruturais.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

Existir uma Central de Operação para cada campanha.
O administrador puder localizar qualquer número rapidamente.
Cada número exibir seu histórico completo e o comprador associado.
Reservas puderem ser liberadas manualmente.
Números puderem ser trocados entre pedidos.
Registros puderem ser editados e restaurados por meio de soft delete.
A campanha exibir, em tempo real:
percentual vendido;
percentual reservado;
receita prevista;
receita recebida;
ocupação da campanha.
Todas as operações forem registradas na auditoria.
A atualização em tempo real refletir imediatamente qualquer alteração.
Não existirem erros de TypeScript, ESLint ou warnings críticos.
Melhoria adicional

Eu adicionaria um Mapa de Calor da Grade, onde cada número muda de cor conforme seu estado (disponível, reservado, pago, bloqueado, premiado etc.) e o administrador pode clicar diretamente em qualquer posição para abrir o painel lateral daquele número. Para campanhas com poucos números (como 0–200), isso é muito mais eficiente do que trabalhar apenas com tabelas e aproxima a experiência do modo como organizadores de rifas costumam visualizar suas cartelas. Essa visualização pode coexistir com a DataTable, dando liberdade para o administrador alternar entre uma visão gráfica e uma visão tabular.
