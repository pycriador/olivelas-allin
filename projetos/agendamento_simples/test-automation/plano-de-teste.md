# Plano e Roteiro de Teste Automatizado da Plataforma Odontológica

Este documento descreve a especificação técnica do roteiro de testes automatizados da plataforma odontológica com validação de telas, persistência de dados, fluxo de autenticação e comunicação com o banco de dados Supabase (PostgreSQL).

---

## 1. Visão Geral da Arquitetura de Dados & Supabase

A plataforma integra-se diretamente ao Supabase através da URL configurada no arquivo `.env`:
- **URL do Projeto Supabase:** `https://owkzswjdeetcbawilrgr.supabase.co`
- **Chave de Acesso Pública (Publishable Key):** `sb_publishable_placeholder_key`
- **Chave de Serviço / Secret:** `sb_secret_placeholder_key`

### 1.1 Tabelas da Plataforma (`supabase/schema.sql`)
1. **`patients`**: Cadastro e prontuário de pacientes (`id`, `name`, `cpf`, `phone`, `email`, `address`, `status`, `notes`, `last_appointment`).
2. **`appointments`**: Consultas odontológicas (`id`, `date`, `time`, `duration`, `patient_id`, `patient_name`, `service`, `professional`, `status`, `origin`, `notes`).
3. **`services`**: Catálogo de procedimentos odontológicos (`id`, `name`, `category`, `duration`, `price`, `status`, `description`).
4. **`plans`**: Convênios e pacotes de cuidados (`id`, `name`, `category`, `price`, `installments`, `status`, `description`, `features`).
5. **`clinic_settings`**: Configurações da clínica e horários de funcionamento (`id`, `clinic_name`, `dentist_name`, `cro`, `phone`, `whatsapp`, `business_hours`).
6. **`messages`**: Templates e histórico de notificações (`id`, `patient_id`, `patient_name`, `phone`, `channel`, `content`, `status`).
7. **`audit_logs`**: Rastreabilidade de ações administrativas (`id`, `action`, `description`, `entity_id`).

---

## 2. Roteiro Passo a Passo de Execução do Teste (Test Script Specification)

O roteiro a seguir pode ser portado e executado em qualquer ferramenta de automação (Playwright, Cypress, Selenium, Postman ou Puppeteer):

### Cenário 1: Autenticação Segura via Supabase Auth
- **Ação:** Acessar `/login.html`, preencher as credenciais de administrador (`admin@consultorio.com.br` / `Admin@2026Password!`).
- **Validação:** Requisição de token JWT com sucesso, armazenamento do perfil e redirecionamento para o dashboard (`/pages/dashboard.html`).

### Cenário 2: Cadastro Completo de Paciente (CRUD de Pacientes)
- **Ação:** Acessar `/pages/pacientes.html`, abrir modal "Novo Paciente", preencher nome, CPF, telefone, e-mail e notas clínicas.
- **Validação:** Registro gerado com ID único (`PAT-xxx`), salvo na camada `DatabaseService.patients` com persistência em banco e cache local. Listagem renderizada com menu dropdown de ações.

### Cenário 3: Agendamento de Consulta Médica (CRUD de Agendamentos)
- **Ação:** Acessar `/pages/agendar.html` (público) ou `/pages/agendamentos.html` (admin), selecionar paciente, especialidade (`Limpeza Dental`), data e horário.
- **Validação:** Agendamento gravado na tabela `appointments` com status `Confirmado`, refletindo no calendário diário e semanal da agenda.

### Cenário 4: Inspeção e Exclusão na Visão Diária da Agenda
- **Ação:** Acessar `/pages/agenda.html`, alternar para o dia do agendamento, inspecionar card de consulta e acionar exclusão.
- **Validação:** Registro cancelado/removido na tabela `appointments` e atualizado na interface visual.

### Cenário 5: Gestão de Serviços & Sincronização Dinâmica
- **Ação:** Acessar `/pages/servicos-admin.html`, criar novo procedimento (`Clareamento Dental a Laser`), definir preço e duração.
- **Validação:** Procedimento salvo em `services`. Acessar `index.html` e verificar se a seção `#tratamentos` sincronizou o serviço através do motor `LandingSync`.

### Cenário 6: Gestão de Planos & Combos
- **Ação:** Acessar `/pages/planos.html`, criar plano (`Plano Clareamento Plus`), marcar como destaque (*Mais Procurado*).
- **Validação:** Registro salvo em `plans`. Acessar `index.html` e verificar a renderização do card em `#planos`.

### Cenário 7: Grade Semanal de Horários & Expediente
- **Ação:** Acessar `/pages/horarios.html`, configurar expediente de segunda a sábado e salvar.
- **Validação:** Objeto `business_hours` gravado em `clinic_settings`. Rodapé de `index.html` e página `contato.html` atualizados.

### Cenário 8: Navegação Completa e Responsiva
- **Ação:** Percorrer todas as páginas (`dashboard.html`, `pacientes.html`, `agenda.html`, `agendamentos.html`, `servicos-admin.html`, `planos.html`, `horarios.html`, `mensagens.html`, `whatsapp.html`, `google-calendar.html`, `configuracoes.html`, `perfil.html`, `contato.html`, `servicos.html`).
- **Validação:** Nenhuma quebra de layout, nenhum erro fatal de script no console e menu mobile responsivo ativo.

---

## 3. Instruções de Execução Automatizada Local

Para rodar este roteiro de forma 100% automatizada e gerar os relatórios em pasta local:

```bash
# Executa o runner em modo headless via Chrome DevTools Protocol
node test-automation/runner.js
```

Os resultados serão gravados em:
- `test-automation/results/relatorio-testes.json`: Métricas e status detalhados de cada etapa.
- `test-automation/results/relatorio-testes.html`: Dashboard visual com screenshots e validações.
- `test-automation/results/screenshots/`: Capturas de tela de todas as etapas navegadas.
