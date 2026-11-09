---
title: "Segurança"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
---

# Segurança

> Language: [English (EN)](../../en/security/security.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Postura de segurança do AI WhatsApp Image Analyzer — fronteiras de confiança, autenticação, autorização, proteção de dados e riscos conhecidos.

## Fronteiras de Confiança

| Fronteira | O que protege | Controles |
| --- | --- | --- |
| Cliente ↔ Servidor | Dados do usuário, chamadas de API | HTTPS, tokens CSRF nas server functions |
| Servidor ↔ Supabase | Banco de dados, storage | Políticas RLS, service role key (só server-side) |
| Servidor ↔ Provedores de IA | Chaves de API, prompts | Somente server-side, chaves nunca expostas ao cliente |
| Sistema IAM | Operações de admin | Acesso baseado em roles (global_admin, analyst, consumer) |
| Edge Function | Mutações no banco | Auth por API token (hash SHA-256), fallback JWT |

## Autenticação

| Método | Onde | Detalhes | Classificação |
| --- | --- | --- | --- |
| JWT Supabase | Cliente → Servidor | Middleware attachSupabaseAuth | Confirmed |
| JWT Supabase | Edge Function | supabase.auth.getUser() | Confirmed |
| API Token | Edge Function | Header X-API-Key → hash SHA-256 → lookup iam_api_tokens | Confirmed |
| Token CSRF | Server functions | Validado em handlerType=serverFn | Confirmed |
| Auth de Preview | Preview Lovable | Validação de storage de preview intermediado | Confirmed |

## Autorização

| Role | Permissões | Classificação |
| --- | --- | --- |
| global_admin | Gestão completa de IAM, todas as operações | Confirmed |
| analyst | Visualizar análise, aprovar artes | Confirmed |
| consumer | Submeter artes, visualizar próprias submissões | Confirmed |
| anon | Upload de imagens, análise básica | Confirmed (via RLS) |

### Funções IAM (Postgres)

| Função | Propósito | Segurança |
| --- | --- | --- |
| is_global_admin() | Verificar role de admin global | SECURITY INVOKER, email hardcoded |
| is_admin_or_analyst() | Verificar role admin ou analyst | SECURITY INVOKER |
| get_auth_role() | Obter role do usuário atual | SECURITY INVOKER |

## Proteção de Dados

| Tipo de dados | Armazenamento | Proteção | Classificação |
| --- | --- | --- | --- |
| Imagens do usuário | Supabase Storage (bucket images) | Políticas RLS, URLs assinadas | Confirmed |
| Resultados de análise | Supabase Postgres (image_analysis) | Políticas RLS | Confirmed |
| Chaves de API | Secrets do Supabase / env vars | Nunca expostas ao cliente | Confirmed |
| Cotas de grupo | Supabase Postgres (iam_groups) | Políticas RLS | Confirmed |
| API tokens | Supabase Postgres (iam_api_tokens) | Hash SHA-256 armazenado | Confirmed |
| Imagens geradas | Supabase Storage (generated-arts) | URLs assinadas (30 dias) | Confirmed |

## Gestão de Secrets

| Secret | Localização | Acesso | Classificação |
| --- | --- | --- | --- |
| SUPABASE_SERVICE_ROLE_KEY | Secrets do Supabase | Somente server functions | Confirmed |
| OPENAI_API_KEY | Secrets do Supabase | Somente server functions | Confirmed |
| LOVABLE_API_KEY | Secrets do Supabase | Somente server functions | Confirmed |
| LOVABLE_CRON_SECRET | Secrets do Supabase | Autenticação de cron | Confirmed |
| Chaves Gemini | iam_groups.gemini_api_key | Por grupo, somente server-side | Confirmed |

**Nunca** commitar secrets no git. **Nunca** logar valores de secrets.

## Riscos Conhecidos

| Risco | Impacto | Mitigação | Classificação |
| --- | --- | --- | --- |
| Email de admin hardcoded em is_global_admin() | Bypass de segurança se email mudar | Função deve ser atualizada na mudança de email | Confirmed |
| Políticas RLS concedem acesso amplo a anon/authenticated | Acesso não autorizado potencial | Migrations de hardening de segurança do Supabase aplicadas | Confirmed |
| Chaves Gemini armazenadas em banco | Exposição de chave se DB comprometido | Chaves são por grupo, podem ser rotacionadas | Confirmed |
| Sem rate limiting nas solicitações de análise | Esgotamento de cota, abuso | Sistema de cota por grupo | Inferred |
| Proteção CSRF só em server functions | CSRF potencial em outros endpoints | Superfície de ataque limitada | Inferred |

## Controles de Segurança

| Controle | Tipo | Status | Classificação |
| --- | --- | --- | --- |
| HTTPS em todo lugar | Preventivo | Implementado | Confirmed |
| Políticas RLS | Preventivo | Implementado | Confirmed |
| Tokens CSRF | Preventivo | Implementado | Confirmed |
| Acesso baseado em roles | Preventivo | Implementado | Confirmed |
| Hashing de API token | Preventivo | Implementado | Confirmed |
| Varredura de secrets | Detetive | Não documentado | — |
| Logging de auditoria | Detetive | Parcial (ai_usage_logs) | Inferred |

## Notas de Conformidade

- Sem requisitos PCI/DSS (sem processamento de pagamento)
- Sem requisitos HIPAA (sem dados de saúde)
- Considerações LGPD: imagens de usuários e dados de negócios podem conter informações pessoais
- Retenção de dados: não definida explicitamente

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](../arquitetura.md) |
| Infraestrutura | [infraestrutura/supabase.md](../infraestrutura/supabase.md) |
| Operações | [operacoes/perfil-do-servico.md](../operacoes/perfil-do-servico.md) |