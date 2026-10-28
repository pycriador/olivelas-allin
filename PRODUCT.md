# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: React 19 + TypeScript (strict) + Vite + React Router 7 + IndexedDB repository architecture

## Users

- **Pequenas e Médias Empresas (Clientes, Gerentes e Funcionários):** Empresas que desejam contratar exclusivamente os módulos operacionais de que precisam (Core, Estoque, Financeiro, CRM, Vendas, Equipe, API Hub, Contratos, Suporte, Analytics), operando em um ambiente isolado por empresa (`/app/empresa/:empresaId`) com permissões granulares e trilhas de auditoria completas.
- **Operadores Internos da Plataforma (Super Admin, Admin e Financeiro):** Equipes responsáveis por governança multiempresa, catálogo comercial de módulos, contratos e aditivos, conciliação e cobranças recorrentes, suporte por tickets, gerenciamento de APIs/tokens e auditoria global (`/app/global`).

## Product Purpose

Olivelas Allin é uma plataforma SaaS multiempresa modular que permite a pequenas empresas contratar e operar sob demanda apenas os módulos de gestão necessários, com governança empresarial, controle de acesso hierárquico (HBAC), faturamento unificado e auditoria ponta a ponta. Nesta Fundação Mock V1, a aplicação opera 100% localmente no navegador com persistência real em IndexedDB e camada de repositórios desacoplada para futura migração para API real.

## Positioning

Diferente de ERPs monolíticos caros ou ferramentas fragmentadas sem governança, o Olivelas Allin combina contratação modular sob demanda (ativação imediata por contrato versionado sem perda de dados históricos na desativação) com controle de acesso hierárquico configurável (HBAC com matriz efetiva e rastreio de origem da permissão), isolamento lógico rigoroso por tenant e console técnico integrado (API Hub estilo Postman e auditoria imutável).

## Operating Context

- Uso diário em navegadores desktop, tablet e mobile, sob iluminação variável de escritório (suporte completo a tema claro e escuro).
- Operação multilíngue nativa em Português (PT-BR, padrão), Inglês (EN) e Espanhol (ES), com formatação localizada de datas, moedas e números.
- Listagens administrativas densas baseadas em tabelas com filtros persistidos na URL (`?status=...&search=...&page=...&pageSize=...&sort=...&order=...`), ordenação, paginação real sobre os dados locais e exportação CSV.
- URLs dedicadas para todas as visualizações de detalhe e páginas de edição completas (sem substituir páginas de edição por modais).

## Capabilities and Constraints

- **Isolamento Multiempresa:** Nenhuma empresa pode visualizar ou acessar dados de outra empresa mesmo alterando IDs manualmente na URL.
- **Seis Papéis Iniciais + HBAC Configurável:** Super Admin (com suporte auditado e explícito ao contexto de uma empresa), Admin, Financeiro, Cliente, Gerente e Funcionário.
- **Zero Exclusão Física:** Registros de negócio nunca são deletados fisicamente pela interface; utilizam arquivamento com motivo, data, responsável e restauração autorizada.
- **Transparência de Simulação:** Operações demonstrativas (autenticação mock, assinaturas contratuais, cobranças/reembolsos, simulador local de endpoints HTTP no API Hub) são explicitamente identificadas como simuladas. Dados pertencem ao IndexedDB do navegador local e contam com restauração explícita para o estado inicial de fábrica.
- **Segurança de Dados:** Proibição absoluta de chaves secretas reais, senhas reais ou números completos de cartão/CVV em armazenamento ou logs de auditoria. Tokens exibem seu valor completo apenas no instante da criação demonstrativa.

## Brand Commitments

- Identidade visual discreta, confiável e empresarial: tipografia legível, hierarquia clara, espaçamento consistente, navegação lateral compacta, cabeçalhos com breadcrumbs e design tokens centralizados.
- Evitar gradientes excessivos, cores neon, sombras exageradas, excesso de bordas arredondadas, animações desnecessárias ou aparência de protótipo genérico.

## Evidence on Hand

- Todos os dados iniciais são sintéticos e demonstrativos (empresas de exemplo isoladas, 6 usuários para cada papel, catálogo de 10 módulos comerciais Allin, contratos versionados, cobranças/pagamentos/parcelas, serviços e coleções no API Hub, tickets de suporte e eventos de auditoria).
- Preços, planos, assinaturas e transações são rotulados de forma transparente como ilustrativos/simulados.

## Product Principles

1. **Integridade e Rastreabilidade:** Toda mutação relevante gera evento de auditoria com valores anteriores/posteriores, autor e correlação; nenhum dado de negócio sofre exclusão física.
2. **Isolamento e Menor Privilégio:** O escopo da empresa (`empresaId`) e a matriz efetiva HBAC governam tanto a construção da navegação quanto a proteção direta de cada rota e ação.
3. **Estado Compartilhável por URL:** Toda listagem reflete busca, filtros, ordenação e paginação em query parameters, preservando o estado ao recarregar ou compartilhar links.
4. **Arquitetura Pronta para Produção:** Componentes consomem serviços e repositórios tipados em TypeScript estrito sobre IndexedDB, nunca acoplados diretamente ao armazenamento.

## Accessibility & Inclusion

- Navegação por teclado, foco visível, semântica HTML nativa (`<table>`, `<dialog>`, formulários validados com feedback por campo após interação), contraste adequado nos temas claro e escuro, e internacionalização completa em PT-BR, EN e ES.
