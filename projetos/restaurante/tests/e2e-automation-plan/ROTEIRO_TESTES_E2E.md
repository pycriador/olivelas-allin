# 📋 Roteiro de Testes Ponta a Ponta (E2E Test Automation Blueprint)

> **Documento:** Plano de Testes Operacionais & Especificação de Automação Externa  
> **Versão:** 1.0.0  
> **Ambiente:** Restaurante de Testes — `Bistrô QA Lab` (`rest-qa-lab`)  
> **Público-Alvo:** Engenheiros de QA, Desenvolvedores SDET, Plataformas de CI/CD (Playwright, Cypress, Selenium, Postman).

---

## 🎯 1. Objetivo do Roteiro

Este roteiro estabelece o fluxo de testes automatizados completo da plataforma gastronômica **Olivelas Restaurant**. Ele foi concebido para ser portável e implementado em qualquer ferramenta externa de automação de testes (como Playwright, Cypress, WebdriverIO ou Robot Framework).

O fluxo abrange desde o provisionamento de um **Restaurante de Testes**, criação de dados mestres (categorias, adicionais, pratos com ponto da carne e bebidas), criação de layout de salão (setores e mesas), ciclo de atendimento (comanda, KDS da cozinha, garçom), autoatendimento digital do cliente com PIX dinâmico, até a liquidação no Caixa/PDV e liberação da mesa.

---

## 🏢 2. Dados Mestres do Ambiente de Teste

| Parâmetro | Valor Configurado |
|---|---|
| **ID do Restaurante (Tenant)** | `rest-qa-lab` |
| **Nome Fantasia** | `Bistrô QA Lab - Test Restaurant` |
| **Razão Social** | `Bistrô QA Lab Gastronomia e Tecnologia Ltda` |
| **CNPJ** | `99.888.777/0001-66` |
| **E-mail de Contato** | `contato@qalab.olivelas.com.br` |
| **Telefone** | `(11) 98888-7777` |
| **Cidade / UF** | `São Paulo / SP` |
| **Moeda / Timezone** | `BRL (R$)` / `America/Sao_Paulo` |
| **Usuário Executor (Admin)** | `Willian Jesus` (`willian.o.jesus@gmail.com`) / `QA Lead` |
| **URL Base Local** | `http://localhost:5173` |

---

## 📑 3. Matriz de Casos de Teste (14 Cenários E2E)

| ID | Cenário / Etapa | Rota / URL | Ação Principal | Validação Crítica (Asserção) |
|---|---|---|---|---|
| **TC-01** | Inicialização do Tenant de Testes | `/app` | Contextualizar `rest-qa-lab` no storage/sessão | Cabeçalho exibe `Bistrô QA Lab` |
| **TC-02** | Cadastro de Categoria Gastronômica | `/app/menu/categories` | Criar *Grelhados & Cortes Nobres* | Categoria listada e toast de confirmação |
| **TC-03** | Cadastro de Ponto da Carne (Adicional) | `/app/menu/add-ons` | Criar grupo *Ponto da Carne* (1 seleção obrigatória) | Grupo ativo com opções Mal Passado a Bem Passado |
| **TC-04** | Cadastro de Produto Principal (Corte Nobre) | `/app/menu/products` | Cadastrar *Tomahawk Prime Rib (600g)* a R$ 139,90 | Produto ativo e associado à categoria |
| **TC-05** | Cadastro de Produto Bebida | `/app/menu/products` | Cadastrar *Cerveja Artesanal IPA (500ml)* a R$ 26,00 | Bebida ativa na categoria de bebidas |
| **TC-06** | Cadastro de Setor do Salão | `/app/tables/areas` | Criar setor *Deck Panorâmico* (código `deck_panoramico`) | Setor listado no mapa de áreas com badge ciano |
| **TC-07** | Cadastro de Nova Mesa | `/app/tables` | Cadastrar *Mesa 12* (Deck Panorâmico, 4 lugares) | Mesa visível no salão com status `available` (Livre) |
| **TC-08** | Abertura de Comanda no Salão | `/app/tables/table-12` | Abrir comanda: Dra. Carolina Mendes, Garçom Roberto | Status da mesa muda para `occupied` (Ocupada) |
| **TC-09** | Lançamento de Itens com Ponto da Carne | `/app/tables/table-12` | Lançar 1x Tomahawk (Ao Ponto) + 2x Cerveja IPA | Subtotal R$ 191,90, Serviço R$ 19,19, Total R$ 211,09 |
| **TC-10** | Disparo da Comanda para a Cozinha | `/app/tables/table-12` | Clicar em "Enviar para Cozinha" | Itens mudam para "Na Fila da Cozinha" |
| **TC-11** | Monitor KDS: Início do Preparo | `/app/kds` | Chef assume ticket da Mesa 12 na grelha | Status do ticket muda para `in_preparation` |
| **TC-12** | Monitor KDS: Conclusão e Entrega ao Garçom | `/app/kds` | Marcar "Pronto" e "Entregar ao Garçom" | Ticket é finalizado e baixa registrada no KDS |
| **TC-13** | Comanda Digital Mobile do Cliente | `/comanda/table-12` | Visualizar espelho da comanda e QR Code PIX | Payload PIX EMV gerado e botão "Pedir a Conta" acionado |
| **TC-14** | Frente de Caixa: Liquidação e Liberação | `/app/cashier` | Quitar comanda R$ 211,09 via PIX e encerrar | Mesa 12 é liberada retornando para status `available` |

