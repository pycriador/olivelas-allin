---
id: "DOC-OPS-DEV"
title: "Desenvolvimento Local e Ferramentas"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Operations"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Desenvolvimento Local e Ferramentas

> Idioma: Português (pt-BR) | [English (EN)](../../en/operations/local-development.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Desenvolvimento Local e Ferramentas

Como a aplicação é 100% estática em módulos ES6 nativos, ela não requer instalação de dependências Node/npm para execução básica, bastando qualquer servidor HTTP estático local.

## Iniciando o Servidor Local

### Opção 1: Python 3 (Recomendado)
```bash
python -m http.server 8000
```
Abra `http://localhost:8000` no seu navegador.

### Opção 2: Node.js (npx serve)
```bash
npx serve .
```

## Comandos de Validação da Documentação

A integridade dos links, metadados e paridade bilíngue da documentação é validada via script padrão Python:

```bash
# Validar toda a documentação
python scripts/docs_lint.py validate

# Validar links internos
python scripts/docs_lint.py check-links

# Validar manifesto de documentação
python scripts/docs_lint.py check-manifest
```

Consulte [deployment.md](deployment.md) para publicação em produção.
