---
id: "DOC-OPS-MAINT"
title: "Manutenção de Catálogo, Backup e Restauração"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Operations"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Manutenção de Catálogo, Backup e Restauração

> Idioma: Português (pt-BR) | [English (EN)](../../en/operations/catalog-maintenance.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Manutenção de Catálogo, Backup e Restauração

O catálogo da loja pode ser mantido diretamente pelo código ou pelo Painel Administrativo.

## Métodos de Atualização

### Método 1: Via Painel Administrativo (Recomendado para Operadores)
1. Acesse `admin/index.html`.
2. Adicione, edite ou exclua produtos, alterando preços e estoques.
3. Clique em **Exportar JSON (Backup)** para baixar o arquivo `produtos.json` com todas as alterações.
4. Substitua o arquivo local `data/produtos.json` e faça o commit no Git para persistir a base definitiva.

### Método 2: Edição Direta no Arquivo JSON (Para Desenvolvedores)
1. Abra `data/produtos.json` no editor de código.
2. Siga a estrutura definida em [../contracts/produtos-json-schema.md](../contracts/produtos-json-schema.md).
3. Salve o arquivo e limpe o `localStorage` do navegador para recarregar a nova base.

Consulte [local-development.md](local-development.md) para testar as alterações localmente.
