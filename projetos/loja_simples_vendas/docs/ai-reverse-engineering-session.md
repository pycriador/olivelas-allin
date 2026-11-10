# Registro de Sessão: Engenharia Reversa, Prompts & Resultados

## 🎯 Objetivo
Este documento registra a íntegra dos prompts de engenharia reversa submetidos ao Arquiteto de Software AI, as diretrizes de extração de conhecimento implícito e a síntese executiva do dossiê inicial gerado nesta sessão de trabalho.

---

## 📝 Histórico de Prompts da Sessão

### Prompt 1: Engenharia Reversa & Extração de Conhecimento Implícito
```text
Você é um Arquiteto de Software Sênior especializado em engenharia reversa de projetos.

Sua missão NÃO é apenas criar documentação.

Sua missão é extrair TODO o conhecimento implícito existente no projeto e transformá-lo em uma base de conhecimento completa capaz de permitir que outra IA reconstrua este sistema com a maior fidelidade possível.

Considere que o código-fonte original poderá deixar de existir.

Toda decisão arquitetural, estrutural, funcional e técnica precisa ficar registrada.

Sua documentação deve servir simultaneamente para:

- novos desenvolvedores;
- arquitetos;
- futuras IAs;
- reconstrução completa do sistema.

Não faça resumos.

Sempre documente profundamente.

Sempre explique o motivo das decisões.

Sempre relacione arquivos entre si.

Sempre explique dependências.

Sempre documente fluxos completos.

Sempre documente regras implícitas.

Sempre documente convenções de código.

Sempre documente padrões arquiteturais.

Sempre documente limitações conhecidas.

Sempre documente decisões técnicas.

Sempre documente possíveis riscos.

Sempre documente pontos de extensão.

Sempre documente TODO comportamento relevante encontrado no código.

Nunca assuma conhecimento prévio.

Sempre explique como cada parte funciona.

Sempre inclua exemplos.

Sempre relacione a implementação com a documentação.

Caso existam ambiguidades, explique todas as possibilidades.

Caso encontre código morto, documente.

Caso encontre TODOs, documente.

Caso encontre hacks, documente.

Caso encontre workarounds, documente.

Caso encontre decisões estranhas, explique por que provavelmente foram feitas.

A documentação deve permitir que outra IA implemente novamente o sistema sem acesso ao código original.
```

---

### Prompt 2: Estruturação da Wiki Técnica em `/docs`
```text
Crie uma pasta /docs contendo documentação detalhada separada por assunto.

Cada arquivo deve possuir:

- Objetivo
- Visão geral
- Responsabilidades
- Fluxo interno
- Relação com outros módulos
- Diagramas em Mermaid quando possível
- Exemplos
- Referências para outros documentos

Evite duplicação de informação.

Utilize links relativos entre documentos.

A documentação deve formar uma Wiki navegável.
```

---

### Prompt 3: Publicação no GitHub e Registro dos Resultados
```text
Publicar no Github os documentos criados, enviar os prompts feitos aqui, os resultados gerados tudo como documentação adicional.
```

---

## 📊 Dossiê Executivo de Engenharia Reversa (Resultado da Sessão)

Abaixo está compilada a síntese integral das descobertas, decisões e análises realizadas sobre a base de código do projeto **PB&Cia**:

### 1. Paradigma do Sistema
- **Jamstack Estático / Zero-Backend:** A aplicação não possui backend dinâmico em tempo de execução. Todos os dados são fornecidos por `data/produtos.json`.
- **Vanilla ES Modules (ESM):** Todos os módulos em `assets/js/*.js` utilizam sintaxe nativa ES6+, dispensando bundlers (Webpack/Vite/Rollup).
- **Client-Side State:** Persistência no `window.localStorage` através das chaves `catalog:cart`, `catalog:favorites` e `catalog:theme`.
- **Progressive Web App (PWA):** Service Worker com estratégia híbrida (*Cache-First* para assets estáticos e *Network-First* para dados JSON).
- **Checkout Assistido:** O encerramento do pedido gera mensagens estruturadas com codificação URL para a API do WhatsApp (`https://wa.me/...`).

---

### 2. Inventário de Arquivos e Funções Mapeadas

