# Security Policy — Olivelas Art Hub

## Visão Geral

Este documento estabelece as políticas e diretrizes de segurança do Olivelas Art Hub, seguindo os princípios **Secure by Design**, **Zero Trust** e **Defense in Depth**. A aplicação deve estar preparada para auditorias corporativas e conformidade com LGPD/GDPR.

---

## Arquitetura de Segurança

### Modelo Zero Trust

Toda operação deve validar:

- **Identidade** — quem está acessando (Supabase JWT)
- **Permissão** — o que pode fazer (RBAC via `has_role()`)
- **Contexto** — de onde vem (IP, User-Agent)
- **Tenant** — a que dados pertence (RLS policies)
- **Ownership** — se é proprietário do registro

**Nenhum usuário, requisição ou dispositivo é confiável por padrão.**

### Camadas de Defesa

```
┌─────────────────────────────────────────────┐
│  Frontend (React + TypeScript)              │
│  • Validação de UI (Zod, HTML5)             │
│  • Sanitização de renderização (React)      │
│  • CSP headers                              │
├─────────────────────────────────────────────┤
│  API Layer (TanStack Server Functions)      │
│  • Autenticação JWT (requireSupabaseAuth)   │
│  • Autorização RBAC (has_role RPC)          │
│  • Validação de entrada (Zod)               │
│  • Rate Limiting                            │
├─────────────────────────────────────────────┤
│  Supabase (Banco + Storage)                 │
│  • Row Level Security (RLS)                 │
│  • Storage policies                         │
│  • Parameterized queries                    │
│  • SECURITY DEFINER functions               │
├─────────────────────────────────────────────┤
│  Infraestrutura                             │
│  • HTTPS obrigatório                        │
│  • Environment variables / Secret Manager   │
│  • CORS / Origin validation                 │
└─────────────────────────────────────────────┘
```

---

## Autenticação

### Provedores Suportados

| Provedor | Status | Notas |
| --- | --- | --- |
| Google OAuth | Implementado | Via Lovable Cloud Auth SDK |
| Email/Senha | Não implementado | Superfície de ataque adicional |
| Microsoft OAuth | Pendente | Preparado para futura integração |
| GitHub OAuth | Pendente | Preparado para futura integração |
| Magic Link | Pendente | Preparado para futura integração |
| SSO (SAML/OIDC) | Pendente | Arquitetura preparada |

### Sessões

- **Access Token**: JWT curto prazo, verificado em toda server function via `requireSupabaseAuth`
- **Refresh Token**: Gerenciado pelo Supabase client (`autoRefreshToken: true`)
- **Logout**: Via `supabase.auth.signOut()` — invalida tokens no Supabase
- **Expiração**: Controlada pelo Supabase (configurável no dashboard)
- **Revogação**: Supabase suporta revogação de tokens via admin API

**Pendente:**
- [ ] Logout global (invalidar todas as sessões do usuário)
- [ ] Rotação explícita de tokens
- [ ] Limite de sessões simultâneas configurável
- [ ] Dashboard de sessões ativas

### MFA (Autenticação Multifator)

**Status:** Não implementado

**Roadmap:**
- [ ] Authenticator App (TOTP)
- [ ] Recovery Codes
- [ ] Admin pode resetar MFA de usuários
- [ ] SMS (futuro)
- [ ] Email (futuro)

### Políticas de Senha

**Status:** Não aplicável (autenticação via OAuth)

**Se email/senha for adicionado, implementar:**
- Mínimo 12 caracteres
- Maiúsculas, minúsculas, números, caracteres especiais
- Histórico de senhas (não reutilizar últimas 5)
- Expiração opcional (90 dias)
- Bloqueio após 5 tentativas failed
- Cooldown progressivo entre tentativas (1min, 5min, 15min, 30min)

---

## Autorização (RBAC)

### Estrutura Atual

```
Roles: admin | user
```

| Recurso | admin | user (authenticated) | anon |
| --- | --- | --- | --- |
| CRUD coleções | ✅ | ❌ | ❌ |
| CRUD artes | ✅ | ❌ | ❌ |
| Configurações | ✅ | ❌ | ❌ |
| IA (análise/prompts) | ✅ | ❌ | ❌ |
| Visualizar artes públicas | ✅ | ✅ | ✅ |
| Busca semântica | ✅ | ✅ | ✅ |
| Pedidos WhatsApp | ✅ | ✅ | ✅ |

### Implementação

- **`has_role()`**: Função SQL `SECURITY DEFINER` com `SET search_path = public`
- **RLS Policies**: Todas as tabelas possuem `FOR ALL TO authenticated USING (has_role('admin'))`
- **Bootstrap**: Primeiro usuário registrado recebe role `admin` automaticamente
- **Client-side gate**: `useIsAdmin()` verifica role no Supabase para UI

