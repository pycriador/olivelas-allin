# 🌿 Hortifruti Natural — Vitrine Virtual e Painel Administrativo

> Idioma: Português (pt-BR) | [English (EN)](README.md)
>
> **Plataforma Moderna de Comércio Eletrônico para Hortifruti com Arquitetura Zero-Backend, Catálogo Dinâmico, Gestão de Estoque, Checkout via WhatsApp e Painel Admin Completo.**

[![Status](https://img.shields.io/badge/status-ativo-success.svg)](#)
[![Arquitetura](https://img.shields.io/badge/arquitetura-Zero--Backend%20%7C%20Vanilla%20ES6-blue.svg)](#)
[![PWA](https://img.shields.io/badge/PWA-Pronto%20%2B%20Cache%20Offline-orange.svg)](#)
[![Tema](https://img.shields.io/badge/Tema-Claro%20%2F%20Escuro-9333ea.svg)](#)
[![Documentação](https://img.shields.io/badge/Docs-Padronizada%20(Bil%C3%ADngue)-emerald.svg)](docs/pt-BR/README.md)

---

## 📖 Visão Geral do Projeto

O **Hortifruti Natural** é uma aplicação completa de comércio eletrônico e gestão de catálogo pensada para feirantes, quitandas, mercados de bairro, produtores rurais e distribuidores de alimentos orgânicos.

Desenvolvido exclusivamente em **JavaScript Vanilla (Módulos ES6)** e **CSS3 moderno (Design Tokens e Variáveis)**, o sistema não exige servidores de backend ou banco de dados. Os dados do catálogo são lidos de um arquivo inicial versionado (`data/produtos.json`) e sincronizados em tempo real com o `localStorage` do navegador do operador.

```text
+---------------------------------------------------------------------------------------------------+
|  [LOGO] Hortifruti Natural                                          (🌙 Tema) (❤️ Favs) (🛒 Cart)  |
+---------------------------------------------------------------------------------------------------+
|                                   🍃 HORTIFRUTI NATURAL                                           |
|            Frutas, legumes e verduras frescas selecionadas diretamente para a sua casa.           |
|                                    [Explorar Catálogo v]                                          |
+---------------------------------------------------------------------------------------------------+
| [Categorias v] | 🔍 [Buscar produtos por nome, descrição, tags...] | [Ordenar v] | Preço: [===O===] |
+---------------------------------------------------------------------------------------------------+
|  CATEGORIAS   |  📦 EXIBINDO PRODUTOS                                                             |
|  * Todas      |  +---------------------+  +---------------------+  +---------------------+        |
|  * Frutas     |  | [Orgânico]     [❤️]  |  | [Última Unid!] [❤️]  |  | [Sob Encomenda][❤️] |        |
|  * Legumes    |  |     🍌 BANANA       |  |     🥝 KIWI GOLD    |  |    🍉 MELANCIA      |        |
|  * Verduras   |  | Ref: HF001          |  | Ref: HF007          |  | Ref: HF014          |        |
|  * Temperos   |  | R$ 6,49 / kg        |  | 2 opções de tamanho |  | R$ 14,90 / un       |        |
|               |  | [🛒 Adicionar]      |  | [🛒 Ver Opções]     |  | [💬 Encomendar]     |        |
|               |  +---------------------+  +---------------------+  +---------------------+        |
+---------------------------------------------------------------------------------------------------+
|                             <<< [ 1 ] [ 2 ] [ 3 ] ... [ 5 ] >>>                                   |
+---------------------------------------------------------------------------------------------------+
```

---

## ✨ Funcionalidades Principais

### 🛒 Vitrine de Alta Conversão (`/index.html`)
- **Barra de Busca Única**: Pesquisa instantânea com debounce de 150ms em títulos, descrições, tags e categorias.
- **Filtros por Pílulas de Categoria**: Seleção rápida entre *Frutas*, *Verduras & Folhas*, *Legumes*, *Orgânicos* e *Temperos*.
- **Badges de Estoque em Tempo Real**: Alertas visuais automáticos para `Sob Encomenda`, `Última Unidade`, `Poucas Unidades`, `Esgotado` e `Destaque`.
- **Deep Linking por URL Única**: Cada produto possui link exclusivo (`/?p=HF007`) com suporte nativo ao histórico do navegador.
- **Modal Interativo com Rodapé Fixo**: Botões de ação ("Adicionar ao Carrinho" e "Encomendar no WhatsApp") sempre visíveis (`sticky`) no rodapé do modal.
- **Carrinho Lateral Deslizante**: Ajuste de quantidades, formulário de entrega, cálculo de frete e notas de entrega.
- **Finalização Direta pelo WhatsApp**: Gera mensagem formatada e pronta para envio à equipe de atendimento.

### ⚙️ Painel de Administração Completo (`/admin`)
- **CRUD de Produtos**: Adicionar, editar, duplicar e excluir produtos do catálogo.
- **Gestão de Estoque e Disponibilidade**: Alteração rápida de saldo, marcação sob encomenda e seleção de destaques.
- **Backup e Importação/Exportação JSON**: Exportação imediata do arquivo `produtos.json` com todas as alterações ou importação de arquivos de backup.
- **Configurações da Loja**: Personalização do número de WhatsApp, taxas de entrega e horários de funcionamento.

### 📱 Progressive Web App (PWA) e Desempenho
- **Cache Offline Inteligente**: Service Worker (`sw.js`) com estratégia Cache-First para assets estáticos e Stale-While-Revalidate para o catálogo.
- **Instalável**: Manifesto Web completo (`manifest.webmanifest`) permitindo instalação em dispositivos móveis e desktop.
- **Zero Dependências**: Execução limpa e ultrarrápida sem etapas pesadas de build.

---

## 🚀 Como Executar Localmente

Nenhuma dependência externa ou instalação de Node/NPM é obrigatória:

```bash
# Usando Python 3 (Recomendado)
python -m http.server 8000

# Usando Node.js (npx serve)
npx serve .
```

- **Vitrine**: [`http://localhost:8000`](http://localhost:8000)
- **Painel Admin**: [`http://localhost:8000/admin`](http://localhost:8000/admin)

---

## 📁 Estrutura do Repositório

```text
├── index.html                 # Vitrine principal da loja
├── 404.html                   # Página 404 estática
├── offline.html               # Página de fallback PWA offline
├── manifest.webmanifest       # Manifesto Web PWA
├── sw.js                      # Service Worker para cache e PWA
├── admin/                     # Painel Administrativo
│   ├── index.html             # Interface do painel admin
│   ├── admin.js               # Lógica de CRUD e gestão de dados
│   └── admin.css              # Estilos visuais do admin
├── assets/
│   ├── css/                   # Estilos da vitrine
│   │   ├── variables.css      # Design tokens e variáveis de cor
│   │   ├── layout.css         # Estrutura e grids
│   │   ├── components.css     # Cards, badges, modais e carrinho
│   │   ├── responsive.css     # Media queries responsivas
│   │   └── style.css          # Agregador principal de estilos
│   ├── js/                    # Módulos JavaScript nativos (ES6)
│   │   ├── app.js             # Inicialização e estado central
│   │   ├── catalog.js         # Renderização do catálogo e estoque
│   │   ├── cart.js            # Carrinho de compras e totais
│   │   ├── modal.js           # Modal de produto e roteamento de URL
│   │   ├── search.js          # Busca instantânea multi-campo
│   │   ├── filters.js         # Filtragem por categoria e ordenação
│   │   ├── pagination.js      # Cálculo dinâmico de páginas
│   │   ├── whatsapp.js        # Formatador de mensagem WhatsApp
│   │   └── utils.js           # Formatador de moeda (R$) e utilitários
│   └── images/                # Fotos de produtos e logomarca
├── data/
│   └── produtos.json          # Catálogo canônico inicial de produtos
├── docs/                      # Documentação Técnica Bilíngue
│   ├── pt-BR/                 # Documentação em Português
│   ├── en/                    # Documentação em Inglês
│   └── validation-config.yaml # Configuração do linter de documentação
├── scripts/
│   └── docs_lint.py           # Validador automatizado da documentação
└── Makefile                   # Atalhos para comandos de validação
```

---

## 📚 Índice da Documentação

A documentação detalhada está organizada de forma modular:

| Tema | Descrição | Link (pt-BR) | Link (EN) |
| --- | --- | --- | --- |
| **Visão Geral & IA** | Contexto para IA e guias do sistema | [ai-context.md](docs/pt-BR/ai-context.md) | [ai-context.md](docs/en/ai-context.md) |
| **Arquitetura** | Arquitetura do sistema, reatividade e PWA | [architecture/](docs/pt-BR/architecture/architecture-overview.md) | [architecture/](docs/en/architecture/architecture-overview.md) |
| **Aplicação** | Detalhamento da vitrine, admin, carrinho e modais | [application/](docs/pt-BR/application/storefront-catalog.md) | [application/](docs/en/application/storefront-catalog.md) |
| **Contratos** | Esquema do produtos.json, LocalStorage e WhatsApp | [contracts/](docs/pt-BR/contracts/produtos-json-schema.md) | [contracts/](docs/en/contracts/produtos-json-schema.md) |
| **Operações** | Desenvolvimento local, deploy e backups | [operations/](docs/pt-BR/operations/local-development.md) | [operations/](docs/en/operations/local-development.md) |
| **Segurança** | Modelo de segurança client-side e privacidade | [security/](docs/pt-BR/security/client-security-model.md) | [security/](docs/en/security/client-security-model.md) |

---

## 🛠️ Validação e Qualidade

Para verificar a integridade dos links, esquemas e paridade da documentação:

```bash
# Validar toda a documentação
python scripts/docs_lint.py validate

# Gerar relatório de saúde da documentação
python scripts/docs_lint.py report
```

---

## 🌐 Publicação (Deploy)

Por ser uma aplicação totalmente estática, pode ser publicada gratuitamente:

- **GitHub Pages**: Configurar a branch `main` e a pasta raiz `/`.
- **Vercel**: Importar o repositório sem comandos adicionais de build.
- **Netlify**: Publicar apontando para o diretório raiz `.`.

---

## 📄 Licença

Este projeto está sob a licença [MIT](LICENSE).