---

## 🛠️ 4. Especificação Detalhada por Caso de Teste

### Caso de Teste TC-01: Inicialização do Tenant de Testes
- **Rota:** `/app`
- **Pré-requisito:** Usuário autenticado com credencial administrativa.
- **Ações:**
  1. Acessar a rota raiz do painel `/app`.
  2. Verificar se o restaurante ativo é `rest-qa-lab`. Se não for, selecionar `Bistrô QA Lab` no seletor de restaurantes.
- **Asserções Esperadas:**
  - O seletor de restaurante ou o título da tela exibe `Bistrô QA Lab - Test Restaurant`.
  - O menu lateral contém as opções de Cardápio, Salão de Mesas, KDS e Caixa.

### Caso de Teste TC-02: Cadastro de Categoria Gastronômica
- **Rota:** `/app/menu/categories`
- **Ações:**
  1. Clicar no botão `+ Nova Categoria`.
  2. Preencher o campo Nome: `Grelhados & Cortes Nobres`.
  3. Preencher a Descrição: `Cortes selecionados de alta qualidade preparados na brasa com temperos artesanais.`.
  4. Manter status como `Ativo`.
  5. Clicar em `Salvar Categoria`.
- **Asserções Esperadas:**
  - Toast de notificação: *"Categoria criada com sucesso!"*.
  - A categoria `Grelhados & Cortes Nobres` é exibida na tabela/lista de categorias.

### Caso de Teste TC-03: Cadastro do Grupo de Adicionais (Pontos da Carne)
- **Rota:** `/app/menu/add-ons?tab=groups`
- **Ações:**
  1. Acessar a aba de Grupos de Adicionais.
  2. Clicar em `+ Novo Grupo`.
  3. Preencher o Nome do Grupo: `Ponto da Carne (Cortes Nobres)`.
  4. Definir Seleção Mínima = `1`, Máxima = `1` (obrigatória).
  5. Adicionar as opções: `Mal Passado` (R$ 0,00), `Ao Ponto para Mal` (R$ 0,00), `Ao Ponto` (R$ 0,00), `Bem Passado` (R$ 0,00).
  6. Clicar em `Salvar Grupo`.
- **Asserções Esperadas:**
  - O grupo `Ponto da Carne (Cortes Nobres)` aparece na listagem como obrigatório.

### Caso de Teste TC-04: Cadastro de Prato Principal (Tomahawk Prime Rib)
- **Rota:** `/app/menu/products`
- **Ações:**
  1. Clicar no botão `+ Novo Produto`.
  2. Preencher Nome: `Tomahawk Prime Rib na Brasa (600g)`.
  3. Selecionar Categoria: `Grelhados & Cortes Nobres`.
  4. Preencher Preço de Venda: `139.90`.
  5. Preencher Descrição: `Corte nobre com osso longo, grelhado no fogo forte e finalizado com manteiga de ervas e flor de sal.`.
  6. Vincular grupo de adicionais `Ponto da Carne`.
  7. Clicar em `Salvar Produto`.
- **Asserções Esperadas:**
  - Toast de confirmação: *"Produto cadastrado com sucesso!"*.
  - Produto `Tomahawk Prime Rib na Brasa (600g)` aparece ativo na listagem.

### Caso de Teste TC-05: Cadastro de Bebida (Cerveja Artesanal IPA)
- **Rota:** `/app/menu/products`
- **Ações:**
  1. Clicar no botão `+ Novo Produto`.
  2. Preencher Nome: `Cerveja Artesanal IPA Puro Malte (500ml)`.
  3. Preencher Preço: `26.00`.
  4. Descrição: `Cerveja aromática com lúpulo fresco e notas cítricas marcantes.`.
  5. Clicar em `Salvar Produto`.
