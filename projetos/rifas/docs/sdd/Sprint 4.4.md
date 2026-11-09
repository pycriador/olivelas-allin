Sprint 4.4 — Platform Stabilization, QA e Correção Completa do Módulo de Campanhas
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

Esta Sprint tem como único objetivo estabilizar todo o módulo desenvolvido nas Sprints:

Sprint 4
Sprint 4.1
Sprint 4.2
Sprint 4.3

NÃO implementar novas funcionalidades.

NÃO iniciar Checkout.

NÃO iniciar PIX.

NÃO iniciar Gateways.

Toda a Sprint deve ser dedicada à correção de bugs, validação da arquitetura, melhorias de UX, revisão de banco de dados, otimização de performance e eliminação de inconsistências.

Objetivos

Realizar uma revisão completa de todo o módulo.

Corrigir:

Bugs
Fluxos quebrados
Estados inconsistentes
Erros de banco
Problemas de RLS
Problemas de Realtime
Erros de sincronização
Problemas de UX
Problemas de responsividade
Correção Prioritária

Existe atualmente o erro

Venda criada, mas falha ao atualizar status inicial.

Este problema deve ser tratado como prioridade máxima.

O sistema deve investigar e corrigir definitivamente a causa raiz.

Validar:

criação do Order;
criação dos Order Items;
atualização da tabela campaign_numbers;
transações;
políticas de RLS;
permissões do usuário;
Edge Functions;
chamadas da API;
sincronização do estado do frontend;
cache do TanStack Query;
Realtime.

Não aceitar soluções paliativas.

A correção deve preservar a consistência dos dados.

Revisão das Transações

Toda venda deverá ocorrer dentro de uma única transação lógica.

Fluxo esperado

Criar Cliente (quando necessário)

↓

Criar Order

↓

Criar Order Items

↓

Atualizar Campaign Numbers

↓

Atualizar Dashboard

↓

Atualizar Auditoria

↓

Atualizar Cache

↓

Realtime

↓

Sucesso

Caso qualquer etapa falhe

↓

Rollback completo.

Nunca permitir dados parcialmente gravados.

Revisão da Estrutura

Revisar completamente

Orders

Order Items

Customers

Campaign Numbers

Campaigns

Audit Logs

Settings

Storage

Validar

Relacionamentos

Índices

Foreign Keys

Constraints

Enums

Triggers

Policies

Revisão das Políticas RLS

Validar todas as tabelas.

Garantir que:

GLOBAL_ADMIN

possua acesso administrativo.

Usuários comuns

não possam alterar campanhas ou pedidos.

Nenhuma policy deve impedir o funcionamento interno da aplicação.

Revisão das Telas

Validar individualmente

Dashboard

Campanhas

Operações

Pedidos

Clientes

Usuários

Arquivos

Configurações

Perfil

Auditoria

Reservas

Venda Manual

WhatsApp

Pesquisa

Todas as telas devem funcionar sem erros.

Revisão da Venda Manual

Validar

Criar cliente

Selecionar cliente existente

Adicionar números

Trocar números

Remover números

Editar venda

Cancelar venda

Excluir venda

Restaurar venda

Liberar números

Atualizar indicadores

Realtime

Revisão das Reservas

Validar

Criar reserva

Expirar reserva

Liberar números

Renovar reserva

Cancelar reserva

Trocar números

Duplicidade

Concorrência

Revisão do Customer Picker

Validar

Pesquisa

Autocomplete

Debounce

Paginação

Cadastro rápido

Editar cliente

Duplicidade

Histórico

Revisão do Dashboard

Validar indicadores

Quantidade vendida

Quantidade reservada

Receita prevista

Receita recebida

Clientes

Pedidos

Conversão

Todos os indicadores devem ser calculados diretamente a partir dos pedidos e dos itens do pedido, evitando contadores independentes que possam ficar inconsistentes.

Revisão do Realtime

Sempre que houver alteração

Pedido

Cliente

Número

Reserva

Campanha

Dashboard

A interface deve atualizar automaticamente.

Sem refresh.

Revisão da Responsividade

Validar

Desktop

Notebook

Tablet

Mobile

Landscape

Portrait

Revisão dos Componentes

Validar

Dialogs

Drawers

DataTables

Forms

Pickers

Cards

Skeletons

Toasts

Loading

Badges

Todos devem possuir comportamento consistente.

Revisão da Performance

Eliminar

Renderizações desnecessárias

Consultas repetidas

Queries duplicadas

Estados inconsistentes

Requisições redundantes

Adicionar

Memoização

Lazy Loading

Virtualização

Prefetch

Cache inteligente

Revisão do Código

Remover

Código morto

Componentes duplicados

Hooks duplicados

Services duplicados

Tipos duplicados

Enums duplicados

Funções não utilizadas

Imports não utilizados

Melhorias de UX

Padronizar

Ícones

Botões

Espaçamentos

Mensagens

Estados vazios

Confirmações

Feedback visual

Animações

Loading

Skeleton

Logs

Adicionar logs estruturados.

Toda exceção deve conter

Usuário

Campanha

Pedido

Número

Tela

Ação executada

Mensagem original

Stack Trace (quando disponível)

Esses logs deverão facilitar futuras investigações.

Testes Funcionais

Executar testes completos nos seguintes cenários

Criar campanha
Editar campanha
Publicar campanha
Criar cliente
Editar cliente
Criar pedido
Venda manual
Reserva
Liberação
Exclusão
Troca de número
WhatsApp
Dashboard
Pesquisa
Realtime

Corrigir qualquer inconsistência encontrada.

Refatoração

Melhorar onde necessário.

Sem alterar funcionalidades.

Objetivo

Código mais limpo.

Mais modular.

Mais reutilizável.

Mais performático.

Não implementar

Não iniciar Checkout.

Não iniciar PIX.

Não iniciar Mercado Pago.

Não iniciar PagBank.

Não iniciar InfinityPay.

Não iniciar Sorteio.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

O erro "Venda criada, mas falha ao atualizar status inicial" estiver completamente resolvido na causa raiz.
Todas as telas das Sprints 4.x estiverem funcionando sem erros.
Toda venda criar corretamente o cliente (quando necessário), o pedido, os itens do pedido e atualizar os números de forma consistente.
Não existirem inconsistências entre pedidos, números, clientes e indicadores.
O Realtime sincronizar corretamente todas as alterações.
O Customer Picker estiver estável e performático.
O Dashboard exibir indicadores corretos.
Todas as operações forem protegidas por RLS.
Não existirem erros de TypeScript, ESLint, warnings críticos ou falhas de compilação.
O código estiver preparado para iniciar a Sprint 5 sem necessidade de refatorações estruturais.
Recomendação adicional

Peça ao Lovable para incluir um Modo de Diagnóstico (Debug), acessível apenas ao GLOBAL_ADMIN, que possa ser ativado nas configurações. Quando habilitado, ele deve exibir informações úteis para desenvolvimento, como:

IDs do pedido, cliente e campanha;
reservation_token;
consultas e mutações executadas (em formato resumido);
tempos de resposta;
mensagens detalhadas de erro vindas do backend;
estado atual do pedido e dos números envolvidos.

Esse modo deve existir apenas para administradores e ser facilmente desativável. Ele acelera muito a identificação de problemas durante o desenvolvimento e pode ser mantido como ferramenta de suporte mesmo após a aplicação entrar em produção.
