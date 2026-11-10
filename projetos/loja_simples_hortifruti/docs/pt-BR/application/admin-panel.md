---
id: "DOC-APP-ADMIN"
title: "Painel Administrativo de Gestão"
status: "ACCEPTED"
owner: "hortifruti-dev"
authority: "Authoritative"
type: "Application"
created: "2026-09-15"
updated: "2026-09-15"
version: "1.0.0"
---

# Painel Administrativo de Gestão

> Idioma: Português (pt-BR) | [English (EN)](../../en/application/admin-panel.md)
>
> Status: ACCEPTED | Autoridade: Authoritative | Versão: 1.0.0


## Painel Administrativo de Gestão

O painel administrativo ([admin/index.html](../../../admin/index.html)) permite que o proprietário da loja gerencie todo o catálogo e visualize estatísticas do negócio.

## Funcionalidades do Painel

1. **Gestão de Produtos (CRUD Completo)**:
   - Adicionar novo produto com fotos, categorias, preços promocionais, variações e controle de estoque.
   - Edição inline ou via modal completo.
   - Exclusão com confirmação de segurança.
2. **Controle de Disponibilidade & Estoque**:
   - Ajustar quantidade em estoque (`estoque_atual`).
   - Marcar produtos como `Sob Encomenda` com um clique.
   - Marcar produtos como `Destaque` na vitrine.
3. **Exportação e Importação de Backup JSON**:
   - Download imediato do arquivo `produtos.json` atualizado.
   - Upload de arquivo JSON para restauração ou atualização em massa.
4. **Estatísticas Rápidas**:
   - Total de produtos ativos.
   - Quantidade de itens sob encomenda e esgotados.
   - Valor médio do catálogo.

Consulte [../operations/catalog-maintenance.md](../operations/catalog-maintenance.md) para o fluxo de backup e atualização do catálogo.
