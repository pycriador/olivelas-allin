# Demo Environment Manager

Gera, gerencia e restaura ambientes de demonstração para apresentações, testes e treinamentos.

## Funcionalidades

- **Dashboard** — Visão geral com estatísticas do ambiente atual
- **Gerador de Cenários** — Três cenários pré-definidos (Pequena/Média/Grande) com um clique
- **Gerador Personalizado** — Controle granular sobre quantidade de dados por entidade
- **Seeds** — Gerenciamento e execução de seeds do módulo
- **Exportação** — Exporta o ambiente atual como arquivo JSON
- **Importação** — Importa e restaura ambientes a partir de arquivo JSON
- **Estatísticas** — Distribuição detalhada dos dados por entidade
- **Histórico** — Registro completo de todas as ações executadas
- **Logs** — Logs detalhados de cada operação
- **Diagnóstico** — Verificação de saúde e consistência do ambiente
- **Integridade** — Checagem de integridade referencial entre entidades

## Acesso

Disponível em **Configurações > Demo Environment**. Apenas administradores globais podem executar operações de escrita (gerar, restaurar, limpar, importar, exportar).

## Eventos

O módulo dispara eventos no Core Event Bus:

| Evento | Descrição |
|--------|-----------|
| `demo-env.generated` | Ambiente gerado (cenário ou personalizado) |
| `demo-env.restored` | Ambiente restaurado |
| `demo-env.cleaned` | Dados operacionais limpos |
| `demo-env.exported` | Ambiente exportado |
| `demo-env.imported` | Ambiente importado |

## Módulos relacionados

- [Configurações](/admin/settings)
- [Banco de Dados](/admin/database)
- [Manutenção](/admin/maintenance)
