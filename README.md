# Olivelas Allin — Fundação Mock V1 (`v0.0.1`)

Plataforma SaaS multiempresa modular para pequenas e médias empresas contratarem sob demanda apenas os módulos de gestão necessários (**Allin Core**, **Allin Estoque**, **Allin Financeiro**, **Allin CRM**, **Allin Vendas e Pedidos**, **Allin Contratos**, **Allin Suporte**, **Allin API Hub**, **Allin Analytics** e **Allin Equipe e Permissões**).

---

## Principais Recursos (Versão `0.0.1`)

1. **Arquitetura Multiempresa & Isolamento Lógico (Tenant Isolation):**
   - Console Global (`/app/global`) e Ambiente da Empresa Cliente (`/app/empresa/:empresaId`).
   - Proteção contra acesso cruzado por manipulação de URL (`Tenant Isolation Guard`).
2. **Controle de Acesso Baseado em Hierarquia (HBAC):**
   - 6 papéis iniciais (`Super Admin`, `Admin`, `Financeiro`, `Cliente`, `Gerente`, `Funcionário`).
   - Permissões granulares por módulo, recurso e ação (`view`, `create`, `edit`, `archive`, `export`, `approve`, `administer`), delegação segura sem elevação de privilégios e matriz efetiva de 105 células por usuário.
3. **Persistência Local Real em IndexedDB & Repositórios Desacoplados:**
   - Armazenamento persistente em `IndexedDB` (`olivelas_allin_v1_db`) com camada de repositórios pronta para futura migração a uma API REST/GraphQL.
   - **Zero exclusão física (`hard delete`)**: todos os registros de negócio utilizam arquivamento lógico com motivo obrigatório, restauração e trilha de auditoria.
4. **Seletor Visual de 30 Temas (15 Temas Claros + 15 Temas Escuros):**
   - 15 paletas claras corporativas (`01. Papel Mineral` até `15. Platina Executiva`).
   - 15 paletas escuras corporativas (`01. Ardósia Comando` até `15. Monólito Ébano`) + modo automático do sistema.
5. **Visual Mobile 100% Responsivo:**
   - Drawer lateral com backdrop touch, tabelas responsivas via `@container (width < 600px)`, cabeçalhos adaptáveis e formulários fluidos.
6. **Segurança & Governança no Código:**
   - Zero senhas reais, chaves privadas ou PAN de cartão armazenados no código.
   - Credenciais e tokens exibidos apenas com máscara parcial (`****` / `••••`).
   - Proteção Anti-SSRF no executor simulado do API Hub.
7. **Internacionalização Completa (`PT-BR`, `EN`, `ES`):**
   - Tradução de toda a interface e formatação monetária/datas nativa via `Intl`.

---

## Como Executar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Executar verificação de tipos TypeScript
npm run typecheck

# Executar suíte de testes automatizados (Vitest + Fake-IndexedDB)
npm test

# Gerar build de produção
npm run build
```
