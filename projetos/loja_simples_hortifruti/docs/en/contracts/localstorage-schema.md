---
id: "DOC-CTR-STORAGE"
title: "LocalStorage Keys & Persistence Contract"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Contract"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# LocalStorage Keys & Persistence Contract

> Idioma: English (EN) | [Português (pt-BR)](../../pt-BR/contracts/localstorage-schema.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## LocalStorage Keys & Persistence Contract

Client-side persistence uses the standard `window.localStorage` browser API to store runtime state.

## Storage Keys

| Key | Format | Purpose |
| --- | --- | --- |
| `hortifruti_produtos` | JSON Array | Active product catalog overrides edited via Admin Panel |
| `hortifruti_carrinho` | JSON Array | Customer shopping cart items, quantities, and selected options |
| `hortifruti_loja_config` | JSON Object | Store settings (WhatsApp phone, shipping fee, address) |
| `hortifruti_admin_auth` | String (Token) | Local admin active session indicator |

## Cart Storage Example (`hortifruti_carrinho`)

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

See [whatsapp-message-contract.md](whatsapp-message-contract.md) for final WhatsApp message generation.
