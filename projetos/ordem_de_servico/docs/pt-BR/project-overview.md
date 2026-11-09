---
title: "Visão Geral do Projeto ServiceForge"
status: "ACCEPTED"
owner: "serviceforge-core"
updated: "2026-10-15"
---

# Visão Geral do Projeto — ServiceForge Platform

> Language: pt-BR | [English (EN)](../en/project-overview.md)
>
> Status: ACCEPTED | Versão: v1.0.0-RC1

O **ServiceForge** é um SaaS empresarial modular de alta performance desenvolvido para gestão integral de assistências técnicas, oficinas de reparo e centros de manutenção de equipamentos.

---

## 🎯 Propósito (Purpose)

Centralizar e otimizar todas as etapas do ciclo de vida de uma assistência técnica: desde a entrada e triagem de equipamentos, diagnóstico técnico, aprovação de orçamentos, execução e controle de qualidade, até a expedição, faturamento, gestão de estoque e pós-venda.

---

## 📋 Escopo (Scope)

| Módulo / Capacidade | Descrição | Status |
| :--- | :--- | :--- |
| **Ordens de Serviço (OS)** | Gestão completa com 30+ sub-abas de processo (diagnóstico, peças, serviços, laudo, timeline, assinaturas). | Concluído (v1.0.0-RC1) |
| **Clientes & Ativos** | Cadastro unificado PF/PJ, contatos, múltiplos endereços e inventário de equipamentos por número de série. | Concluído (v1.0.0-RC1) |
| **Financeiro** | Contas a pagar, contas a receber, plano de contas, conciliação e faturamento. | Concluído (v1.0.0-RC1) |
| **Estoque & Compras** | Controle de almoxarifados múltiplos, movimentações, saldo mínimo e ordens de compra de fornecedores. | Concluído (v1.0.0-RC1) |
| **Recursos Humanos & CRM** | Técnicos, apontamento de horas, comissões por produtividade e pipeline de oportunidades comerciais. | Concluído (v1.0.0-RC1) |
| **Automação & Eventos** | Event bus reativo com 45+ eventos de domínio e regras de transição de estado. | Concluído (v1.0.0-RC1) |
| **Administração & Multi-empresa** | Suporte multi-empresa (*multi-tenancy*), controle de acesso RBAC e auditoria. | Concluído (v1.0.0-RC1) |
| **Design Responsivo & Temas** | Suporte desktop/mobile com alternador de temas claro/escuro e 6 paletas de cor. | Concluído (v1.0.0-RC1) |

---

## 🚫 Não-Objetivos (Non-Goals)

| Não-Objetivo | Justificativa |
| :--- | :--- |
| **Processador de Pagamentos Proprietário** | O ServiceForge integra com gateways de mercado (Stripe, Mercado Pago) via conectores, sem agir como banco ou adquirente direto. |
| **ERP Monolítico Contábil/Fiscal Pesado** | Emissão fiscal é delegada a conectores especializados via webhooks e APIs externas. |
| **Armazenamento de Senhas em Claro** | Autenticação estritamente delegada ao Supabase Auth via tokens JWT protegidos por RLS. |
