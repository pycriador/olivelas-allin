---
title: "Catalogo de Features"
status: "ACCEPTED"
owner: "rafflehub-team"
created: "2026-08-16"
updated: "2026-08-16"
version: "1.0"
authority: "Verified"
---

# Catalogo de Features

> 🇧🇷 Language: Portugues do Brasil

## Autenticacao e Usuarios

| Feature | Descricao |
|---|---|
| Login Google OAuth | Login social via Lovable Cloud Auth |
| Login Email/Senha | Autenticacao basica com registro e login |
| Recuperacao de Senvha | Fluxo de reset via email |
| Gerenciamento de Sessao | Persistencia em localStorage com auto-refresh de token |
| Status de Perfil | Controle de acesso: ACTIVE, SUSPENDED, INACTIVE, PENDING |
| Papel Automatico | Primeiro usuario registrado recebe GLOBAL_ADMIN |

## Gestao de Campanhas

| Feature | Descricao |
|---|---|
| Wizard de Criacao | Fluxo guiado multi-etapa para criar campanhas |
| Ciclo de Vida | Rascunho → Agendada → Ativa → Finalizada |
| Status Adicionais | Pausada, Cancelada, Arquivada |
| Duplicacao | Copia existente de campanha |
| Exclusao Suave | Lixeira com possibilidade de restauracao |
| Destaque/Pinada | Campanhas em destaque na landing page |
| Slug Unico | Identificador amigavel para URL publica |
| Compra Manual vs Automatica | Modo MANUAL (reserva → contato) ou AUTOMATIC (reserva → checkout → PIX) |
| Configuracoes por Campanha | SEO, share, WhatsApp contato, gateway de pagamento |

## Grade de Numeros

| Feature | Descricao |
|---|---|
| Renderizacao em Canvas | Grade virtualizada para alto desempenho |
| Selecao por Clique | Seleciona numero individual |
| Selecao por Drag | Seleciona multiplos numeros arrastando |
| QuickPick | Selecao aleatoria de numeros |
| 5 Temas Visuais | Opcoes de tema para a grade |
| Atualizacao em Tempo Real | Supabase Realtime para todos os conectados |
| Icones de Status | Indicadores visuais por estado do numero |
| Zoom/Pan | Navegacao na grade para campanhas grandes |

## Sistema de Reservas

| Feature | Descricao |
|---|---|
| Advisory Lock | Reserva atomica contra concorrencia |
| Expiracao Automatica | Reservas expiram apos tempo configuravel (pg_cron) |
| Rate Limiting | Controle de tentativas por dispositivo |
| Token de Dispositivo | Identificacao do cliente para liberacao de reserva |
| Liberacao por Token | Cancelamento de reserva pelo proprio dispositivo |

## Pagamentos

| Feature | Descricao |
|---|---|
| Checkout Online | Fluxo de pagamento completo para o cliente |
| PIX via InfinityPay | Gateway PIX |
| PIX via Mercado Pago | Gateway PIX |
| PIX via PagBank | Gateway PIX |
| Modo Manual | Registro de pagamento manual (dinheiro, transferencia, etc.) |
| Advanced Fee | Modo com taxa antecipada configuravel |
| QR Code PIX | Geracao de imagem QR code via lib qrcode |
| Copia e Cola | Codigo PIX copiavel |
| Contagem Regressiva | Timer de 15 min para pagamento |
| Webhook de Confirmacao | Recebe confirmacao do gateway e atualiza pedido |
| Idempotencia | Evita processamento duplicado via payment_events |
| Resolucao de Gateway | Hierarquia: campanha → platform_settings → primeiro disponivel |
| Configuracao de Gateways | Credenciais, ambiente SANDBOX/PRODUCTION por gateway |

## Gestao de Pedidos

| Feature | Descricao |
|---|---|
| Pedido Online | Gerado automaticamente no checkout |
| Pedido Manual | Criado pelo operador (venda presencial) |
| Pedido WhatsApp | Criado via fluxo de contato WhatsApp |
| Importacao CSV | Importacao em lote de numeros vendidos |
| Itens do Pedido | Adicionar/remover/trocar numeros vinculados |
| Transicoes de Status | OPEN → WAITING_PAYMENT → PAID → CANCELLED/EXPIRED/REFUNDED |
| Sincronizacao com Numeros | Status do pedido sincroniza automaticamente com campaign_numbers |
| Comprovantes | Upload e gestao de comprovantes de pagamento |

## Gestao de Clientes (CRM)

| Feature | Descricao |
|---|---|
| CRUD de Clientes | Criar, ler, atualizar, excluir clientes |
| Busca Inteligente | Pesquisa por nome, email, telefone, CPF |
| Historico de Compras | Lista de pedidos por cliente |
| Criacao Rapida | Criar cliente direto do checkout |
| Isolamento de Dados | Clientes isolados por proprietario (RLS) |

## Dashboard Executivo

| Feature | Descricao |
|---|---|
| KPIs de Receita | Metricas de faturamento em tempo real |
| Vendas por Canal | ONLINE, WHATSAPP, MANUAL |
| Resumo Financeiro | Entradas, pendentes, cancelados |
| Campanhas Destaque | Top campanhas por receita |
| Metricas por Campanha | Detalhamento individual de cada campanha |
| Graficos | Visualizacoes via Recharts |

## Console Administrativo

| Feature | Descricao |
|---|---|
| Gestao de Usuarios | CRUD de usuarios com papeis |
| Matriz de Permissoes | Papel × 55 permissoes |
| Configuracoes Globais | Platform settings |
| Configuracao de Gateways | Credenciais e ambiente de cada gateway |
| Exportacao de Relatorios | CSV, Excel (SheetJS), JSON |
| Logs de Auditoria | Visualizador de trilha de auditoria |
| Todas as Campanhas | Visao global de todas as campanhas |

## Notificacoes

| Feature | Descricao |
|---|---|
| Templates Baseados em Eventos | Templates configuraveis por evento |
| Canais WhatsApp | Notificacoes via WhatsApp |
| Canais Email | Notificacoes via Email |

## Geracao de Artes

| Feature | Descricao |
|---|---|
| Exportacao Canvas | Imagem PNG/JPEG da grade |
| Toggles Configuraveis | Opcoes de elementos na imagem |
| Compartilhamento WhatsApp | Compartilhar arte diretamente |

## Sorteio

| Feature | Descricao |
|---|---|
| Algoritmo Fisher-Yates | Selecao aleatoria justa e auditavel |
| Verificacao de Elegibilidade | Apenas numeros pagos participam |
| Resultados Auditados | Trilha de auditoria do sorteio |
| Registro de Vencedor | Status WINNER no numero sorteado |

## SEO

| Feature | Descricao |
|---|---|
| Open Graph | Meta tags para compartilhamento em redes sociais |
| Twitter Card | Card otimizado para Twitter/X |
| JSON-LD | Dados estruturados para mecanismos de busca |
| URLs Canonicas | URL padronizada por campanha |

## Conformidade LGPD

| Feature | Descricao |
|---|---|
| Mascaramento de Dados | Telefone, email, CPF mascarados em visualizacoes |
| Soft Delete | Exclusao suave com possibilidade de restauracao |
| Hardening de Segredos | Credenciais isoladas em service-role only |
| Trilha de Auditoria | Registro completo de acoes com actor, IP, valores |
