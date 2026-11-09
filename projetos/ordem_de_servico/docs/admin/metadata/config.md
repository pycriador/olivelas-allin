# Configuração

**Módulo:** Admin > Metadata  
**Caminho:** `/admin/metadata/config`  
**Versão:** 1.0.0-RC1

## Descrição

Central de configuração do Metadata Platform. Permite ajustar o comportamento global do sistema de metadados.

## Funcionalidades

- Configurações de cache de metadados
- Versionamento de esquemas
- Sincronização entre ambientes
- Logs de alterações de metadados
- Permissões de edição de metadados

## Campos

| Configuração | Tipo | Descrição |
|---|---|---|
| Cache TTL | Número | Tempo de vida do cache (segundos) |
| Versionamento | Booleano | Habilitar versionamento |
| Sincronização Automática | Booleano | Sincronizar automaticamente |
| Notificações | Booleano | Notificar alterações |

## Ações

- **Salvar**: Aplica as configurações
- **Restaurar Padrões**: Volta às configurações originais
- **Exportar Configuração**: Exporta configurações atuais
- **Importar Configuração**: Importa configurações de arquivo