# Sprint 3 — Campanhas

**Status:** Concluida  
**Commit:** `83dcd79`  
**Objetivo:** Plataforma completa de gestao de campanhas + pagina publica com SEO.

---

## O que foi implementado

### CRUD de campanhas

- Criar, editar, duplicar, arquivar, excluir
- Lixeira com restauracao e esvaziamento permanente
- Liberacao de slug ao excluir definitivamente

### Wizard de criacao (5 passos)

- Validacao com Zod (`campaign.schema.ts`)
- Preview ao vivo
- Configuracao de range de numeros, preco, datas, descricao

### Maquina de status

```
DRAFT → SCHEDULED → ACTIVE → PAUSED → FINISHED → CANCELLED → ARCHIVED
```

Transicoes auditadas.

### Pagina publica `/r/{slug}`

- Galeria, progresso, descricao
- SEO: Open Graph, Twitter Card, JSON-LD, canonical
- `robots.txt` e `sitemap.xml`
- Compartilhamento

### Galeria e midia (base)

- Upload com compressao de imagem
- Drag-and-drop / ordenacao
- Capa com fallback

### Listagem admin

- Cards e tabela
- Metricas de resumo
- Filtros por status

---

## Banco (migracao base)

- Tabela `campaigns` (slug unico, range, preco, status)
- `campaign_images`
- `campaign_settings` (exibicao, share, SEO)

Migracao de referencia: `20260806000001_*`

---

## Arquivos principais

| Area       | Caminho                                                      |
| ---------- | ------------------------------------------------------------ |
| Servico    | `src/services/campaign.service.ts`                           |
| Hooks      | `src/features/campaigns/hooks/use-campaigns.ts`              |
| Wizard     | `src/features/campaigns/components/campaign-wizard.tsx`      |
| Publico    | `src/routes/r.$slug.tsx`                                     |
| Admin list | `src/routes/_authenticated/campanhas/index.tsx`              |
| Detalhe    | `src/routes/_authenticated/campanhas/$campanhaId/index.tsx`  |
| Nova       | `src/routes/_authenticated/campanhas/nova.tsx`               |
| Editar     | `src/routes/_authenticated/campanhas/$campanhaId/editar.tsx` |
| SEO        | `src/lib/seo.ts`, `src/lib/slug.ts`                          |

---

## Resultado de negocio

Operador cria e publica campanhas. Visitante acessa a rifa por URL amigavel com SEO pronto para redes sociais.
