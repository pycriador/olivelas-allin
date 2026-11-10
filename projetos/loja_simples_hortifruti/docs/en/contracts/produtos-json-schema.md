---
id: "DOC-CTR-SCHEMA"
title: "Product Catalog Data Schema (produtos.json)"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Contract"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Product Catalog Data Schema (produtos.json)

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/contracts/produtos-json-schema.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Product Catalog Data Schema (produtos.json)

The [data/produtos.json](../../../data/produtos.json) file represents the canonical Source of Truth for the initial product catalog.

## Schema Specification

The file contains a JSON array of product objects structured as follows:

```json
{
  "id": "HF001",
  "nome": "Banana Prata Orgânica",
  "descricao": "Bananas prata selecionadas e doces, cultivadas sem agrotóxicos.",
  "categoria": "Frutas",
  "preco": 7.99,
  "preco_promocional": 6.49,
  "unidade_medida": "kg",
  "imagem": "assets/images/products/hf001.svg",
  "estoque_atual": 24,
  "sob_encomenda": false,
  "status_disponibilidade": "em_estoque",
  "destaque": true,
  "organico": true,
  "tags": ["banana", "fruta", "organico", "potassio"],
  "variacoes": [
    { "nome": "1 kg (Padrão)", "preco_ajuste": 0.00 },
    { "nome": "Penca Grande (~2 kg)", "preco_ajuste": 6.00 }
  ]
}
```

## Field Definitions

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | String | Yes | Alphanumeric unique identifier (e.g. `HF001`) |
| `nome` | String | Yes | Product display title |
| `descricao` | String | Yes | Product description and details |
| `categoria` | String | Yes | Category name (`Frutas`, `Verduras & Folhas`, `Legumes`, etc.) |
| `preco` | Number | Yes | Regular unit price |
| `preco_promocional` | Number | No | Discounted promotional price |
| `unidade_medida` | String | Yes | Measurement unit: `kg`, `unidade`, `maço`, `bandeja` |
| `imagem` | String | Yes | Relative asset path or absolute URL |
| `estoque_atual` | Number | Yes | Current units or kg in stock |
| `sob_encomenda` | Boolean | No | Indicates made-to-order harvest status |
| `status_disponibilidade`| String | No | `em_estoque`, `sob_encomenda`, or `esgotado` |
| `destaque` | Boolean | No | Highlights item in featured showcases |
| `organico` | Boolean | No | Displays certified organic badge |
| `tags` | Array[String]| No | Additional indexing keywords |
| `variacoes` | Array[Object]| No | Optional size/pack variations with price offsets |

See [localstorage-schema.md](localstorage-schema.md) for browser persistence rules.
