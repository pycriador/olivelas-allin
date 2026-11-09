# Produto e requisitos

## Problema e objetivo

Uma loja recebe pedidos via WhatsApp e por outros canais. O sistema de atendimento identifica a intenção de delivery e encaminha um pedido estruturado à fila da loja. A equipe acompanha preparo e entrega sem depender da conversa como única fonte de estado. O cliente acompanha o pedido por um link público não enumerável.

O produto é **API-first**: interfaces web, atendimento, apps de entregadores e futuras integrações consomem contratos REST autenticados e versionados.

## Usuários e responsabilidades

| Perfil inicial | Responsabilidade e acesso padrão |
|---|---|
| Superusuário da plataforma | Administração cross-tenant: suporte e operação global. Nunca é atribuído por cadastro público; é provisionado pelo comando de bootstrap. |
| Administrador da loja | Equipe, grupos, integrações, auditoria, lojas do tenant e todos os pedidos operacionais. |
| Gerente | Operação, atualização/atribuição de pedidos, visualização da equipe e auditoria. Não administra credenciais ou permissões por padrão. |
| Atendente | Receber, consultar e avançar pedidos. |
| Entregador | Consultar pedidos atribuídos e avançar o status da entrega. |
| Cliente público | Acesso somente de leitura ao estado do pedido pelo código de tracking. Sem conta. |
| Integração de atendimento | Criação de pedidos por API key com escopo mínimo e loja vinculada. |

Os papéis são grupos configuráveis, não enum fechado de autorização. Os nomes acima são grupos padrão iniciais.

## Ciclo de vida do pedido

Ordem canônica e rótulos de interface:

1. `Pedido feito`: pedido validado e recebido.
2. `Preparando`: cozinha iniciou o preparo.
3. `Pronto`: pedido está pronto.
4. `Aguardando retirada`: aguardando o entregador/retirada.
5. `Em trajeto`: saiu para entrega.
6. `Entregue`: concluído.

Na API V1, as transições são lineares e para a etapa imediatamente seguinte. `Entregue` é terminal. Cancelamento, recusa, falha de entrega, reagendamento e reabertura não foram especificados e não devem ser inventados sem decisão de produto.

## Requisitos funcionais

- Criar tenant e loja inicial no cadastro do proprietário; preservar isolamento entre tenants.
- CRUD de lojas, usuários e grupos; inativação de usuários/lojas preserva histórico. Grupos padrão do sistema não são excluídos.
- Atribuir a usuários grupos e uma loja inicial. Uma função pode reunir mais de um grupo.
- Manter catálogo de permissões com granularidade por recurso e ação.
- Receber pedidos do canal de atendimento, com itens, totais, cliente, endereço e identificador externo idempotente.
- Consultar pedidos paginados, filtrar por loja e status, atualizar status e atribuir entregador.
- Emitir link público de rastreamento não enumerável, sem autenticação de conta.
- Gerar e revogar chaves de integração; mostrar o segredo somente na resposta de criação.
- Registrar trilha para tentativas de autenticação e todas as mutações relevantes.
- Frontend adaptável a desktop e celular, com home pública, autenticação visual, operação, equipe/grupos, atividade e acompanhamento.

## Critérios de aceite iniciais

- Dois tenants diferentes nunca listam nem alteram pedidos, lojas, grupos ou pessoas um do outro.
- O usuário comum não pode definir `is_superuser`, trocar de tenant com header ou selecionar grupo de outro tenant.
- Um pedido criado pelo canal recebe identificador de rastreamento e entra em `Pedido feito`.
- Uma chave só pode executar escopos que seu criador possui; a loja da chave limita a loja do pedido; uma chave revogada deixa de autenticar.
- Transição inválida ou duplicação de pedido externo resulta em erro explicável, sem mutação parcial.
- Mutações são visíveis em auditoria e não registram senha, token ou segredo de API.
- A UI deixa claro quando seus dados são apenas mock.
