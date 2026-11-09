# Roadmap e critérios de continuidade

## Entregue nesta base

- Identidade visual e navegação do mock web: landing, login/cadastro demonstrativos, operação diária, filtro de status, avanço local de status, equipe, grupos, auditoria, integração e tracking.
- Tipos TypeScript e conjunto de amostras para o protótipo.
- API FastAPI V1: SQLite, cadastro/login, criação de superusuário via CLI, tenants/lojas, usuários e grupos, permissões, pedidos, estados sequenciais, API keys por loja/escopo, webhook WhatsApp, tracking e auditoria.
- Especificação de produto, arquitetura, dados, API, acesso/auditoria e próximos passos.
- Testes automatizados iniciais de isolamento por tenant, ciclo/status, API key e validações.

## Próxima ordem recomendada

1. **Aprovar decisões de produto:** cancelamentos/recusas; moedas/fuso; política de clientes; grupos/permissões default; associação usuário-múltiplas-lojas; exigência de aceite de convite e criação de tenant.
2. **Evoluir schema com Alembic:** migrations baseline, FKs/indexes compatíveis SQLite/PostgreSQL/MariaDB, resolução dos modelos multi-loja e validação dos dialetos.
3. **Fechar superfície de backend:** paginação cursor se escala exigir; APIs de tenant e stores multi-unidade; retenção/exportação/expurgo; tracking com resposta minimizada; retries/idempotência robusta de webhook; expiração/rotação de chaves; rate limiting; refresh/revogação de sessão.
4. **Ligar frontend à API:** cliente HTTP central, contrato OpenAPI tipado, login/cadastro reais, loading/erro/empty states, tenant/store context, gestão da equipe, páginas de pedidos e tracking real. Substituir `localStorage` apenas depois de autenticação implementada.
5. **Operação:** configuração Supabase/PostgreSQL e MariaDB validada em CI, backups/restauração, monitoramento, logs sem PII, CI, deploy e plano de incidentes.
6. **QA e acessibilidade:** teste responsivo em navegadores, teclado/leitor de tela, E2E de pedido completo, corrida de webhook duplicado e matriz de testes HBAC.

## Como continuar

- Executar `npm run build`, `cd backend; pytest` e atualizar evidências quando testes adicionais forem introduzidos.
- Para alterar uma permissão: atualizar catálogo seed, contratos OpenAPI, testes de acesso e esta documentação.
- Para alterar status: atualizar enum de domínio, transições, UI do mock, filtros, tracking, fixtures e contrato SDD na mesma mudança.
- Não ligar produção a dados de amostra ou tratar login mock como autenticação segura.
