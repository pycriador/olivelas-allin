# Admin — Segredos

Gerencia segredos e credenciais sensíveis utilizadas pela plataforma, como chaves de API, tokens de autenticação, senhas e certificados. Armazenamento seguro com criptografia de ponta a ponta.

## Funcionalidades

- Armazenamento seguro com criptografia AES-256 em repouso
- Integração com cofres externos (HashiCorp Vault, AWS Secrets Manager)
- Rotação automática de segredos com política programada
- Controle de acesso granular por função para leitura de segredos
- Auditoria completa de acesso e alterações
- Mascaramento de valores na interface do usuário
- Expiração automática e notificação de vencimento

## Módulos relacionados

- [Variáveis de Ambiente](/admin/env)
- [Políticas de Segurança](/admin/policies)
- [Provedores](/admin/providers)
- [Auditoria](/admin/audit)
