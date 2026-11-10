---
id: "DOC-CTR-STORAGE"
title: "Chaves LocalStorage e Contrato de Persistência"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Contract"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Chaves LocalStorage e Contrato de Persistência

> Idioma: Português (pt-BR) | [English (EN)](../../en/contracts/localstorage-schema.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Chaves LocalStorage e Contrato de Persistência

A persistência do lado do cliente utiliza a API `window.localStorage` do navegador para armazenar o estado operacional.

## Chaves Utilizadas

| Chave | Formato | Finalidade |
| --- | --- | --- |
| `hortifruti_produtos` | JSON Array | Catálogo de produtos modificado via Painel Administrativo |
| `hortifruti_carrinho` | JSON Array | Itens atualmente no carrinho do cliente com quantidades e variações |
| `hortifruti_loja_config` | JSON Object | Configurações da loja (telefone WhatsApp, taxa de frete, endereço) |
| `hortifruti_admin_auth` | String (Token) | Sessão local ativa do administrador |

## Exemplo do Carrinho (`hortifruti_carrinho`)

```json
[
  {
    "id": "HF001",
    "nome": "Banana Prata Orgânica",
    "preco": 6.49,
    "quantidade": 2,
    "variacao": "1 kg (Padrão)",
    "imagem": "assets/images/products/hf001.svg"
  }
]
```

Consulte [whatsapp-message-contract.md](whatsapp-message-contract.md) para o formato final gerado no checkout.
