---
title: "Perfil do Serviço"
status: "ACCEPTED"
owner: "willian.o.jesus@gmail.com"
created: "2026-09-01"
updated: "2026-09-11"
version: "1.0"
service_id: "ai-wpp-image-analyzer"
criticality: "High"
---

# Perfil do Serviço

> Language: [English (EN)](../../en/operations/service-profile.md) | Português (pt-BR)
>
> Status: ACCEPTED

## Propósito

Cartão de identidade operacional do serviço AI WhatsApp Image Analyzer.

## Escopo

| In scope | Fora do escopo |
| --- | --- |
| Pipeline de análise de imagem | Streaming em tempo real |
| Pipeline de geração de artes | Processamento de pagamento |
| Gestão IAM | Deploy multi-região |
| Landing page da vitrine | Treinamento ML customizado |
| PWA Web Share Target | App mobile nativo |

## Propriedade

| Papel | Proprietário | Notas |
| --- | --- | --- |
| Serviço / produto | willian.o.jesus@gmail.com | Global admin |
| Técnico | willian.o.jesus@gmail.com | Desenvolvimento full-stack |
| Operacional / on-call | willian.o.jesus@gmail.com | Desenvolvedor solo |
| Escalação | willian.o.jesus@gmail.com | Ponto único de contato |

## Criticidade

| Campo | Valor |
| --- | --- |
| Nível | Alta |
| Justificativa | Produto principal de análise de imagem com IA |
| Impacto ao usuário/negócio se indisponível | Usuários não conseguem analisar imagens ou gerar artes |

## Links de Arquitetura

| Tema | Link |
| --- | --- |
| Visão geral da arquitetura | [arquitetura.md](../arquitetura.md) |
| Domínios de falha | [arquitetura.md](../arquitetura.md) — Domínios de Falha |
| Mapa de dependências | [arquitetura.md](../arquitetura.md) — Dependências |

## Dependências

| Dependência | Tipo | Criticidade | Impacto de falha | Detecção | Mitigação / recuperação |
| --- | --- | --- | --- | --- | --- |
| Supabase | runtime | Crítica | Falha completa | Health check | Investigação manual |
| Gateway Lovable IA | runtime | Alta | Análise indisponível | Códigos de erro HTTP | Fallback para OpenAI/Gemini |
| OpenAI API | runtime | Média | Provedores reduzidos | Códigos de erro HTTP | Usar outros provedores |
| Gemini API | runtime | Média | Sem recursos Gemini | Códigos de erro HTTP | Usar outros provedores |

## Contratos (Relevantes para Confiabilidade)

| Contrato | Timeout | Retry | Idempotência | Notas |
| --- | --- | --- | --- | --- |
| Análise de Visão IA | 30-60s | Não | Não | Resultados diferentes possíveis |
| Geração de Artes IA | 30-120s | Não | Não | Imagens diferentes possíveis |
| Supabase Storage | 10s | Não | Sim | Upload/download |
| Supabase Auth | 5s | Não | Sim | Validação JWT |

## Níveis de Serviço

| SLI | SLO | Janela | Error budget | Classificação |
| --- | --- | --- | --- | --- |
| Taxa de sucesso da análise | Não definido | — | — | Unknown |
| Latência da análise | Não definido | — | — | Unknown |
| Sucesso da geração de artes | Não definido | — | — | Unknown |

## Modos de Falha (Resumo)

| Modo de falha | Impacto | Detecção | Runbook / recuperação |
| --- | --- | --- | --- |
| Falha de provedor de IA | Análise/geração indisponível | Erros HTTP | Fallback para outros provedores |
| Falha do Supabase | Falha completa da aplicação | Health check | Investigação manual |
| Esgotamento de cota | Usuários não analisam/geram | Erro de verificação de cota | Aumentar cota do grupo |
| Resposta inválida da IA | Análise falha silenciosamente | Erro de validação Zod | Tentar novamente ou investigar prompt |
| Storage cheio | Novos uploads falham | Erro de upload | Limpar arquivos antigos ou aumentar cota |

## Observabilidade

| Tipo de sinal | Status | Notas / link |
| --- | --- | --- |
| Métricas | Parcial | ai_usage_logs rastreia custo por modelo/grupo |
| Logs | Parcial | Console.log em server functions |
| Traces | Não documentado | — |
| Health checks | Não documentado | — |
| Alertas | Não documentado | — |

## Estado Operacional

| Como o estado é determinado | Sinais Healthy / Degraded / Unavailable |
| --- | --- |
| Aplicação acessível | Healthy: página carrega, Degraded: lenta, Unavailable: 500 |

## Deploy e Mudanças

| Tópico | Link / notas |
| --- | --- |
| Deploy / validar | Auto-deploy Lovable ao commit na branch conectada |
| Postura de rollback | Seguro — reverter commit git |
| Manutenção | Manual via editor Lovable ou git |

## Recuperação

| Tópico | Status | Link |
| --- | --- | --- |
| Backup / restauração | Backups gerenciados pelo Supabase | — |
| RPO / RTO | Não definido | — |
| Disaster recovery | Não definido | — |

## Runbooks e Incidentes Relacionados

| Artefato | ID / caminho |
| --- | --- |
| Runbooks | [runbook.md](runbook.md) |
| Incidentes materiais recentes | Nenhum registrado |

## Documentação Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | [arquitetura.md](../arquitetura.md) |
| Contratos | [contratos/](../contratos/) |
| Segurança | [seguranca/seguranca.md](../seguranca/seguranca.md) |