# 📋 Roteiro de Testes Ponta a Ponta (E2E Test Automation Blueprint)

> **Documento:** Plano de Testes Operacionais & Especificação de Automação Externa  
> **Versão:** 1.0.0  
> **Ambiente:** ServiceForge Platform — Empresa Matriz (`00000000-0000-0000-0000-000000000001`)  
> **Público-Alvo:** Engenheiros de QA, Desenvolvedores SDET, Plataformas de CI/CD e Runners Unificados (Olivelas AutoRun, Playwright, Puppeteer).

---

## 🎯 1. Objetivo do Roteiro

Este roteiro estabelece o fluxo de testes automatizados completo da plataforma **ServiceForge**. Ele foi concebido para ser integrado à plataforma unificada **Olivelas AutoRun** e ser executado automaticamente contra ambientes locais (`http://localhost:8080`) e remotos.

O fluxo abrange desde a autenticação, provisionamento de clientes e equipamentos, abertura de Ordens de Serviço com o wizard passo a passo, testes de bancada, validação de todos os botões de ação e modais, módulos de suporte (Financeiro, Estoque, RH, Base de Conhecimento), até a garantia de isolamento do **Schema Dedicado `serviceforge`** no Supabase PostgreSQL.

---

## 🏢 2. Dados Mestres do Ambiente de Teste

| Parâmetro | Valor Configurado |
|---|---|
| **ID da Empresa (Tenant)** | `00000000-0000-0000-0000-000000000001` |
| **Nome da Empresa** | `ServiceForge Matriz` |
| **CNPJ** | `12.345.678/0001-90` |
| **E-mail de Contato** | `contato@serviceforge.com.br` |
| **Telefone** | `(11) 4002-8922` |
| **Usuário Executor (Admin)** | `Willian Oliveira Jesus` (`willian.o.jesus@gmail.com`) |
| **Schema PostgreSQL** | `serviceforge` (100% isolado) |
| **URL Base Local** | `http://localhost:8080` |

---

## 📑 3. Matriz de Casos de Teste (14 Cenários E2E)

| ID | Cenário / Etapa | Rota / URL | Ação Principal | Validação Crítica (Asserção) |
|---|---|---|---|---|
| **TC-01** | Autenticação & Dashboard | `/login` → `/dashboard` | Login com credenciais de administrador | Dashboard carregado com nome da empresa no topo |
| **TC-02** | Cadastro de Novo Cliente | `/service-orders/customers/list` | Clicar em "Novo Cliente", preencher e salvar | Cliente gravado em `serviceforge.customers` |
| **TC-03** | Cadastro de Nova Marca | `/service-orders/assets/brands` | Clicar em "Nova Marca", informar nome e salvar | Marca gravada em `serviceforge.brands` |
| **TC-04** | Cadastro de Categoria | `/service-orders/assets/categories` | Clicar em "Nova Categoria" e salvar | Categoria gravada em `serviceforge.categories` |
| **TC-05** | Cadastro de Equipamento | `/service-orders/assets/equipment` | Cadastrar equipamento com número de série | Equipamento gravado em `serviceforge.devices` |
| **TC-06** | Abertura de OS (Wizard) | `/service-orders/new` | Avançar 5 passos, buscar cliente, defeito e gerar | Ordem gravada em `serviceforge.service_orders` |
| **TC-07** | Listagem e Ordenação de OS | `/service-orders` | Testar ordenação de colunas e busca de texto | Tabela sem cortes laterais e ordenação ativa |
| **TC-08** | Módulo Financeiro: Contas | `/financial/accounts` | Consultar e cadastrar contas bancárias | Contas ativas em `serviceforge.fin_accounts` |
| **TC-09** | Módulo Financeiro: Contas a Pagar | `/financial/payable` | Consultar títulos a pagar e filtros | Tabela de duplicatas renderizada com sucesso |
| **TC-10** | Estoque & Catálogo de Produtos | `/inventory/products` | Testar cadastro e consulta de peças/itens | Produtos listados de `serviceforge.inv_products` |
| **TC-11** | Recursos Humanos & Técnicos | `/hr/employees` | Validar quadro de colaboradores e técnicos | Funcionários listados em `serviceforge.hr_employees` |
| **TC-12** | Base de Conhecimento Técnico | `/knowledge/library` | Consultar manuais e soluções técnicas | Artigos e categorias de conhecimento acessíveis |
| **TC-13** | Design System & Seletor de Temas | `/settings` | Alternar entre modos Claro/Escuro e paletas | CSS classes e variáveis dinâmicas atualizadas |
| **TC-14** | Isolamento do Schema `serviceforge` | PostgreSQL direto | Validar contagem de tabelas e ausência de colisões | 40 tabelas isoladas no schema `serviceforge` |

---

## 🛠️ 4. Execução Integrada no Olivelas AutoRun

O projeto está cadastrado no banco SQLite do **Olivelas AutoRun** (`data/autorun.db`) sob o slug `serviceforge-chatgpt`.

Para rodar a suíte completa:
```bash
# Execução direta via CLI no ServiceForge:
npm run test:qa

# Ou via Olivelas AutoRun:
# Acesse http://localhost:5174 e clique em "Executar" no card ServiceForge
```