**Pendente:**
- [ ] Server-side admin check em todas as rotas (não apenas UI gate)
- [ ] Roles expandidas (editor, viewer, etc.)
- [ ] Permissões por módulo (artworks, collections, ai, settings)
- [ ] Permissões por ação (create, read, update, delete, export)
- [ ] Permissões por registro (ownership-based)
- [ ] Permissões por campo (sensitive field masking)
- [ ] Permissões temporárias (expiração automática)
- [ ] Grupos de usuários
- [ ] Permissões herdadas

### Ownership

**Pendente:**
- [ ] Adicionar `created_by` e `updated_by` em todas as tabelas
- [ ] Validação de ownership em server functions
- [ ] Prevenção de alteração de registros de outros usuários

---

## Validação de Entrada

### Implementado

| Onde | Como | Arquivo |
| --- | --- | --- |
| AI analysis input | Zod (`artworkIds: uuid[]`) | `analyze-artwork.functions.ts:12-16` |
| Semantic search input | Zod (`query: string 1-500`) | `analyze-artwork.functions.ts:244` |
| AI metadata output | Zod schema completo | `artwork-metadata-schema.ts` |
| File upload (client) | Extensão + tamanho | `storage.ts:15-24` |

**Pendente:**
- [ ] Validação Zod em todas as server functions
- [ ] Sanitização de ILIKE wildcards (`%`, `_`) em buscas
- [ ] Validação de MIME type server-side (magic bytes)
- [ ] Sanitização de conteúdo gerado por IA antes de inserção
- [ ] Limite de tamanho em campos de texto

---

## Proteção contra Ataques

### Implementado

| Ataque | Proteção | Status |
| --- | --- | --- |
| SQL Injection | Supabase parameterized queries | ✅ |
| XSS (Reflected/Stored) | React default escaping | ✅ |
| Path Traversal | Storage paths randomizados | ✅ |
| Session Hijacking | JWT + HTTPS + HttpOnly cookies | ✅ |

### Pendente

| Ataque | Proteção Necessária | Prioridade |
| --- | --- | --- |
| Brute Force | Rate limiting no login e API | **Alta** |
| Credential Stuffing | Rate limiting + CAPTCHA | **Alta** |
| CSRF | CSRF tokens ou SameSite strict | **Alta** |
| Clickjacking | X-Frame-Options header | **Alta** |
| SSRF | Validação de URLs em inputs | Média |
| Open Redirect | Whitelist de redirects | Média |
| Replay Attack | Nonce/timestamp em requests | Média |
| Race Condition | Optimistic locking ou locks | Média |
| Timing Attack | Constant-time comparison | Baixa |
| DOM XSS | CSP + DOMPurify | Média |
| Stored XSS | Sanitização de HTML | Média |
| Mass Assignment | Explicit field whitelisting | Média |
| Prototype Pollution | Object freeze / schema validation | Baixa |

---

## Headers de Segurança

### Status: Não implementado