- **Asserções Esperadas:**
  - Produto listado com valor unitário R$ 26,00 e status ativo.

### Caso de Teste TC-06: Cadastro de Setor do Salão (Deck Panorâmico)
- **Rota:** `/app/tables/areas`
- **Ações:**
  1. Clicar no botão `+ Novo Setor`.
  2. Preencher Nome: `Deck Panorâmico`.
  3. Preencher Código: `deck_panoramico`.
  4. Descrição: `Espaço ao ar livre com vista para o jardim e iluminação acolhedora`.
  5. Selecionar Cor: `Ciano / Turquesa`.
  6. Clicar em `Salvar Setor`.
- **Asserções Esperadas:**
  - O setor `Deck Panorâmico` é criado e exibido com badge identificador no salão.

### Caso de Teste TC-07: Cadastro de Nova Mesa (Mesa 12)
- **Rota:** `/app/tables`
- **Ações:**
  1. Clicar no botão `+ Nova Mesa`.
  2. Número da Mesa: `12`.
  3. Identificador / Rótulo: `Mesa 12`.
  4. Selecionar Setor: `Deck Panorâmico`.
  5. Capacidade: `4` pessoas.
  6. Observação: `Mesa redonda de madeira com vista para o jardim`.
  7. Clicar em `Salvar Mesa`.
- **Asserções Esperadas:**
  - A `Mesa 12` aparece no mapa de mesas com status inicial `Livre` (verde / `available`).

### Caso de Teste TC-08: Abertura de Comanda no Salão
- **Rota:** `/app/tables/table-12`
- **Ações:**
  1. Abrir a tela de detalhes da Mesa 12.
  2. Clicar em `Abrir Comanda`.
  3. Preencher Titular: `Dra. Carolina Mendes`.
  4. Selecionar Garçom: `Roberto Alves`.
  5. Ocupantes: `4`.
  6. Observações: `Comemoração especial • Mesa preferencial`.
  7. Clicar em `Confirmar e Abrir`.
- **Asserções Esperadas:**
  - A mesa muda de status para `Ocupada` (`occupied`).
  - O banner superior exibe titular `Dra. Carolina Mendes` e garçom `Roberto Alves`.

### Caso de Teste TC-09: Lançamento de Itens com Ponto da Carne
- **Rota:** `/app/tables/table-12`
- **Ações:**
  1. Clicar em `+ Adicionar Item`.
  2. Selecionar produto: `Tomahawk Prime Rib na Brasa (600g)`.
  3. Selecionar Ponto da Carne: `Ao Ponto`.
  4. Quantidade: `1`.
  5. Observação: `Ponto exato: crosta selada na brasa e centro rosado quente.`.
  6. Confirmar item.
  7. Clicar novamente em `+ Adicionar Item` e lançar `Cerveja Artesanal IPA Puro Malte (500ml)` na quantidade `2`.
- **Asserções Esperadas:**
  - Subtotal da comanda = R$ 191,90.
  - Taxa de serviço (10%) = R$ 19,19.
  - Total da comanda = R$ 211,09.

### Caso de Teste TC-10: Disparo da Comanda para a Cozinha
- **Rota:** `/app/tables/table-12`
- **Ações:**
  1. Clicar no botão `Enviar para Cozinha`.
- **Asserções Esperadas:**
  - Toast de sucesso notificando envio.
  - O ticket é transmitido em tempo real para a fila KDS.

### Caso de Teste TC-11: Monitor KDS: Início do Preparo
- **Rota:** `/app/kds`
- **Ações:**
  1. Localizar o ticket referente à `Mesa 12`.
  2. Verificar a observação do ponto da carne em destaque: `Ao Ponto`.
  3. Clicar em `Iniciar Preparo`.
- **Asserções Esperadas:**
  - Status do ticket muda para `Em Preparação` (`in_preparation`).
  - O cronômetro de cocção é iniciado.

### Caso de Teste TC-12: Monitor KDS: Conclusão e Entrega ao Garçom
- **Rota:** `/app/kds`
- **Ações:**
  1. Clicar em `Marcar Pronto`.
  2. Clicar em `Entregar ao Garçom`.
- **Asserções Esperadas:**
  - Alerta de prato pronto emitido para o salão.
  - O garçom `Roberto Alves` recebe baixa do prato e o ticket é concluído.

