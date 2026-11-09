# AI WhatsApp Image Analyzer

> Language: [English (EN)](#english) | [Português (pt-BR)](#português-pt-br)
>
> **[Live app](https://ai-wpp-image-analyzer.lovable.app)**

---

## English

An AI-powered web application that analyzes promotional images shared via WhatsApp. The app extracts structured business information (contacts, services, products, prices, addresses) from images using multimodal AI models and returns a complete JSON representation.

### Features

- **AI Image Analysis** — multimodal vision models (GPT-5, GPT-4.1, Gemini 2.5 Flash) extract structured data, text (OCR), objects, logos, colors, and contacts from images
- **Multi-provider AI** — Lovable AI Gateway, OpenAI, and Google Gemini with per-group quotas in BRL
- **AI Art Generation** — create promotional images from analyzed content using DALL-E 3, Flux, or Imagen 3
- **IAM System** — roles (global_admin / analyst / consumer), groups, quotas, API tokens, and usage tracking
- **Store Landing Page** — WhatsApp-based business portfolio (`/anuncio/:id`)
- **Art Moderation** — consumer submissions with analyst approval queue
- **PWA with Web Share Target** — receive images shared directly from WhatsApp
- **Full-text search** — keywords, categories, business names, and full OCR text indexed

### Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start (SSR) + React Router |
| UI | Tailwind CSS v4, shadcn/ui (Radix UI), lucide-react |
| Data | Supabase (Postgres, Storage, Auth, Edge Functions) |
| ORM | Drizzle ORM |
| Validation | Zod |
| Runtime | Bun |
| AI | Lovable AI Gateway, OpenAI, Google Gemini |

### Project Structure

```text
/
├── src/
│   ├── components/       # UI components (StoreLandingPage, IAM, gallery, ...)
│   ├── hooks/
│   ├── integrations/     # Supabase clients, types
│   ├── lib/              # Server functions, services, analysis pipeline
│   ├── routes/           # App routes
│   └── server.ts         # SSR error handling
├── supabase/
│   ├── functions/        # Edge functions (analyze-image)
│   └── migrations/       # SQL migrations, security hardening
├── drizzle/
│   └── migrations/       # Drizzle migrations
├── static/               # Standalone Vitrine Digital (HTML/CSS/JS)
├── public/               # PWA manifest, service worker
└── docs/                 # Project documentation (EN + pt-BR)
```

### Getting Started

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <repository-url>
cd ai-wpp-image-analyzer
npm i
npm run dev
```

### Environment Variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-side only) |
| `SUPABASE_ANON_KEY` | Anonymous key |
| `OPENAI_API_KEY` | OpenAI API key (fallback provider) |
| `LOVABLE_API_KEY` | Lovable AI Gateway key |
| `VISION_MODEL` | Default vision model |
| `LOVABLE_CRON_SECRET` | Cron authentication |

### Documentation

Full project documentation follows the **AIOps Documentation Standard v1.0** (bilingual):

| Language | Entry point |
| --- | --- |
| English | [docs/en/README.md](docs/en/README.md) |
| Português | [docs/pt-BR/README.md](docs/pt-BR/README.md) |
| AI entry | [docs/en/ai-context.md](docs/en/ai-context.md) |

### Development

- `npm run dev` — start dev server
- `npm run build` — build for production
- `npm run lint` — lint & typecheck
- `npm run format` — format code

### Deploy

This project is built with [Lovable](https://lovable.dev) and auto-deploys to [ai-wpp-image-analyzer.lovable.app](https://ai-wpp-image-analyzer.lovable.app) when changes are pushed to the connected branch.

The `static/` folder contains a standalone version of the Vitrine Digital (pure HTML/CSS/JS) that can be deployed to any CDN (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

---

## Português (pt-BR)

Aplicação web com IA que analisa imagens promocionais compartilhadas via WhatsApp. O app extrai informações estruturadas de negócios (contatos, serviços, produtos, preços, endereços) de imagens usando modelos de IA multimodais e retorna uma representação JSON completa.

### Funcionalidades

- **Análise de Imagem com IA** — modelos de visão multimodais (GPT-5, GPT-4.1, Gemini 2.5 Flash) extraem dados estruturados, texto (OCR), objetos, logotipos, cores e contatos de imagens
- **Multi-provedor de IA** — Gateway Lovable AI, OpenAI e Google Gemini com cotas por grupo em BRL
- **Geração de Artes com IA** — crie imagens promocionais a partir do conteúdo analisado usando DALL-E 3, Flux ou Imagen 3
- **Sistema IAM** — roles (global_admin / analyst / consumer), grupos, cotas, API tokens e rastreamento de uso
- **Landing Page da Vitrine** — portfólio de negócios via WhatsApp (`/anuncio/:id`)
- **Moderação de Artes** — submissões de consumidores com fila de aprovação do analista
- **PWA com Web Share Target** — recebe imagens compartilhadas diretamente do WhatsApp
- **Busca full-text** — palavras-chave, categorias, nomes de empresas e texto OCR completo indexados

### Stack

| Camada | Tecnologia |
| --- | --- |
| Framework | TanStack Start (SSR) + React Router |
| UI | Tailwind CSS v4, shadcn/ui (Radix UI), lucide-react |
| Dados | Supabase (Postgres, Storage, Auth, Edge Functions) |
| ORM | Drizzle ORM |
| Validação | Zod |
| Runtime | Bun |
| IA | Gateway Lovable AI, OpenAI, Google Gemini |

### Documentação

A documentação completa do projeto segue o **AIOps Documentation Standard v1.0** (bilingue):

| Idioma | Ponto de entrada |
| --- | --- |
| English | [docs/en/README.md](docs/en/README.md) |
| Português | [docs/pt-BR/README.md](docs/pt-BR/README.md) |
| Entrada IA | [docs/pt-BR/contexto-ia.md](docs/pt-BR/contexto-ia.md) |

### Desenvolvimento

- `npm run dev` — inicia o servidor de desenvolvimento
- `npm run build` — build de produção
- `npm run lint` — lint e typecheck
- `npm run format` — formatação de código

### Deploy

Este projeto foi construído com [Lovable](https://lovable.dev) e faz auto-deploy em [ai-wpp-image-analyzer.lovable.app](https://ai-wpp-image-analyzer.lovable.app) quando mudanças são enviadas para a branch conectada.

A pasta `static/` contém uma versão standalone da Vitrine Digital (HTML/CSS/JS puro) que pode ser publicada em qualquer CDN (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

---

## License

<!-- Add your license here -->