**Implementar no servidor (server.ts ou middleware):**

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://xbauyvkxfovuqccpfgac.supabase.co data:; connect-src 'self' https://xbauyvkxfovuqccpfgac.supabase.co https://ai.gateway.lovable.dev; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Cache-Control: no-store, no-cache, must-revalidate (em rotas sensíveis)
Pragma: no-cache
```

### Cookies

Todos os cookies devem ter:

- `HttpOnly` (não acessível via JavaScript)
- `Secure` (apenas HTTPS)
- `SameSite=Lax` ou `SameSite=Strict`
- Expiração configurada
- Rotação periódica

**Pendente:**
- [ ] Corrigir cookie do sidebar (`sidebar.tsx:86`) — adicionar SameSite, Secure, HttpOnly
- [ ] Definir SameSite em todos os cookies do Supabase

---

## Rate Limiting

### Status: Não implementado

**Implementar limites:**

| Endpoint / Ação | Limite Sugerido | Janela |
| --- | --- | --- |
| Login / Auth | 5 tentativas | 15 min |
| Reset senha | 3 tentativas | 1 hora |
| Server functions (AI) | 10 chamadas | 1 min |
| Upload de arquivo | 20 arquivos | 1 hora |
| Busca semâsemica | 30 chamadas | 1 min |
| Exportação | 5 chamadas | 1 hora |
| API pública | 100 chamadas | 1 min |

**Implementação recomendada:** Middleware no TanStack Start ou edge middleware no Nitro.

---

## Upload e Download de Arquivos

### Upload — Implementado

- Extensão whitelist: `png, jpg, jpeg, webp, gif` (`storage.ts:11`)
- Tamanho máximo: 8 MB (`storage.ts:12`)
- Paths randomizados: `{prefix}/{timestamp}-{random}.{ext}` (`storage.ts:26-31`)
- RLS no storage: admin-only write
- Limpeza de imagem anterior no replace

### Upload — Pendente

- [ ] Validação server-side de magic bytes (conteúdo real do arquivo)
- [ ] Validação de MIME type no servidor
- [ ] Renomeação automática de arquivos
- [ ] Limite de quantidade de uploads por usuário
- [ ] Preparação para antivírus
- [ ] Nunca executar arquivos enviados

### Download — Pendente

- [ ] Links temporários com expiração (signed URLs com TTL menor)
- [ ] Validação de permissão no download
- [ ] Auditoria de downloads
- [ ] Exportações com link de expiração

**Nota:** Signed URLs atuais têm TTL de 5 anos (`storage.ts:13`). Reduzir para 24h ou menos.

---

## Segurança de API

### Server Functions (TanStack Start)

| Medida | Status |
| --- | --- |
| Autenticação (JWT) | ✅ `requireSupabaseAuth` |
| Autorização (RBAC) | ✅ `has_role()` em `analyzeArtworks` |
| Validação de entrada (Zod) | ✅ Nos endpoints de IA |
| Request ID | ❌ Não implementado |
| Correlation ID | ❌ Não implementado |
| Idempotency Key | ❌ Não implementado |
| Rate Limiting | ❌ Não implementado |
| Versionamento | ❌ Não implementado |
| OpenAPI spec | ❌ Não implementado |

**Falha de segurança:** `semanticSearchArtworks` (`analyze-artwork.functions.ts:246`) **não possui middleware de autenticação**. Qualquer usuário não autenticado pode chamá-la.

---

## Auditoria e Logs

### Implementado

| Log | Tabela / Local |
| --- | --- |
| Histórico de processamento IA | `ai_processing_history` |
| Versões de prompts | `ai_prompt_versions` |
| Timestamps (created_at/updated_at) | Todas as tabelas |

**Pendente — Alta Prioridade:**
- [ ] Tabela `audit_log` genérica: `user_id, action, entity, entity_id, before, after, ip, user_agent, timestamp, request_id`
- [ ] Tracking de `created_by` e `updated_by` em todas as tabelas
- [ ] Log de login/logout (sucesso e falha)
- [ ] Log de alteração de permissões
- [ ] Log de reset de MFA
- [ ] Log de exportações

**Pendente — Categorias de Log:**

| Categoria | Implementar |
| --- | --- |
| Application | Eventos de negócio (CRUD) |
| Security | Tentativas de acesso, falhas de auth |
| Audit | Mudanças em dados sensíveis |
| Performance | Tempos de resposta, queries lentas |
| Error | Erros não tratados |
| Integration | Chamadas a IA, WhatsApp, Storage |

**Nunca registrar:**
- Senhas
- JWTs / Tokens
- Cookies
- Dados sensíveis (CPF, cartão)
- Secrets / API Keys

---

## Soft Delete

### Status: Não implementado

Todos os deletes são hard deletes com `ON DELETE CASCADE`.

**Implementar:**

```sql
ALTER TABLE artworks ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE artworks ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE artworks ADD COLUMN delete_reason TEXT;

