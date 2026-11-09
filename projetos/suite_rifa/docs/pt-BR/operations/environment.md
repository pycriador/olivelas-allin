---
title: "Environment Configuration"
status: "ACCEPTED"
owner: "rafflehub"
created: "2026-08-18"
updated: "2026-08-18"
version: "1.0"
id: "OPS-002"
type: "operations"
---

# Configuração de Ambiente

> Language: pt-BR | [English](../../en/operations/environment.md)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

## Finalidade

Referência de todas as variáveis de ambiente, arquivos de configuração e configurações da cadeia de ferramentas necessários para executar o RaffleHub.

## Variáveis de Ambiente

| Variável | Escopo | Obrigatória | Propósito |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Cliente (navegador) | Sim | URL do projeto Supabase (ex., `https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Cliente (navegador) | Sim | Chave anônima/pública do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Servidor (Nitro) | Sim | Chave de service role do Supabase — bypassa RLS, nunca exposta ao cliente |

## Configuração do Supabase

| Configuração | Valor |
| --- | --- |
| Provedor de autenticação | Google OAuth (via Lovable Cloud Auth) |
| Bucket de storage | `org-assets` (isolado por tenant) |
| Realtime | Habilitado para tabelas `campaign_numbers` e `payments` |
| RLS | Habilitado em todas as tabelas |

### Bucket de Storage: org-assets

| Propriedade | Valor |
| --- | --- |
| Nome | `org-assets` |
| Público | Não (acessado via proxy do servidor) |
| Estrutura de caminho | `organizations/{orgId}/campaigns/{campaignId}/{uuid}.{ext}` |
| Caminho do logo | `organizations/{orgId}/logo/{timestamp}.{ext}` |
| RLS | Isolado por tenant (cada org acessa apenas sua pasta) |

## Configuração do Banco de Dados

### App Settings (Chave-Valor)

| Chave | Propósito | Padrão |
| --- | --- | --- |
| `payment_ttl_minutes` | Expiração de reserva/pagamento em minutos | 30 |
| `payment_encryption_key` | Chave simétrica PGP para criptografia de credenciais de gateway | (deve ser definida) |

### Permissões de Função

Armazenadas na tabela `role_permissions`. 28 permissões em 10 domínios:

| Domínio | Permissões |
| --- | --- |
| Organization | `organization.view`, `organization.update`, `organization.suspend` |
| Ownership | `ownership.transfer` |
| Users | `users.view`, `users.invite`, `users.update`, `users.remove` |
| Roles | `roles.view`, `roles.update` |
| Billing | `billing.view` |
| Usage | `usage.view` |
| Audit | `audit.view` |
| Campaigns | `campaigns.view`, `campaigns.create`, `campaigns.update`, `campaigns.publish`, `campaigns.pause`, `campaigns.finish`, `campaigns.archive`, `campaigns.restore`, `campaigns.manage_images` |
| Numbers | `numbers.view`, `numbers.manage` |
| Reservations | `reservations.view`, `reservations.manage` |
| Participants | `participants.view`, `participants.manage` |
| Sales | `sales.view`, `sales.manage` |
| Payments | `payments.view`, `payments.manage` |

## Cadeia de Ferramentas

| Ferramenta | Versão | Propósito |
| --- | --- | --- |
| Bun | Latest | Gerenciador de pacotes (com proteção de supply-chain) |
| Node.js | 20+ | Runtime para ferramentas de build |
| TypeScript | 5.x | Verificação de tipos (`exactOptionalPropertyTypes: true`) |
| Vite | 8.x | Ferramenta de build |
| Nitro | Latest | Framework server-side |
| Tailwind CSS | 4.x | Estilização |
| shadcn/ui | Latest | Biblioteca de componentes UI |

### Configuração do TypeScript

Configurações chave do `tsconfig.json`:

```json
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

- `exactOptionalPropertyTypes: true` — `{ search: string | undefined }` NÃO é atribuível a `{ search?: string }`. Use o operador spread para incluir propriedades condicionalmente.
- `noPropertyAccessFromIndexSignature: true` — Use notação de colchetes para chaves dinâmicas (`obj["key"]` em vez de `obj.key`).

## Desenvolvimento

```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento
bun run dev

# Verificação de tipos
npx tsc --noEmit

# Build para produção
bun run build

# Visualizar build de produção
bun run preview
```

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Implantação | [deployment.md](deployment.md) |
| Migrações | [migrations.md](migrations.md) |
| Arquitetura | [../architecture/overview.md](../architecture/overview.md) |
