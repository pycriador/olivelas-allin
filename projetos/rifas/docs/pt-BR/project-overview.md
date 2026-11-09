---
title: "Visao Geral do Projeto"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Visao Geral do Projeto

> 🇧🇷 Language: Portugues do Brasil

## Objetivo

RaffleHub e uma plataforma SaaS profissional para gestao de rifas digitais ("rifas digitais"), projetada especificamente para o mercado brasileiro. Oferece aos operadores gestao completa do ciclo de vida de campanhas, selecao de numeros em tempo real, processamento integrado de pagamentos via PIX, gestao de relacionamento com clientes (CRM) e dashboards acionaveis — tudo em um ambiente seguro e em conformidade com a LGPD.

## Usuarios

| Papel | Descricao |
|---|---|
| **PUBLISHER** | Operadores de rifa que criam e gerenciam campanhas, acompanham vendas e realizam sorteios |
| **ADMIN** | Administradores operacionais com acesso amplo a plataforma |
| **GLOBAL_ADMIN** | Controle total da plataforma incluindo gestao de usuarios, configuracao de gateways, configuracoes gerais e auditoria |

## Escopo

### Dentro do Escopo

- **Ciclo Completo de Campanhas**: Rascunho → Agendada → Ativa → Finalizada com duplicacao, soft-delete (lixeira) e visibilidade de destaque/pinada
- **Grade de Numeros**: Renderizador em canvas virtualizado com atualizacao em tempo real, selecao por clique/drag/QuickPick e 5 temas visuais
- **Sistema de Reservas**: Reserva concorrente baseada em advisory lock com expiracao automatica e rate limiting
- **Processamento de Pagamentos**: PIX via multiplos gateways (InfinityPay, Mercado Pago, PagBank), registro manual de pagamentos, modo Advanced Fee, processamento de webhooks com idempotencia
- **Gestao de Pedidos**: Vendas manuais, pedidos via WhatsApp, checkout online, importacao CSV, transicoes de status de pedido
- **Gestao de Clientes (CRM)**: CRUD de clientes, busca inteligente, historico de compras, criacao rapida a partir do checkout
- **Dashboard em Tempo Real**: KPIs de receita, vendas por canal, resumo financeiro, campanhas destaque, metricas por campanha
- **Notificacoes**: Templates baseados em eventos nos canais WhatsApp e Email
- **Console Administrativo**: CRUD de usuarios, matriz papel × permissoes, configuracoes da plataforma, configuracao de gateways de pagamento, exportacao de relatorios (CSV/Excel/JSON), visualizador de logs de auditoria
- **Geracao de Artes**: Exportacao de imagens da grade baseada em canvas (PNG/JPEG) com toggles configuraveis e compartilhamento via WhatsApp
- **SEO**: Open Graph, Twitter Card, JSON-LD, URLs canonicas por campanha
- **Conformidade LGPD**: Mascaramento de dados, soft-delete, hardening de segredos, trilha de auditoria completa
- **Sorteio/Rifa**: Algoritmo Fisher-Yates com verificacao de elegibilidade e resultados auditados

### Fora do Escopo

- Aplicativos moveis nativos (iOS/Android)
- Internacionalizacao (i18n) — A interface e exclusivamente em Portugues do Brasil
- Metodos de pagamento nao-PIX (credito, debito, boleto estao definidos nos enums mas nao habilitados)

## URL de Producao

https://olivelas-raffle.lovable.app

## Repositorio

https://github.com/pycriador-org/olivelas-raffle

## Metricas Principais

- **Papeis de Usuario**: 3 (GLOBAL_ADMIN, ADMIN, PUBLISHER)
- **Permissoes Globais**: 55
- **Tabelas no Banco**: 17
- **RPCs no Banco**: 7+
- **Gateways de Pagamento**: 3 ativos + manual
- **Statuses de Campanha**: 7
