---
title: "Nome do Contrato"
status: "DRAFT"
owner: "time-ou-role"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
review_date: "YYYY-MM-DD"
version: "1.0"
contract_type: "API"
---

# Nome do Contrato

> Language: [English (EN)](../../en/templates/contract.md) | Português (pt-BR)
>
> Status: ACCEPTED
>
> Documentation Standard v1.0

Marque seções como **Não aplicável** quando não se aplicarem. Não invente endpoints, campos, códigos de erro ou garantias sem evidência. Classifique claims como Confirmed / Inferred / Unknown / Proposed.

## Propósito

<!-- Por que este contrato existe e que capacidade expõe. -->

## Escopo

| In scope | Fora do escopo |
| --- | --- |
| | |

## Participantes

| Participante | Papel | Notas | Classificação |
| --- | --- | --- | --- |
| | produtor / consumidor / intermediário / outro | | Confirmed / Inferred / Unknown |

## Produtor

| Campo | Valor | Classificação |
| --- | --- | --- |
| Sistema / componente | | Confirmed / Inferred / Unknown |
| Time / proprietário | | |
| Evidência | | |

## Consumidor

| Consumidor | Notas | Classificação |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown |

## Tipo de Contrato

- [ ] API
- [ ] Evento
- [ ] Mensagem
- [ ] Arquivo
- [ ] Comando
- [ ] Callback
- [ ] Biblioteca
- [ ] Dados
- [ ] Integração
- [ ] Outro: <!-- especifique -->

## Protocolo

| Campo | Valor | Classificação |
| --- | --- | --- |
| Protocolo | | Confirmed / Inferred / Unknown / Não aplicável |
| Estilo de interação | request-response / fire-and-forget / stream / batch / outro | |

## Endpoint / Canal / Interface

| Campo | Valor | Classificação |
| --- | --- | --- |
| Localizador | | Confirmed / Inferred / Unknown / Não aplicável |
| Método / operação / verbo | | Confirmed / Inferred / Unknown / Não aplicável |
| Notas | | |

## Solicitação / Entrada

| Campo / parte | Tipo | Obrigatório | Descrição | Classificação |
| --- | --- | --- | --- | --- |
| | | sim / não | | Confirmed / Inferred / Unknown |

## Resposta / Saída

| Campo / parte | Tipo | Obrigatório | Descrição | Classificação |
| --- | --- | --- | --- | --- |
| | | sim / não | | Confirmed / Inferred / Unknown |

## Schema

```text
<!-- schema ou caminho para o schema -->
```

| Tópico | Valor | Classificação |
| --- | --- | --- |
| Localização do schema | | Confirmed / Inferred / Unknown / Não aplicável |
| Formato do schema | | |

## Semântica

| Conceito | Significado | Efeitos colaterais | Classificação |
| --- | --- | --- | --- |
| | | | Confirmed / Inferred / Unknown |

## Autenticação

| Mecanismo | Notas | Classificação |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown / Não aplicável |

<!-- Sem valores de secrets. Documente referências de secrets apenas. -->

## Autorização

| Regra | Notas | Classificação |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown / Não aplicável |

## Validação

| Regra | Aplicada onde | Notas | Classificação |
| --- | --- | --- | --- |
| | produtor / consumidor / gateway / outro | | Confirmed / Inferred / Unknown / Não aplicável |

## Erros

| Erro / Condição | Retryable | Ação do consumidor | Classificação |
| --- | --- | --- | --- |
| | sim / não / Unknown | | Confirmed / Inferred / Unknown / Não aplicável |

## Comportamento de Retry

| Tópico | Valor | Classificação |
| --- | --- | --- |
| Condições retryable | | Confirmed / Inferred / Unknown / Não aplicável |
| Máx. de tentativas | | |
| Backoff | | |
| Condições não retryable | | |

## Timeout

| Timeout | Valor | Classificação |
| --- | --- | --- |
| Timeout do cliente / consumidor | | Confirmed / Inferred / Unknown / Não aplicável |
| Timeout do servidor / produtor | | |
| Outro | | |

## Idempotência

| Tópico | Valor | Classificação |
| --- | --- | --- |
| Idempotente | sim / não / Unknown / Não aplicável | |
| Chave / estratégia de idempotência | | Confirmed / Inferred / Unknown / Não aplicável |

## Ordenação

| Tópico | Valor | Classificação |
| --- | --- | --- |
| Garantia de ordenação | nenhuma / por-chave / global / Unknown / Não aplicável | Confirmed / Inferred / Unknown / Não aplicável |
| Notas | | |

## Semântica de Entrega

| Tópico | Valor | Classificação |
| --- | --- | --- |
| Garantia de entrega | at-most-once / at-least-once / exactly-once / Unknown / Não aplicável | Confirmed / Inferred / Unknown / Não aplicável |
| Modelo de acknowledgment | | |
| Notas | | |

## Versionamento

| Tópico | Valor | Classificação |
| --- | --- | --- |
| Versão atual | | Confirmed / Inferred / Unknown |
| Estratégia de versão | | |
| Política de depreciação | | |
| ID do contrato | | |

## Compatibilidade

| Tipo de mudança | Compatível? | Notas |
| --- | --- | --- |
| Campo opcional aditivo | | |
| Remoção de campo | | |
| Mudança de tipo | | |
| Mudança semântica | | |
| Outro | | |

## Rate Limits

| Limite | Valor | Classificação |
| --- | --- | --- |
| | | Confirmed / Inferred / Unknown / Não aplicável |

## Limites de Tamanho

| Limite | Valor | Classificação |
| --- | --- | --- |
| Tamanho do payload / mensagem / arquivo | | Confirmed / Inferred / Unknown / Não aplicável |

## Considerações de Segurança

| Tópico | Resumo | Classificação |
| --- | --- | --- |
| Sensibilidade de dados | | Confirmed / Inferred / Unknown / Não aplicável |
| Criptografia em trânsito | | |
| Manipulação de PII / secrets | | |

## Observabilidade

| Sinal | O que observar | Classificação |
| --- | --- | --- |
| Logs | | Confirmed / Inferred / Unknown / Não aplicável |
| Metrics | | |
| Traces | | |

## Exemplos

### Exemplo — sucesso

```text
<!-- exemplo representativo sem secrets ou dados sensíveis -->
```

### Exemplo — erro

```text
<!-- exemplo representativo -->
```

## Cenários de Falha

| Cenário | Impacto | Comportamento esperado | Mitigação | Classificação |
| --- | --- | --- | --- | --- |
| | | | | Confirmed / Inferred / Unknown / Não aplicável |

## Componentes Relacionados

| Componente | Relacionamento | Caminho / ID |
| --- | --- | --- |
| | produtor / consumidor / depende-de | |

## Arquitetura Relacionada

| Documento | Caminho |
| --- | --- |
| Arquitetura | |
| Contexto do sistema | |
| Fluxo de dados / sequência | |