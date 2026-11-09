# Versões

**Módulo:** Admin > Metadata  
**Caminho:** `/admin/metadata/versions`  
**Versão:** 1.0.0-RC1

## Descrição

Gerenciamento de versões de metadados. Permite rastrear, comparar e restaurar versões anteriores de entidades, campos e formulários.

## Funcionalidades

- Histórico de versões de metadados
- Comparação entre versões
- Restauração de versões anteriores
- Diferenciação visual de alterações
- Auditoria de modificações

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| Versão | Texto | Número da versão |
| Entidade | Referência | Entidade modificada |
| Tipo | Seleção | Tipo de metadado alterado |
| Alterado Por | Texto | Usuário que fez a alteração |
| Data | Data | Data da alteração |

## Ações

- **Comparar**: Compara duas versões selecionadas
- **Restaurar**: Restaura versão anterior
- **Visualizar**: Exibe detalhes da versão
- **Exportar**: Exporta versão como JSON