# Módulo: Administração & Plataforma (Admin & Platform)

O módulo de **Administração** gerencia a governança global da plataforma, políticas de segurança, controle multi-empresa, customização via metadados e o ambiente de demonstração e testes sintéticos.

---

## 🛡️ Principais Módulos Administrativos

### 1. Multi-Tenancy & Empresas (`/admin/companies`)
- Cadastro e gerenciamento de filiais e empresas independentes no mesmo banco de dados.
- Configurações individuais por empresa: logotipo, dados fiscais, regras de numeração de OS (ex: prefixos personalizados `EMP1-00001`), fuso horário e políticas financeiras.
- Troca rápida de empresa ativa (*Tenant Switcher*) para usuários com permissão multiloja.

### 2. Controle de Acesso Baseado em Papéis (RBAC) (`/admin/users`, `/admin/roles`, `/admin/permissions`)
- Matriz completa de permissões segregada por módulo e ação:
  - `admin`: Controle irrestrito sobre parametrizações e usuários.
  - `manager`: Gestão operacional, relatórios e aprovação de compras/orçamentos.
  - `technician`: Acesso focado no workspace de OS, diagnósticos, execução e testes.
  - `attendant`: Abertura de ordens, cadastro de clientes, pagamentos e entrega.
  - `financial`: Acesso restrito a contas a pagar/receber, conciliação e faturamento.
- Suporte a **Impersonação de Usuário (`/admin/impersonation`)** para auditoria e suporte técnico de TI.

### 3. Motor de Metadados (`/admin/metadata`)
Permite estender a plataforma sem necessidade de recompilar código:
- **Entidades Customizadas (`/admin/metadata/entities`)**: Criação de novas tabelas dinâmicas.
- **Campos Adicionais (`/admin/metadata/fields`)**: Inserção de campos extras nas telas de OS, Clientes ou Equipamentos (ex: *Placa do Veículo*, *Voltagem*, *Código do Lote*).
- **Formulários Dinâmicos (`/admin/metadata/forms`)**: Construtor visual de formulários de inspeção técnica.

### 4. Gerador de Ambiente de Demonstração & Testes (`/admin/demo-env`)
Ferramenta integrada para validação, treinamento de novos colaboradores e homologação:
- **Gerador de Cenários (`/admin/demo-env/generator`)**: Criação de dados realistas (clientes, ativos, ordens de serviço em diversos status, movimentações financeiras).
- **Diagnóstico de Integridade (`/admin/demo-env/integrity`)**: Validação de chaves estrangeiras órfãs e inconsistências de saldo.
- **Exportação e Importação de Cenários (`/admin/demo-env/export` & `/import`)**: Backup e restauração rápida de estados de teste com 1 clique.

### 5. Auditoria & Monitoramento (`/admin/audit`, `/admin/health`, `/admin/logs`)
- Trilha imutável com filtros por data, usuário, entidade e IP de origem.
- Painel de integridade (*Health Check*) monitorando conexões de banco de dados, storage, provedores de IA e filas de background.
