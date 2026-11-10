---
id: "DOC-CTR-SCHEMA"
title: "Esquema de Dados do Catálogo (produtos.json)"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Contract"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Esquema de Dados do Catálogo (produtos.json)

> Idioma: Português (pt-BR) | [English (EN)](../../en/contracts/produtos-json-schema.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Esquema de Dados do Catálogo (produtos.json)

O arquivo [data/produtos.json](../../../data/produtos.json) é a Fonte da Verdade (Source of Truth) canônica do catálogo inicial de produtos.

## Estrutura do Documento

O arquivo contém um array JSON com objetos seguindo a seguinte especificação:

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

## Dicionário de Campos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | String | Sim | Identificador único alfanumérico (ex: `HF001`) |
| `nome` | String | Sim | Nome de exibição do produto |
| `descricao` | String | Sim | Descrição completa do produto |
| `categoria` | String | Sim | Nome da categoria (`Frutas`, `Verduras & Folhas`, `Legumes`, etc.) |
| `preco` | Number | Sim | Preço padrão por unidade de medida |
| `preco_promocional` | Number | Não | Preço com desconto aplicado (se presente, risca o preço normal) |
| `unidade_medida` | String | Sim | Ex: `kg`, `unidade`, `maço`, `bandeja`, `100g` |
| `imagem` | String | Sim | Caminho relativo ou URL da imagem |
| `estoque_atual` | Number | Sim | Quantidade de unidades ou kg disponíveis |
| `sob_encomenda` | Boolean | Não | Se `true`, indica item colhido/preparado sob encomenda |
| `status_disponibilidade`| String | Não | `em_estoque`, `sob_encomenda` ou `esgotado` |
| `destaque` | Boolean | Não | Se `true`, aparece na seção de destaques da vitrine |
| `organico` | Boolean | Não | Se `true`, exibe badge de produto orgânico certificado |
| `tags` | Array[String]| Não | Termos adicionais para busca e indexação |
| `variacoes` | Array[Object]| Não | Lista de opções adicionais com ajuste de preço |

Consulte [localstorage-schema.md](localstorage-schema.md) para as regras de persistência no navegador.
