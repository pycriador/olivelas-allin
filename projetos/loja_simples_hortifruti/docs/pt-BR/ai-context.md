---
id: "DOC-AI-CTX"
title: "Contexto para IA e Assistentes de Código"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Guide"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Contexto para IA e Assistentes de Código

> Idioma: Português (pt-BR) | [English (EN)](../en/ai-context.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Contexto da Aplicação

O **Hortifruti Natural** é uma aplicação web de comércio eletrônico para produtos frescos (frutas, verduras, legumes, orgânicos e temperos). O projeto opera com arquitetura estática, executando exclusivamente no navegador do cliente sem backend ativo, persistindo dados locais através de `localStorage` e integrando-se ao WhatsApp para fechamento de vendas.

## Localização dos Arquivos Principais

- **Vitrine Principal**: [index.html](../../index.html) e scripts em `assets/js/` ([app.js](../../assets/js/app.js), [catalog.js](../../assets/js/catalog.js), [cart.js](../../assets/js/cart.js), [modal.js](../../assets/js/modal.js), [filters.js](../../assets/js/filters.js), [search.js](../../assets/js/search.js), [whatsapp.js](../../assets/js/whatsapp.js), [utils.js](../../assets/js/utils.js)).
- **Painel Administrativo**: [admin/index.html](../../admin/index.html), [admin/admin.js](../../admin/admin.js) e [admin/admin.css](../../admin/admin.css).
- **Catálogo Base de Dados**: [data/produtos.json](../../data/produtos.json).
- **Estilos CSS**: [assets/css/style.css](../../assets/css/style.css), [assets/css/components.css](../../assets/css/components.css), [assets/css/layout.css](../../assets/css/layout.css), [assets/css/responsive.css](../../assets/css/responsive.css), [assets/css/variables.css](../../assets/css/variables.css).
- **PWA e Service Worker**: [sw.js](../../sw.js) e [manifest.webmanifest](../../manifest.webmanifest).

## Regras de Implementação para Assistentes de IA

1. **Preservação de Padrões ES6+**: Não introduza dependências externas desnecessárias (Node/NPM em tempo de execução). Utilize ES Modules nativos.
2. **Sincronização de Estoque**: A lógica em [catalog.js](../../assets/js/catalog.js) e [modal.js](../../assets/js/modal.js) define os status reais (`sob_encomenda`, `esgotado`, `poucas_unidades`, `ultima_unidade`). Todas as alterações de visualização devem respeitar essa resolução.
3. **Roteamento por URL Única**: A vitrine suporta deep linking via parâmetro de busca `?p=<ID_DO_PRODUTO>`. Ao abrir um modal, o histórico é atualizado sem recarregar a página (`history.pushState`). Ao fechar, o parâmetro é removido.
4. **Modais e Rodapés Fixos**: O modal de detalhes do produto possui rodapé com botões de ação ("Adicionar ao Carrinho" e "Encomendar no WhatsApp") sempre visíveis (`position: sticky`).
5. **Seletor de Variações**: Produtos sem variações cadastradas não devem exibir caixas ou containers vazios.
6. **Validação de Documentação**: Todas as alterações na documentação devem manter paridade bilíngue (`docs/pt-BR/` e `docs/en/`) e passar na verificação `python scripts/docs_lint.py validate`.