ALTER TABLE collections ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE collections ADD COLUMN deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE collections ADD COLUMN delete_reason TEXT;
```

- Nunca excluir registros imediatamente
- Soft delete → dados permanecem para auditoria
- Restauração possível pelo admin
- Hard delete apenas após retenção configurada
- Cascade logic: soft delete collection → soft delete artworks filhos

---

## Criptografia

### Implementado

- JWT (Supabase) — tokens assinados com HS256/ES256
- HTTPS obrigatório (Supabase edge)
- RLS policies com funções `SECURITY DEFINER`

**Pendente:**
- [ ] AES-256 para dados sensíveis em repouso (se necessário)
- [ ] Hash seguro (bcrypt/argon2) para dados PII
- [ ] Salt único por registro
- [ ] Rotação de chaves de criptografia
- [ ] Vault preparado para secrets sensíveis

---

## Secrets Management

### Regra

**Nunca armazenar no código fonte:**
- API Keys
- JWT Secrets
- Passwords
- Connection Strings
- Credenciais
- Tokens

### Implementado

| Secret | Localização | Exposto ao Cliente? |
| --- | --- | --- |
| `SUPABASE_URL` | `.env` / `VITE_*` | ✅ Sim (público, protegido por RLS) |
| `SUPABASE_PUBLISHABLE_KEY` | `.env` / `VITE_*` | ✅ Sim (anon key, público) |
| `SUPABASE_SERVICE_ROLE_KEY` | `client.server.ts` | ❌ Não (servidor apenas) |
| `LOVABLE_API_KEY` | `process.env` (call-time) | ❌ Não (servidor apenas) |

**Pendente:**
- [ ] Adicionar `.env` ao `.gitignore` (atualmente apenas `*.local` é ignorado)
- [ ] Criar `.env.example` documentando variáveis necessárias
- [ ] Preparar integração com Secret Manager / Vault
- [ ] Nunca commitar secrets — usar variáveis de ambiente em produção
- [ ] Rotação periódica de secrets

---

## Privacidade (LGPD / GDPR)

### Pendente

- [ ] Página de Política de Privacidade
- [ ] Consentimento de cookies (cookie banner)
- [ ] Direito ao esquecimento (exclusão de dados pessoais)
- [ ] Exportação de dados pessoais (portabilidade)
- [ ] Anonimização / Pseudonimização de dados
- [ ] Política de retenção de dados
- [ ] Registro de consentimentos
- [ ] DPO (Data Protection Officer) — se aplicável

---

## Segurança Frontend

### Regra

**Nunca confiar em:**
- `localStorage` / `sessionStorage`
- Cookies manipuláveis
- Query strings
- Dados do navegador

**Sempre validar novamente no servidor.**

### Implementado

- React escapa conteúdo automaticamente (proteção XSS)
- Nenhum uso de `dangerouslySetInnerHTML` detectado
- Validação server-side nas server functions com Zod

**Pendente:**
- [ ] CSP restritivo (bloquear inline scripts, eval, scripts externos não autorizados)
- [ ] Sanitização de conteúdo gerado por IA antes de renderização
- [ ] DOMPurify para qualquer conteúdo HTML dinâmico
- [ ] Subresource Integrity (SRI) para scripts externos

---

## Monitoramento e Alertas

### Pendente

**Dashboards:**
- [ ] Falhas de login
- [ ] Tentativas suspeitas
- [ ] Ataques detectados
- [ ] Erros da aplicação
- [ ] Status de integrações (IA, Storage)
- [ ] Performance (latência, throughput)
- [ ] Usuários ativos / sessões
- [ ] Uso de API / rate limits

**Alertas:**
- [ ] Múltiplos logins失败同一个账户
- [ ] Brute force detectado
- [ ] Alteração de permissões
- [ ] Mudança de role de administrador
- [ ] Reset de MFA
- [ ] Exportações grandes
- [ ] Uploads suspeitos (volume anormal)
- [ ] Erros críticos
- [ ] Créditos IA esgotados

---

## Disaster Recovery

### Pendente

- [ ] Backup automático do banco (Supabase faz diário)
- [ ] Restore testado periodicamente
- [ ] Versionamento de migrations
- [ ] Rollback de migrations
- [ ] Política de retenção de backups
- [ ] Documentação do processo de recuperação
- [ ] Teste de recuperação (DR drill)

---

## Checklist de Segurança por Feature

Antes de considerar qualquer funcionalidade pronta, validar:

```
✓ Autenticação — usuário está logado?
✓ Autorização — tem permissão para esta ação?
✓ Auditoria — ação registrada no log?
✓ Logs — evento registrado com contexto?
✓ Rate Limit — protegido contra abuso?
✓ Tratamento de erros — erro tratado e logging feito?
✓ Validação de entrada — dados validados no servidor?
✓ Sanitização — dados limpos antes de processar?
✓ Testes — cobertura de cenários de segurança?
✓ Performance — não introduz bottleneck?
✓ Segurança — nenhum vetor de ataque aberto?
```

**Caso qualquer requisito falhe, a funcionalidade não deve ser considerada concluída.**

---

## Prioridades de Implementação

### Fase 1 — Crítica (implementar imediatamente)

1. Adicionar `.env` ao `.gitignore`
2. Adicionar auth middleware em `semanticSearchArtworks`
3. Rate limiting em server functions e uploads
4. Headers de segurança (CSP, HSTS, X-Frame-Options)
5. CSRF protection

### Fase 2 — Alta (próximas semanas)

6. Tabela de auditoria genérica (`audit_log`)
7. `created_by` / `updated_by` em todas as tabelas
8. Soft delete
9. Validação server-side completa (Zod em todas as server functions)
10. Validação de magic bytes no upload

### Fase 3 — Média (próximos meses)

11. MFA (Authenticator App + Recovery Codes)
12. Roles expandidas (editor, viewer)
13. Permissões por módulo/ação/registro
14. Monitoring e alertas
15. Secret Manager / Vault

### Fase 4 — Baixa (futuro)

16. Logout global + sessões simultâneas
17. LGPD/GDPR compliance completo
18. SSO (SAML/OIDC)
19. OpenAPI spec
20. Disaster Recovery testing

---

## Contato

Para reportar vulnerabilidades de segurança, entrar em contato com o responsável pela aplicação.

**Não publicar vulnerabilidades publicamente antes da correção.**
