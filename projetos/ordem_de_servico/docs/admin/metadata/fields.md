# Campos

**Módulo:** Admin > Metadata  
**Caminho:** `/admin/metadata/fields`  
**Versão:** 1.0.0-RC1

## Descrição

Gerenciamento de campos das entidades. Permite definir a estrutura de dados de cada entidade cadastrada.

## Funcionalidades

- Cadastro de novos campos
- Edição e exclusão de campos
- Definição de tipo de dado (texto, número, data, booleano, etc.)
- Configuração de validações e regras
- Controle de obrigatoriedade

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome do campo |
| Entidade | Referência | Entidade à qual o campo pertence |
| Tipo | Seleção | Tipo de dado (texto, número, data, etc.) |
| Obrigatório | Booleano | Se o campo é obrigatório |
| Ordem | Número | Ordem de exibição do campo |

## Ações

- **Novo**: Adiciona novo campo a uma entidade
- **Editar**: Altera configurações do campo
- **Excluir**: Remove o campo