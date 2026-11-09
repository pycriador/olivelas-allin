# Visualizações

**Módulo:** Admin > Metadata  
**Caminho:** `/admin/metadata/views`  
**Versão:** 1.0.0-RC1

## Descrição

Gerenciamento de visualizações de dados. Define como os registros são exibidos em listas, tabelas e cards.

## Funcionalidades

- Criação de visualizações personalizadas
- Configuração de colunas exibidas
- Definição de filtros padrão
- Ordenação e agrupamento
- Visualizações em tabela, kanban e cards

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome da visualização |
| Entidade | Referência | Entidade alvo |
| Tipo | Seleção | Tabela / Kanban / Cards |
| Colunas | JSON | Colunas exibidas |
| Filtros | JSON | Filtros aplicados |

## Ações

- **Nova Visualização**: Cria nova visualização
- **Editar**: Configura colunas e filtros
- **Duplicar**: Copia visualização existente