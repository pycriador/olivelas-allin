# Sprint 2 — Modulos Admin

**Status:** Concluida  
**Objetivo:** Entregar os modulos administrativos transversais: usuarios, arquivos, auditoria e configuracoes.

---

## O que foi implementado

### Usuarios

- Listagem com busca e paginacao
- Ativar / desativar usuario
- Alterar papel (`GLOBAL_ADMIN` / `USER`)
- Soft delete de perfis

### Arquivos

- Upload para Supabase Storage
- Listagem e remocao
- RLS no bucket/storage

### Auditoria

- Timeline de eventos (`audit_logs`)
- Filtros por ator, acao e periodo
- Paginacao

### Configuracoes

- Tema e idioma
- Informacoes da plataforma (`settings` / platform settings)
- Preferencias persistidas

---

## Rotas

| Rota             | Descricao                  |
| ---------------- | -------------------------- |
| `/usuarios`      | Gestao de usuarios (admin) |
| `/arquivos`      | Storage de arquivos        |
| `/auditoria`     | Logs de auditoria          |
| `/configuracoes` | Preferencias e plataforma  |

---

## Servicos e hooks

- `src/services/user.service.ts`
- `src/services/storage.service.ts`
- `src/services/audit.service.ts`
- `src/services/settings.service.ts` / `platform-settings.service.ts`
- `src/hooks/use-users.ts`, `use-files.ts`, `use-audit.ts`, `use-settings.ts`

---

## Resultado de negocio

Painel admin operacional para governanca basica (quem acessa, o que foi feito, arquivos e preferencias), independente do fluxo de rifas.
