# 🌿 Hortifruti Natural — Online Storefront & Administration Dashboard

> Language: English (EN) | [Português (pt-BR)](README.pt-BR.md)
>
> **Modern Zero-Backend E-Commerce Platform for Fresh Produce with Dynamic Catalog, Stock Management, WhatsApp Checkout, and Full Admin Panel.**

[![Status](https://img.shields.io/badge/status-active-success.svg)](#)
[![Architecture](https://img.shields.io/badge/architecture-Zero--Backend%20%7C%20Vanilla%20ES6-blue.svg)](#)
[![PWA](https://img.shields.io/badge/PWA-Ready%20%2B%20Offline%20Cache-orange.svg)](#)
[![Theme](https://img.shields.io/badge/Theme-Light%20%2F%20Dark-9333ea.svg)](#)
[![Docs](https://img.shields.io/badge/Docs-Bilingual%20Standard-emerald.svg)](docs/en/README.md)

---

## 📖 Overview

**Hortifruti Natural** is a high-performance, lightweight digital storefront and management application tailored for grocery markets, farm produce stands, organic food distributors, and artisanal food sellers.

Built exclusively with **Vanilla JavaScript (ES6 Modules)** and **modern CSS3 (Custom Properties & Design Tokens)**, it requires zero backend servers or databases. Catalog data is loaded from a version-controlled JSON baseline (`data/produtos.json`) and reacts seamlessly to runtime updates stored in the browser's `localStorage`.

```text
+---------------------------------------------------------------------------------------------------+
|  [LOGO] Hortifruti Natural                                          (🌙 Theme) (❤️ Favs) (🛒 Cart)  |
+---------------------------------------------------------------------------------------------------+
|                                   🍃 HORTIFRUTI NATURAL                                           |
|              Fresh selected fruits, vegetables, and farm goods directly to your door.             |
|                                     [Browse Catalog v]                                            |
+---------------------------------------------------------------------------------------------------+
| [Categories v] | 🔍 [Search products by name, description, tags...] | [Sort v] | Price: [===O===] |
+---------------------------------------------------------------------------------------------------+
|  CATEGORIES   |  📦 SHOWING PRODUCTS                                                              |
|  * All        |  +---------------------+  +---------------------+  +---------------------+        |
|  * Fruits     |  | [Tag: ORGANIC] [❤️]  |  | [Last Unit!]   [❤️]  |  | [Preorder]    [❤️]  |        |
|  * Vegetables |  |     🍌 BANANA       |  |     🥝 KIWI GOLD    |  |    🍉 WATERMELON    |        |
|  * Greens     |  | Ref: HF001          |  | Ref: HF007          |  | Ref: HF014          |        |
|  * Herbs      |  | $ 6.49 / kg         |  | 2 size options      |  | $ 14.90 / un        |        |
|               |  | [🛒 Add to Cart]    |  | [🛒 Select Options] |  | [💬 Preorder]       |        |
|               |  +---------------------+  +---------------------+  +---------------------+        |
+---------------------------------------------------------------------------------------------------+
|                             <<< [ 1 ] [ 2 ] [ 3 ] ... [ 5 ] >>>                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## ✨ Key Features

### 🛒 High-Converting Storefront (`/index.html`)
- **Single Unified Search Bar**: Instant debounced search querying across title, category, description, and keywords.
- **Smart Category Filtering**: Fast pill filters for *Fruits*, *Greens & Leaves*, *Vegetables*, *Organics*, and *Herbs*.
- **Dynamic Stock Badges**: Real-time badges indicating `Made to Order`, `Last Unit`, `Low Stock`, `Out of Stock`, and `Featured`.
- **Deep Linking Permalinks**: Every product features a unique shareable URL (`/?p=HF007`) that opens the product modal automatically.
- **Interactive Product Modal**: Sticky bottom action footer ("Add to Cart" and "Order via WhatsApp") with responsive variation selectors.
- **Slide-out Cart Drawer**: Quantity adjustment, delivery address form, order notes, and real-time shipping calculation.
- **1-Click WhatsApp Checkout**: Generates structured, readable markdown messages sent straight to the merchant's WhatsApp.

### ⚙️ Full Admin Management Panel (`/admin`)
- **Product Catalog CRUD**: Add, edit, and delete items with instant live preview.
- **Stock & Status Management**: Update available units, toggle "Made to Order", and switch featured highlights.
- **JSON Backup & Import/Export**: Export the modified catalog to `produtos.json` with one click, or upload existing JSON backups.
- **Store Settings**: Customize merchant phone number, delivery rates, and store operating hours.

### 📱 Progressive Web App (PWA) & Performance
- **Offline Caching**: Service Worker (`sw.js`) with Cache-First and Stale-While-Revalidate strategies.
- **Installable**: Full Web App Manifest (`manifest.webmanifest`) supporting desktop and mobile home screen installation.
- **Zero Dependencies**: Pure HTML5, Vanilla JavaScript, and CSS3 without build step overhead.

---

## 🚀 Quick Start

### 1. Run Locally

No npm dependencies are required to run the application:

```bash
# Using Python 3 (Recommended)
python -m http.server 8000

# Using Node.js (npx serve)
npx serve .
```

- **Storefront**: [`http://localhost:8000`](http://localhost:8000)
- **Admin Dashboard**: [`http://localhost:8000/admin`](http://localhost:8000/admin)

---

## 📁 Repository Structure

```text
├── index.html                 # Main storefront entrypoint
├── 404.html                   # Static 404 error page
├── offline.html               # PWA offline fallback page
├── manifest.webmanifest       # PWA web app manifest
├── sw.js                      # PWA Service Worker caching
├── admin/                     # Administration Dashboard
│   ├── index.html             # Admin interface
│   ├── admin.js               # Admin business logic & CRUD
│   └── admin.css              # Admin layout and components
├── assets/
│   ├── css/                   # Storefront stylesheets
│   │   ├── variables.css      # Design tokens & color palette
│   │   ├── layout.css         # Grid & container layouts
│   │   ├── components.css     # Cards, badges, modals, cart
│   │   ├── responsive.css     # Mobile/tablet media queries
│   │   └── style.css          # Main stylesheet aggregator
│   ├── js/                    # Native ES6 JavaScript modules
│   │   ├── app.js             # Bootstrap & global orchestration
│   │   ├── catalog.js         # Catalog rendering & stock logic
│   │   ├── cart.js            # Shopping cart drawer & totals
│   │   ├── modal.js           # Product details modal & URL routing
│   │   ├── search.js          # Debounced multi-field search
│   │   ├── filters.js         # Category filtering & sorting
│   │   ├── pagination.js      # Dynamic page calculations
│   │   ├── whatsapp.js        # WhatsApp payload formatter
│   │   └── utils.js           # Currency formatting & helpers
│   └── images/                # Product images and brand assets
├── data/
│   └── produtos.json          # Canonical product catalog (Source of Truth)
├── docs/                      # Comprehensive Bilingual Documentation
│   ├── en/                    # English documentation suite
│   ├── pt-BR/                 # Portuguese documentation suite
│   └── validation-config.yaml # Documentation linter configuration
├── scripts/
│   └── docs_lint.py           # Documentation validator & test runner
└── Makefile                   # Quick developer task shortcuts
```

---

## 📚 Documentation Index

The complete documentation is organized into modular topic hubs in both English and Portuguese:

| Topic | Description | Link (EN) | Link (pt-BR) |
| --- | --- | --- | --- |
| **Overview & AI** | AI assistant context and system guides | [ai-context.md](docs/en/ai-context.md) | [ai-context.md](docs/pt-BR/ai-context.md) |
| **Architecture** | System architecture, reactivity, and PWA | [architecture/](docs/en/architecture/architecture-overview.md) | [architecture/](docs/pt-BR/architecture/architecture-overview.md) |
| **Application** | Deep dive into storefront, admin, cart, and modals | [application/](docs/en/application/storefront-catalog.md) | [application/](docs/pt-BR/application/storefront-catalog.md) |
| **Contracts** | Catalog JSON schema, LocalStorage, and WhatsApp | [contracts/](docs/en/contracts/produtos-json-schema.md) | [contracts/](docs/pt-BR/contracts/produtos-json-schema.md) |
| **Operations** | Local development, deployment, and backups | [operations/](docs/en/operations/local-development.md) | [operations/](docs/pt-BR/operations/local-development.md) |
| **Security** | Static security model and privacy compliance | [security/](docs/en/security/client-security-model.md) | [security/](docs/pt-BR/security/client-security-model.md) |

---

## 🛠️ Verification & Quality Checks

Run the automated documentation validation suite:

```bash
# Validate documentation links, schemas, and bilingual parity
python scripts/docs_lint.py validate

# Generate updated documentation health report
python scripts/docs_lint.py report
```

---

## 🌐 Deployment

Since **Hortifruti Natural** is 100% static, it can be deployed with zero server costs:

- **GitHub Pages**: Set source to branch `main` and root directory `/`.
- **Vercel**: Import repository without build commands.
- **Netlify**: Set publish directory to `.`.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
