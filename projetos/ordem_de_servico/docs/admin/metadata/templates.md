# Templates

**Módulo:** Admin > Metadata  
**Caminho:** `/admin/metadata/templates`  
**Versão:** 1.0.0-RC1

## Descrição

Registro de templates de metadados. Permite criar modelos reutilizáveis de entidades, formulários e visualizações.

## Funcionalidades

- Criação de templates de entidades
- Templates de formulários
- Templates de visualizações
- Importação e exportação de templates
- Versionamento de templates

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome do template |
| Tipo | Seleção | Entidade / Formulário / Visualização |
| Categoria | Seleção | Categoria do template |
| Versão | Texto | Versão atual |
| Conteúdo | JSON | Definição do template |

## Ações

- **Novo Template**: Cria novo template
- **Aplicar**: Aplica template a uma entidade
- **Exportar**: Exporta template como JSON
- **Importar**: Importa template de arquivo