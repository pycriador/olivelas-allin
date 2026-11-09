# Segurança, HBAC e auditoria

## Isolamento e decisão de acesso

HBAC (Host/tenant-Based Access Control no escopo do produto) combina:

1. **Identidade:** JWT autenticado de pessoa ou API key ativa associada a usuário criador.
2. **Tenant:** tenant obtido da identidade; escopo de tenant sempre presente nas consultas de domínio.
3. **Loja:** operador limitado à sua `store_id` quando presente; API key é vinculada a uma loja. Superusuário pode selecionar tenant com `X-Tenant-ID` para tarefas globais.
4. **Permissão:** autorização por códigos atribuídos aos grupos da conta; grupos são tenant-scoped.
5. **Regra de recurso:** entregadores veem e atualizam somente pedidos atribuídos à própria conta; atribuição requer `orders.assign`.

Os filtros de tenant e loja devem existir no servidor para cada leitura e escrita. Um ID enviado no path/body não concede acesso. Testar isolamento para cada rota nova. Nunca aceitar `is_superuser` ou tenant ID de cadastro/edição público.

`tenants.manage` é exclusivo de superusuário: administradores de tenant não podem delegá-lo a um grupo ou a uma API key.

## Credenciais

- Senhas são armazenadas com o algoritmo recomendado por `pwdlib` (Argon2); mínimo 10 caracteres no contrato inicial.
- JWT assinado HS256 com expiração configurável; trocar secret invalida tokens existentes. O backend recusa secret de desenvolvimento fraco ao executar com `ENVIRONMENT=production`.
- API key usa formato aleatório `olv_...`; apenas SHA-256 e prefixo ficam persistidos. Escopos delegados não podem exceder permissões atuais do criador. Mudança de permissões posteriores também bloqueia escopo removido.
- Token de login e API key nunca são registrados em auditoria.
- Cadastro aberto do primeiro tenant não confere privilégio global.

## Auditoria

Rotas que alteram estado registram ação, ator, tenant, entidade, estado anterior/posterior minimizado e IP quando disponível: cadastro, login/erro de login, logout, loja, usuário, grupo/permissões, pedido, integração e chave. O log deve continuar mesmo quando o ator foi removido (`actor_user_id` nullable), e a UI não deve permitir edição/exclusão.

**Cuidado de evolução:** endpoints novos de mutação precisam chamar `write_audit` na mesma transação da mudança. A V1 não tem event sourcing, assinatura imutável, trilha de consulta/leitura, retenção configurável nem transporte para SIEM; inserir esses controles antes de declarar compliance/regulamentação.

## Proteção de dados

- Tracking code é uma capacidade bearer com alta entropia; compartilhe apenas com o cliente correspondente. Não use identificador sequencial.
- A resposta pública retorna dados do pedido necessários à entrega e deve ser revista para PII; nunca incluir telefone, itens ou notas internas sem decisão de produto.
- Mascarar PII em logs operacionais; não logar corpos completos de webhook.
- TLS obrigatório, CORS por origem explícita, segredo via secret manager, rate limiting e proteção de brute force antes da internet.
- Implementar controles de retenção/expurgo/exportação de dados do cliente, backup/restore testado e resposta a incidentes antes de produção.

## Pontos de revisão de segurança antes de exposição pública

Login sem rate limiting e sem refresh/revogação; logout apenas aconselha descartar JWT. Chaves não têm expiração nem endpoint de rotação. Não existe assinatura/verificação temporal de webhook; não existe política de retenção e proteção contra enumeração/rate de tracking. Criar migrations, testes de concorrência e revisão de logs/proxy antes do deploy.
