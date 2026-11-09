# Dashboards

**Módulo:** Admin > Metadata  
**Caminho:** `/admin/metadata/dashboards`  
**Versão:** 1.0.0-RC1

## Descrição

Designer de dashboards. Permite criar painéis personalizados com widgets, gráficos e indicadores.

## Funcionalidades

- Designer visual de dashboards
- Adição de widgets (gráficos, tabelas, KPIs)
- Layout personalizável com arrastar e soltar
- Configuração de fontes de dados
- Dashboards públicos e privados

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Nome | Texto | Nome do dashboard |
| Descrição | Texto | Descrição do dashboard |
| Layout | JSON | Configuração de layout |
| Widgets | JSON | Widgets configurados |
| Padrão | Booleano | Se é o dashboard padrão |

## Ações

- **Novo Dashboard**: Cria novo dashboard
- **Adicionar Widget**: Insere novo widget
- **Editar Layout**: Configura posicionamento
- **Definir como Padrão**: Marca como dashboard inicial