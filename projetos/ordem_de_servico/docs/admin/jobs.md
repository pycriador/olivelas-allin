# Admin — Jobs

Gerencia os jobs assíncronos executados pela plataforma, incluindo filas, workers, tentativas de repetição e agendamentos. Permite acompanhar a execução e diagnosticar falhas.

## Funcionalidades

- Visualização de jobs pendentes, em execução, concluídos e com falha
- Detalhamento de cada job com payload, resultado e stacktrace
- Reagendamento manual e reexecução de jobs com falha
- Cancelamento e remoção de jobs da fila
- Configuração de máximo de tentativas e backoff
- Monitoramento de throughput e tempo médio de execução
- Filas prioritárias e separação por módulo

## Módulos relacionados

- [Agendamentos](/admin/schedules)
- [Monitoramento](/admin/monitoring)
- [Logs](/admin/logs)
- [Saúde do Sistema](/admin/health)
