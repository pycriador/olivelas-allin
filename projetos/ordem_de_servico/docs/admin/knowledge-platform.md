# Knowledge Platform — Gestão do Conhecimento Técnico

## Visão Geral
A Knowledge Platform é um módulo transversal do ServiceForge responsável por centralizar, versionar, pesquisar e reutilizar todo o conhecimento técnico da empresa.

## Arquitetura

### Localização
- `src/modules/knowledge/types.ts` — Tipos e interfaces
- `src/modules/knowledge/service.ts` — Serviço com CRUD, busca, relacionamentos, analytics
- `src/modules/knowledge/seeds.ts` — Dados de demonstração
- `src/routes/_app.knowledge*.tsx` — Interface de usuário
- `src/routes/_app.service-orders.$id.knowledge.tsx` — Aba de conhecimento na OS

### Estrutura de Dados

#### KnowledgeArticle
Entidade principal que representa qualquer documento técnico. O campo `type` define a categoria do conteúdo:
- `procedure` — Procedimentos técnicos
- `manual` — Manuais (usuário, serviço, instalação)
- `diagram` — Diagramas elétricos, esquemas
- `firmware` — Firmware e atualizações
- `driver` — Drivers e software
- `tutorial` — Tutoriais e treinamentos
- `solution` — Soluções conhecidas
- `defect` — Defeitos recorrentes
- `error_code` — Códigos de erro
- `faq` — Perguntas frequentes
- `bulletin` — Boletins técnicos
- `alert` — Alertas técnicos

#### KnowledgeCategory
Categorias independentes que organizam os artigos.

#### KnowledgeVersion
Versionamento completo de cada artigo. Nunca sobrescreve versões anteriores.

#### KnowledgeRelationship
Relacionamentos entre artigos e entidades do sistema (equipamentos, marcas, modelos, peças, OS, etc.)

## Funcionalidades
- Dashboard com métricas por tipo e status
- Biblioteca técnica com navegação e filtros
- Pesquisa inteligente em linguagem natural com pontuação por relevância
- Workflow de publicação (Draft → Review → Approved → Published → Obsolete → Archived)
- Analytics (visualizações, usos, avaliações)
- Versionamento automático
- Importação de documentos
- Integração com OS (recomendação automática + pesquisa)

## Eventos
- `knowledge.created`, `knowledge.updated`, `knowledge.published`
- `knowledge.archived`, `knowledge.version.created`
- `knowledge.imported`, `knowledge.exported`
- `knowledge.linked`, `knowledge.indexed`
