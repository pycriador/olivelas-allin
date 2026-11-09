# SDD — índice e estado

Este diretório é a fonte de contexto para os próximos agentes. Leia os documentos nesta ordem antes de implementar funcionalidades.

| Documento | Conteúdo |
|---|---|
| [01-product.md](./01-product.md) | Objetivos, escopo, perfis, fluxos e critérios de aceite. |
| [02-architecture.md](./02-architecture.md) | Arquitetura, componentes, tenancy e decisões técnicas. |
| [03-domain-data.md](./03-domain-data.md) | Entidades, relacionamentos, estados e regras de consistência. |
| [04-api-contract.md](./04-api-contract.md) | Rotas REST, payloads, autenticação e erros. |
| [05-security-audit.md](./05-security-audit.md) | HBAC/RBAC, isolamento, credenciais, privacidade e auditoria. |
| [06-roadmap.md](./06-roadmap.md) | Implementado, pendências e plano incremental. |

## Estado deste repositório

- **Frontend:** mock navegável em React + TypeScript, responsivo; dados do painel no `localStorage`. Login/cadastro não autentica contra o servidor. A interface mostra a operação, administração de equipe/perfis, trilha demonstrativa, integração e acompanhamento público.
- **API:** primeiro backend funcional em FastAPI/SQLAlchemy, com SQLite padrão, cadastro/login, isolamento por tenant, lojas, usuários, grupos, permissões, pedidos, webhook de entrada, credenciais com escopos, auditoria explícita e tracking público.
- **Persistência:** `Base.metadata.create_all` inicializa as tabelas para facilitar desenvolvimento. O produto ainda precisa introduzir Alembic antes de evoluir/reimplantar schemas em ambientes persistentes.
- **WhatsApp:** não existe conexão direta com Meta/WhatsApp neste estágio. O sistema de atendimento existente deve enviar pedidos à API com uma credencial de integração.
- **Não confundir mock e produção:** valores, status, usuários, atividades e indicadores apresentados no frontend são dados de demonstração. O browser ainda não consome a API.

## Regras de colaboração

1. Atualize este índice e o documento de domínio/API relacionado ao mudar contratos.
2. Marque claramente o que foi implementado e o que segue como decisão pendente; não apresente mock como integração real.
3. Nunca coloque tokens, senhas ou dados de clientes nos commits, exemplos ou logs.
4. Toda consulta/mutação de dado de negócio deve ser escopada pelo tenant autenticado; uma exceção global exige superusuário e contexto explícito.
