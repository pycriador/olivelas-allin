# DESIGN.md — Olivelas All In (`v2.0.0`)

## 1. Visual Direction & Architectural Philosophy

**Direction:** *Registro Corporativo & Ecossistema Unificado (Corporate Registry & Unified Ecosystem)*

Olivelas All In combines a high-density multi-tenant governance console (`:5174`) with **37 specialized commercial platforms** (`:4101`–`:4137`). Every interface prioritizes **tabular legibility without horizontal scroll**, **explicit multi-tenant scope awareness**, **custom domain SVG iconography**, and **seamless 3-layer SSO navigation**.

### Core Design Principles
1. **Zero Horizontal Scroll Across All Tables & Modals:** All tables (`.data-table`) use `table-layout: fixed`, `width: 100%`, automatic word wrapping (`overflow-wrap: anywhere`), and progressive hiding of secondary columns on smaller viewports (`@media (max-width: 1280px)`), completely eliminating horizontal scrollbars in both main views and modals.
2. **Unified Single-List Catalog + Details Modal + Action Dropdown:** Module and entity listings avoid fragmented multi-card grids in favor of a single unified table where every row provides a compact **Action Dropdown Menu (`ActionDropdownMenu`)** and opens a comprehensive **Details Modal (`ModuleDetailsModal`)** dismissible via its `X` button, `ESC` key, or backdrop click.
3. **3-Layer SSO Bottom Bar (`#olivelas-allin-instance-pill`):** Every commercial application (`4101`–`4137`) renders a floating bottom bar displaying the official brand (`Olivelas - <App>`), the `Página Estática` badge when applicable, the active SSO identity (`Willian Jesus`), and a 3-button layer switcher:
   - `🌐 Landing Page` (Public storefront / showcase)
   - `🔒 Tela de Login (Visualização)` (Read-only, non-functional login preview with `disabled` controls)
   - `🛡️ Administração (SSO)` (Authenticated administrative workspace)
4. **Custom Domain SVG Favicons (`/favicon.svg`):** Each of the 37 platforms and the main console features a bespoke vector SVG favicon with domain-specific gradients and iconography.
5. **30 Adaptive Themes & 3 Languages:** 15 Light Themes and 15 Dark Themes (`src/styles/themes.ts`) paired with complete `PT-BR`, `EN`, and `ES` internationalization.

---

## 2. Typography Scale & Roles

| Role | Token / Font Stack | Size / Line Height | Weight / Numeric Variant |
| :--- | :--- | :--- | :--- |
| **Sans UI & Editorial** | `--font-sans` (`Inter`, `-apple-system`, `BlinkMacSystemFont`, sans-serif) | `0.875rem` (14px) base / `1.5` | `400` regular, `500` medium, `600` semibold, `700` bold |
| **Monospace / Technical IDs** | `--font-mono` (`JetBrains Mono`, `SFMono-Regular`, `Menlo`, monospace) | `0.75rem`–`0.8125rem` / `1.45` | `500` medium, `tabular-nums` |
| **Page Title (`h1`)** | `--font-sans` | `1.35rem` (21.6px) / `1.25` | `600`, letter-spacing `-0.02em` |
| **Section Header (`h2`, `.card-title`)** | `--font-sans` | `0.9375rem` (15px) / `1.3` | `600` |
| **KPI Metric Value (`.kpi-value`)** | `--font-sans` | `1.5rem` (24px) / `1.2` | `700`, `font-variant-numeric: tabular-nums` |
| **Table Header (`th`)** | `--font-sans` | `0.72rem` (11.5px) / `1.3` | `600`, uppercase, letter-spacing `0.03em` |

---

## 3. Color Palette & Adaptive `light-dark()` Tokens

All color tokens are centralized in [src/styles/index.css](file:///home/willian/Downloads/projetos/olivelas-allin/src/styles/index.css) and [src/styles/themes.ts](file:///home/willian/Downloads/projetos/olivelas-allin/src/styles/themes.ts):

| Token | Light Mode Default | Dark Mode Default | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| `--bg-canvas` | `#f8fafc` | `#0b0f17` | Primary application background canvas |
| `--bg-surface` | `#ffffff` | `#111827` | Cards, tables, dialogs, and form containers |
| `--bg-surface-raised` | `#f1f5f9` | `#1e293b` | Table headers, code blocks, and subtle panels |
| `--bg-sidebar` | `#0f172a` | `#090d16` | High-contrast compact navigation rail |
| `--text-primary` | `#0f172a` | `#f8fafc` | Primary body copy, headings, and values |
| `--text-secondary` | `#334155` | `#cbd5e1` | Table cells, labels, and secondary metadata |
| `--text-muted` | `#64748b` | `#94a3b8` | Hints, timestamps, and empty state captions |
| `--border-subtle` | `#e2e8f0` | `#1e293b` | Hairline structural dividers and row borders |
| `--border-strong` | `#cbd5e1` | `#334155` | Input borders, active cards, and focus containers |
| `--accent-primary` | `#1d4ed8` | `#3b82f6` | Primary interactive action & focus ring |
| `--status-success` | `#15803d` | `#4ade80` | Active status, SSO online, paid charges |
| `--status-warning` | `#b45309` | `#fbbf24` | Read-only login preview, pending states |
| `--status-danger` | `#b91c1c` | `#f87171` | Overdue charges, revoked tokens, HBAC denials |
| `--status-info` | `#1d4ed8` | `#60a5fa` | Static page badges & global scope indicators |