### Caso de Teste TC-13: Comanda Digital Mobile do Cliente
- **Rota:** `/comanda/table-12?restaurant=rest-qa-lab`
- **Ações:**
  1. Carregar a rota pública da comanda digital (simulando leitura do QR Code pelo celular).
  2. Conferir o resumo de consumo (Tomahawk + 2x Cerveja IPA = R$ 211,09).
  3. Verificar renderização do QR Code PIX e payload copia-e-cola.
  4. Clicar no botão `Pedir a Conta`.
- **Asserções Esperadas:**
  - A Mesa 12 entra em status `Conta Solicitada` (`bill_requested`).

### Caso de Teste TC-14: Frente de Caixa: Liquidação e Liberação da Mesa
- **Rota:** `/app/cashier`
- **Ações:**
  1. Localizar o pedido da `Mesa 12` na lista de comandas pendentes.
  2. Clicar em `Liquidar / Receber`.
  3. Selecionar forma de pagamento `PIX`.
  4. Confirmar quitação do valor `R$ 211,09`.
- **Asserções Esperadas:**
  - Toast de sucesso: *"Pagamento recebido com sucesso!"*.
  - A `Mesa 12` retorna imediatamente para o status `Livre` (`available`), pronta para novo atendimento.

---

## 💻 5. Exemplos de Implementação Externa

### Exemplo em Playwright (TypeScript)
```typescript
import { test, expect } from '@playwright/test';

test.describe('Olivelas Restaurant - Ciclo Operacional Completo E2E', () => {
  const BASE_URL = 'http://localhost:5173';

  test('TC-01 a TC-14: Fluxo Completo no Restaurante de Testes', async ({ page }) => {
    // 1. Inicializar contexto e login
    await page.goto(`${BASE_URL}/`);
    await page.evaluate(() => {
      localStorage.setItem('olivelas_active_restaurant_id', 'rest-qa-lab');
    });

    // 2. Acessar Salão de Mesas
    await page.goto(`${BASE_URL}/app/tables`);
    await expect(page.locator('text=Salão de Mesas')).toBeVisible();

    // 3. Abrir Comanda na Mesa 12
    await page.goto(`${BASE_URL}/app/tables/table-12`);
    await page.click('button:has-text("Abrir Comanda")');
    await page.fill('input#customer-name', 'Dra. Carolina Mendes');
    await page.click('button:has-text("Confirmar e Abrir")');
    await expect(page.locator('text=Dra. Carolina Mendes')).toBeVisible();

    // 4. Enviar para Cozinha
    await page.click('button:has-text("Enviar para Cozinha")');

    // 5. Monitor KDS
    await page.goto(`${BASE_URL}/app/kds`);
    await expect(page.locator('text=Mesa 12')).toBeVisible();
    await page.click('button:has-text("Marcar Pronto")');

    // 6. Caixa e Liquidação
    await page.goto(`${BASE_URL}/app/cashier`);
    await page.click('button:has-text("Liquidar")');
    await expect(page.locator('text=Pagamento confirmado')).toBeVisible();
  });
});
```

### Exemplo em Cypress (JavaScript)
```javascript
describe('Olivelas Restaurant - Fluxo Operacional E2E', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.window().then((win) => {
      win.localStorage.setItem('olivelas_active_restaurant_id', 'rest-qa-lab');
    });
  });

  it('Executa o ciclo completo de comanda, KDS e caixa', () => {
    cy.visit('/app/tables/table-12');
    cy.contains('button', 'Abrir Comanda').click();
    cy.get('input#customer-name').type('Dra. Carolina Mendes');
    cy.contains('button', 'Confirmar e Abrir').click();

    cy.contains('button', 'Enviar para Cozinha').click();

    cy.visit('/app/kds');
    cy.contains('Mesa 12').should('be.visible');
    cy.contains('button', 'Marcar Pronto').click();

    cy.visit('/app/cashier');
    cy.contains('button', 'Liquidar').click();
  });
});
```

---

## 🚀 6. Como Executar o Script Automatizado Local

O projeto possui um executor nativo integrado baseado em Chrome Headless:

```bash
# Executa o roteiro completo e grava resultados e prints na pasta local tests/test-results/
node scripts/execute-qa-test-plan.mjs
```

Os resultados gerados são salvos automaticamente em:
- `tests/test-results/screenshots/`: Capturas em alta resolução de cada passo do roteiro.
- `tests/test-results/execution-report.json`: Dados estruturados e tempos de execução.
- `tests/test-results/execution-summary.md`: Relatório executivo do teste.
- `tests/test-results/index.html`: Dashboard interativo local para inspeção visual.
