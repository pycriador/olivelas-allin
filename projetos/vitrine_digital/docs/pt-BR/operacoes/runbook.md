---
title: "Runbook — Alta Taxa de Erro na Análise de Imagem"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
severity: "MEDIUM"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
runbook_id: "rb-alta-taxa-de-erro"
---

# Runbook — Alta Taxa de Erro na Análise de Imagem

> Language: [English (EN)](../../en/operations/runbook.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Resolver situações em que as solicitações de análise de imagem estão falhando a uma taxa maior do que a normal.

## Gatilho

- Alerta: taxa de erro elevada em ai_usage_logs (status: error)
- Relato de usuário: vários usuários incapazes de analisar imagens
- Observação: status da análise travado em `pending` ou `processing`

## Pré-condições

| Pré-condição | Como verificar |
| --- | --- |
| Acesso ao dashboard do Supabase | Login em supabase.com |
| Acesso ao dashboard do Lovable | Login em lovable.dev |
| Acesso ao dashboard da OpenAI | Login em platform.openai.com |

## Notas de Segurança

- Não delete dados de produção sem backup
- Não compartilhe chaves de API ou secrets
- Documente todas as mudanças feitas durante a investigação

## Sintomas

| Sintoma | Onde observado |
| --- | --- |
| Status da análise travado em `pending` | Dashboard do Supabase → image_analysis |
| Mensagens de erro em ai_usage_logs | Dashboard do Supabase → ai_usage_logs |
| HTTP 429/402 dos provedores de IA | Logs de server function |
| Erros de validação Zod | Logs de server function |

## Impacto

| Campo | Valor |
| --- | --- |
| Impacto ao usuário / capacidade | Usuários não conseguem analisar imagens |
| Estado operacional | Degradado |
| Raio de explosão | Todos os usuários tentando análise |

## Diagnóstico

1. Verifique ai_usage_logs quanto a padrões de erro (modelo, grupo, tipo de erro)
2. Verifique as páginas de status dos provedores de IA (OpenAI, Lovable, Gemini)
3. Verifique o status do serviço do Supabase
4. Revise os logs das server functions para mensagens de erro específicas

| Verificação | Esperado | Se inesperado |
| --- | --- | --- |
| Página de status do provedor de IA | Todos operacionais | Aguardar recuperação do provedor |
| Taxa de erro em ai_usage_logs | < 5% | Investigar causa raiz |
| Status do Supabase | Saudável | Contatar suporte do Supabase |

## Ações Imediatas

1. Identifique se o problema é específico do provedor (verifique quais modelos estão falhando)
2. Se um único provedor estiver fora, verifique se o fallback está configurado corretamente
3. Se todos os provedores falharem, verifique conectividade de rede e chaves de API

## Recuperação

1. Se falha de provedor: aguarde recuperação do provedor, monitore ai_usage_logs
2. Se problema de chave de API: rotacione a chave nos secrets do Supabase ou dashboard do Lovable
3. Se problema de cota: aumente a cota do grupo no sistema IAM
4. Se problema de validação Zod: verifique atualizações do prompt e configuração do ANALYSIS_PROMPT

## Validação

| Verificação | Resultado esperado |
| --- | --- |
| Análise de imagem de teste | Status completa com `completed` |
| ai_usage_logs | Novas entradas com status `success` |
| Relatos de usuários | Sem novos relatos de erro |

## Rollback

| Condição que exige rollback | Ação |
| --- | --- |
| Mudança de prompt causou erros | Reverter ANALYSIS_PROMPT para versão anterior |
| Mudança de código causou erros | Reverter commit git no Lovable |

| Postura de rollback | Notas |
| --- | --- |
| Seguro | Git revert é direto |

## Escalação

| Condição | Escalar para | Informação a fornecer |
| --- | --- | --- |
| Todos os provedores de IA fora | Aguardar | Páginas de status dos provedores |
| Falha do Supabase | Suporte do Supabase | Logs de erro, timeline |
| Corrupção de dados | Investigação manual | Registros afetados |

## Prevenção

| Acompanhamento | Proprietário | Notas |
| --- | --- | --- |
| Adicionar endpoint de health check | willian.o.jesus@gmail.com | Monitoramento automatizado |
| Adicionar alerta na taxa de erro | willian.o.jesus@gmail.com | Detecção proativa |
| Documentar modos de falha | willian.o.jesus@gmail.com | Melhores runbooks |

## Alertas Relacionados

| Alerta | Caminho |
| --- | --- |
| — | — |

## Arquitetura Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](../arquitetura.md) |
| Perfil do serviço | [perfil-do-servico.md](perfil-do-servico.md) |

## Contratos Relacionados

| Contrato | Caminho |
| --- | --- |
| Análise de Visão IA | [contratos/](../contratos/) |