| Arquivo / Módulo | Linhas | Papel no Sistema |
| :--- | :---: | :--- |
| [`index.html`](../index.html) | 254 | Estrutura semântica HTML5, metatags SEO/OpenGraph, loading screen e links de CDN. |
| [`manifest.webmanifest`](../manifest.webmanifest) | 27 | Manifesto PWA standalone com ícones 192x192 e 512x512. |
| [`sw.js`](../sw.js) | 95 | Service Worker com cache `pbecia-catalog-v2` e contingência offline. |
| [`offline.html`](../offline.html) | 33 | Página fallback entregue quando não há conexão e o recurso não está em cache. |
| [`404.html`](../404.html) | 29 | Página de erro amigável para rotas inexistentes. |
| [`data/produtos.json`](../data/produtos.json) | 603 | Base com 62 produtos distribuídos em 16 categorias comerciais. |
| [`assets/js/utils.js`](../assets/js/utils.js) | 139 | Funções de DOM (`el`, `$`), debounce, escape HTML, storage seguro e Web Share API. |
| [`assets/js/catalog.js`](../assets/js/catalog.js) | 293 | Achatamento do JSON, renderização de cards, skeletons e suporte a favoritos órfãos. |
| [`assets/js/filters.js`](../assets/js/filters.js) | 170 | Pipeline de filtros por categoria, busca textual, faixa de preço e ordenação. |
| [`assets/js/pagination.js`](../assets/js/pagination.js) | 123 | Paginação dinâmica com algoritmo `sizesFor(cols, total)` para linhas completas. |
| [`assets/js/search.js`](../assets/js/search.js) | 23 | Input de busca com debounce de 250ms. |
| [`assets/js/modal.js`](../assets/js/modal.js) | 110 | Ficha técnica do produto, deep link `?p=CODIGO` e bloqueio de scroll. |
| [`assets/js/cart.js`](../assets/js/cart.js) | 198 | Gestão de carrinho com Late Binding, contagem `0` a `99+` e gaveta lateral. |
| [`assets/js/whatsapp.js`](../assets/js/whatsapp.js) | 66 | Formatação de mensagens com Markdown do WhatsApp e link `wa.me`. |
| [`assets/js/app.js`](../assets/js/app.js) | 477 | Orquestrador global, bootstrap, tema e listener de redimensionamento. |
| [`assets/css/variables.css`](../assets/css/variables.css) | 114 | Tokens CSS (Light/Dark Mode, z-indexes, espaçamentos e raios). |
| [`assets/css/style.css`](../assets/css/style.css) | 130 | Reset CSS, acessibilidade `:focus-visible` e prefers-reduced-motion. |
| [`assets/css/layout.css`](../assets/css/layout.css) | 426 | Header fixo, Hero com texto gradiente, Tools bar, Grid e Footer. |
| [`assets/css/components.css`](../assets/css/components.css) | 880 | Cards com elevação 3D, botões, modais, drawer do carrinho e toasts. |
| [`assets/css/responsive.css`](../assets/css/responsive.css) | 269 | Media queries (1024px, 768px, 640px, 480px) e gaveta mobile retrátil. |
| [`tools/img-terms.mjs`](../tools/img-terms.mjs) | 74 | Mapeamento semântico em inglês para busca no Openverse. |
| [`tools/fetch-images.mjs`](../tools/fetch-images.mjs) | 233 | CLI Node.js para download, filtro CC comercial e validação por magic numbers. |

---

### 3. Decisões Técnicas Críticas & Workarounds Registrados

1. **Chave Composta Única (`codigo-categoriaSlug`):** Garante unicidade mesmo se existirem códigos repetidos em categorias diferentes.
2. **Normalização Unicode NFD na Busca:** Permite pesquisas insensíveis a acentuação gráfica (`pão` = `pao`).
3. **Tratamento de Favoritos Órfãos:** Itens favoritados no passado que foram excluídos da tabela de preços não travam o app; são renderizados com estilo desativado e opção de desfavoritar.
4. **Late Binding do Carrinho:** Armazena apenas `{ key, code, quantity }` no `localStorage`, buscando os preços e dados ao vivo no momento de abrir a gaveta para evitar valores desatualizados.
5. **Algoritmo de Paginação por Múltiplos de Colunas:** Impede que a última linha da grade fique incompleta.
6. **Workaround `el2()` em `filters.js`:** Duplicação intencional do construtor de nós para eliminar dependência circular na inicialização das categorias.
7. **Tratamento Resiliente de Imagem (`img.onerror`):** Troca imediata da imagem corrompida pelo placeholder WebP com registro em `Set` para evitar loops de erro.

---

## 📖 Referências da Wiki
- [Índice Geral (README.md)](README.md)
- [Arquitetura Global](architecture.md)
- [Modelo de Dados](data-model.md)
- [Gerenciamento de Estado](state-management.md)
- [Módulo de Catálogo](catalog-module.md)
- [Filtros & Paginação](filters-search-pagination.md)
- [Carrinho & WhatsApp](cart-whatsapp.md)
- [Design System & UI](design-system-ui.md)
- [PWA & Offline](pwa-service-worker.md)
- [Ferramental de Imagens](tools-automation.md)
- [Guia de Reconstrução](reconstruction-guide.md)
