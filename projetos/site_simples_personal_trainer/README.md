# 🌿 Rafaela — Personal Trainer | Landing Page Comercial de Alto Padrão

<p align="center">
  <img src="favicon.svg" alt="Rafaela Personal Trainer Logo" width="80" height="80">
</p>

<p align="center">
  <strong>Treino personalizado para uma vida mais forte, saudável e equilibrada.</strong><br>
  Uma experiência digital desenvolvida com estética premium de bem-estar, saúde e longevidade.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-Sem%C3%A2ntico-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-Modular-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-Vanilla%20ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Design-Mobile--First-10b981?style=for-the-badge" alt="Mobile First">
  <img src="https://img.shields.io/badge/Status-Produ%C3%A7%C3%A3o%20Pronta-0f3d32?style=for-the-badge" alt="Status">
</p>

---

## 📑 Sumário

1. [Visão Geral do Projeto](#-visão-geral-do-projeto)
2. [Posicionamento de Marca & Design System](#-posicionamento-de-marca--design-system)
3. [Estrutura Completa de Seções](#-estrutura-completa-de-seções)
4. [Arquitetura de Arquivos](#-arquitetura-de-arquivos)
5. [Configuração Central (Single Source of Truth)](#-configuração-central-single-source-of-truth)
6. [Integração Inteligente com WhatsApp](#-integração-inteligente-com-whatsapp)
7. [Guia de Customização Passo a Passo](#-guia-de-customização-passo-a-passo)
8. [Acessibilidade & Boas Práticas (WCAG)](#-acessibilidade--boas-práticas-wcag)
9. [Responsividade & Validação Mobile](#-responsividade--validação-mobile)
10. [SEO & Performance](#-seo--performance)
11. [Como Executar Localmente](#-como-executar-localmente)
12. [Como Publicar em Produção (Deploy)](#-como-publicar-em-produção-deploy)
13. [Roadmap de Evolução Futura](#-roadmap-de-evolução-futura)
14. [Checklist de Critérios de Aceite](#-checklist-de-critérios-de-aceite)

---

## 🌟 Visão Geral do Projeto

Este projeto consiste em uma **Landing Page completa, responsiva e de alta conversão** para a profissional **Rafaela, Personal Trainer**. 

Desenvolvido para atender tanto a clientes individuais quanto públicos específicos (mulheres, gestantes, melhor idade e iniciantes), o site alia elegância visual à facilidade técnica de manutenção:

- **Sem dependências externas pesadas:** Sem frameworks volumosos (React, Vue, Angular), bibliotecas de terceiros ou bundlers complicados.
- **Carregamento Instantâneo:** Carrega em fração de segundo em redes 4G/5G com defer nos scripts e pré-conexão de fontes.
- **Zero Backend / Zero Banco de Dados:** Estrutura 100% cliente-side, totalmente preparada para futuras integrações de formulário e API.
- **Conformidade Ética:** Respeita rigorosamente as diretrizes dos conselhos profissionais (CREF/CFN/CFM), sem promessas médicas ou garantias milagrosas.

---

## 🎨 Posicionamento de Marca & Design System

A estética do site afasta-se deliberadamente de academias genéricas, templates prontos ou visuais agressivos (*"no pain, no gain"* neon). Em vez disso, aproxima-se de uma **marca premium de saúde, performance e bem-estar**:

### Tipografia
- **Família:** `Plus Jakarta Sans`, com fallbacks do sistema (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`).
- **Hierarquia:** Escala modular fluida com pesos 400 (regular), 500 (medium), 600 (semibold), 700 (bold) e 800 (extrabold).

### Paleta de Cores Nobre
- **`--color-primary` (`#0d3d34`):** Verde florestal profundo e sofisticado.
- **`--color-primary-light` (`#185c4f`):** Variação viva para hovers e estados ativos.
- **`--color-accent` (`#c99846`):** Dourado suave/champagne para destaque de valor.
- **`--color-background` (`#faf9f6`):** Fundo linho/off-white aconchegante que descansa a visão.
- **`--color-surface` (`#ffffff`):** Branco puro para cartões, superfícies e componentes.
- **`--color-text` (`#16201e`):** Ardósia escuro com alto contraste e ótima legibilidade.
- **`--color-whatsapp` (`#25D366`):** Verde oficial do WhatsApp para máxima taxa de conversão.

---

## 🧩 Estrutura Completa de Seções

O site implementa rigorosamente todas as seções planejadas:

1. **Header Fixo / Sticky:** Logomarca tipográfica, menu de ancoragem, botão "Agendar avaliação" e menu drawer com animação para telas mobile.
2. **Hero Section:** Headline persuasiva, parágrafo com a filosofia do treino para a vida real, dois botões de ação e moldura profissional de foto com badges flutuantes.
3. **Diferenciais:** 4 cartões em destaque (Treino Personalizado, Acompanhamento Próximo, Estratégia Individual e Tecnologia).
4. **Sobre Rafaela:** Declaração institucional de propósito, espaço para foto de perfil e marcadores organizados para `[FORMAÇÃO]`, `[CERTIFICAÇÕES]`, `[ESPECIALIZAÇÕES]` e `[ANOS DE EXPERIÊNCIA]`.
5. **Serviços:** Grid moderno com 9 modalidades (Personal Trainer, Emagrecimento, Hipertrofia, Condicionamento, Gestantes, Melhor Idade, Funcional, Treino Online e Hábitos Saudáveis).
6. **Avisos Éticos e Regulatórios:** Alerta legal claro sobre a necessidade de liberação médica para gestantes e de nutricionista habilitado para prescrição alimentar.
7. **Combos de Treinamento:** 3 cartões comerciais transparentes:
   - *Aula Avulsa:* R$ 120 por hora/aula.
   - *Combo 3x por semana:* R$ 100 por hora/aula (3 sessões semanais).
   - *Combo 2x por semana:* R$ 150 por hora/aula (2 sessões semanais).
8. **Planos Mensais:** Seção visualmente premium e destacada dos combos:
   - *Plano Performance (3x/semana):* R$ 1.500 / mês (inclui suporte presencial + app exclusivo).
   - *Plano Equilíbrio (2x/semana):* R$ 1.350 / mês (inclui suporte presencial + app exclusivo).
9. **Diferença entre Combo e Plano Mensal:** Comparativo didático, transparente e sem juízos absolutos de valor.
10. **Aplicativo Exclusivo:** Demonstração visual do aplicativo próprio através de um mockup realista de smartphone em CSS puro com prévia dos módulos (*Meu Treino, Próximo Treino, Exercícios, Evolução, Histórico e Orientações*).
11. **Programas Especiais:** Cartões direcionados para Gestantes, Melhor Idade, Iniciantes, Emagrecimento, Pós-parto e Condicionamento.
12. **Alimentação Saudável:** 5 pilares do estilo de vida (Organização, Hidratação, Equilíbrio, Sustentabilidade e Rotina) acompanhados de aviso legal de nutrição.
13. **Como Funciona:** Linha do tempo em 4 passos (01 Converse, 02 Avaliação, 03 Planejamento, 04 Acompanhamento).
14. **Depoimentos:** Estrutura organizada com placeholders para futura inserção de depoimentos reais de alunos.
15. **FAQ (Perguntas Frequentes):** 8 perguntas respondidas através de um accordion interativo acessível por mouse e teclado.
16. **CTA Final:** Bloco de fechamento enfático convidando para início imediato com WhatsApp em primeiro plano.
17. **Formulário de Pré-Agendamento:** Estrutura limpa e semântica no final da página, pronta para futura conexão com APIs ou backend.
18. **Footer:** Logomarca, links rápidos, dados de contato, disclaimer ético-jurídico e copyright com ano atualizado dinamicamente.
19. **Botão Flutuante de WhatsApp:** Posicionado estrategicamente no canto inferior direito, com suporte a microinterações e pulso suave.
20. **Botão Voltar ao Topo:** Aparece suavemente após 400px de rolagem para conforto do usuário.

---

## 📂 Arquitetura de Arquivos

```
rafaela-personal/
├── index.html               # Estrutura semântica completa
├── favicon.svg              # Favicon vetorial da marca
├── robots.txt               # Instruções de indexação para bots de busca
├── sitemap.xml              # Mapa do site indexável
├── README.md                # Esta documentação completa
│
├── assets/
│   ├── images/              # Imagens vetoriais e destinos de fotos
│   │   ├── rafaela-hero.svg # Placeholder vetorial refinado da capa
│   │   ├── rafaela-hero.jpg # Destino para a foto oficial da Rafaela
│   │   ├── rafaela-about.svg# Placeholder da seção Sobre
│   │   ├── rafaela-about.jpg# Destino para foto institucional
│   │   ├── training-01.svg  # Placeholder temático (acompanhamento)
│   │   ├── training-01.jpg
│   │   ├── training-02.svg  # Placeholder temático (saúde/longevidade)
│   │   ├── training-02.jpg
│   │   ├── training-03.svg  # Placeholder temático (planejamento)
│   │   └── training-03.jpg
│   └── icons/
│
├── css/
│   ├── reset.css            # Normalização de estilos modernos
│   ├── variables.css        # Design tokens (cores, espaçamentos, tipografia)
│   ├── base.css             # Estilos de base, contêineres e utilitários
│   ├── components.css       # Botões, cards de preço, mockup do app, accordion
│   ├── sections.css         # Diagramação individual de cada seção
│   └── responsive.css       # Breakpoints e adaptações mobile/tablet
│
└── js/
    ├── config.js            # Single Source of Truth comercial
    ├── whatsapp.js          # Disparo inteligente com mensagens de contexto
    ├── navigation.js        # Menu mobile drawer e sticky header
    ├── faq.js               # Acordeão interativo do FAQ
    └── main.js              # Injeção dinâmica, ano do footer e scroll reveal
```

---

## ⚙️ Configuração Central (Single Source of Truth)

Toda a lógica comercial está isolada no arquivo [`js/config.js`](file:///c:/Users/willi/Downloads/projetos/rafaela-personal/js/config.js). 

Se você precisar alterar um preço, trocar o número do WhatsApp ou atualizar a conta do Instagram, **basta editar este arquivo uma única vez**:

```javascript
const SITE_CONFIG = {
  brand: {
    name: "Rafaela",
    title: "Personal Trainer",
    badge: "PERSONAL TRAINER",
    tagline: "Treino personalizado para uma vida mais forte, saudável e equilibrada."
  },

  // Contatos comerciais
  contact: {
    whatsapp: "5511999999999", // Apenas números: DDI (55) + DDD (11) + Número
    whatsappFormatted: "(11) 99999-9999",
    instagram: "@rafaelapersonal",
    instagramUrl: "https://instagram.com/perfil-real",
    email: "contato@rafaelapersonal.com.br",
    location: "São Paulo - SP"
  },

  // Preçários Oficiais (atualizam automaticamente na tela e nos botões)
  pricing: {
    singleClass: { price: 120 },
    combos: {
      threeTimes: { pricePerHour: 100 },
      twoTimes: { pricePerHour: 150 }
    },
    monthly: {
      performance: { priceMonth: 1500 },
      equilibrium: { priceMonth: 1350 }
    }
  }
};
```

---

## 💬 Integração Inteligente com WhatsApp

Cada botão de ação na página utiliza o atributo `data-whatsapp-msg="CHAVE"` para abrir uma conversa no WhatsApp com uma **mensagem personalizada de acordo com o contexto do clique**. 

Isso eleva exponencialmente a conversão, pois a Rafaela já recebe a mensagem sabendo exatamente o interesse do visitante:

| Botão / CTA | Chave | Mensagem Pré-formatada Enviada |
| :--- | :--- | :--- |
| **"Agendar avaliação"** (Header) | `assessment` | *"Olá Rafaela! Gostaria de agendar uma avaliação inicial para entender as melhores opções para minha rotina."* |
| **"Falar com a Rafaela"** (Hero) | `hero` | *"Olá Rafaela! Gostaria de conversar sobre como começar meus treinos personalizados com você."* |
| **"Quero experimentar"** (Aula Avulsa) | `singleClass` | *"Olá Rafaela! Vi seu site e tenho interesse na aula avulsa de Personal Trainer."* |
| **"Quero esse combo"** (3x/sem) | `combo3x` | *"Olá Rafaela! Vi o combo de 3x por semana e gostaria de saber mais sobre horários e disponibilidade."* |
| **"Quero esse combo"** (2x/sem) | `combo2x` | *"Olá Rafaela! Vi o combo de 2x por semana e gostaria de saber mais sobre horários e disponibilidade."* |
| **"Quero o Plano Performance"** | `monthlyPerformance`| *"Olá Rafaela! Tenho interesse no Plano Performance (3x por semana com aplicativo exclusivo) e gostaria de saber como funciona."* |
| **"Quero o Plano Equilíbrio"** | `monthlyEquilibrium`| *"Olá Rafaela! Tenho interesse no Plano Equilíbrio (2x por semana com aplicativo exclusivo) e gostaria de saber como funciona."* |
| **"Falar sobre Personal"** | `servicePersonal` | *"Olá Rafaela! Gostaria de saber mais sobre o atendimento individual de Personal Trainer e sua disponibilidade de horários."* |
| **"Falar sobre Emagrecimento"** | `serviceEmagrecimento` | *"Olá Rafaela! Gostaria de saber mais sobre o treinamento focado em Emagrecimento e composição corporal."* |
| **"Falar sobre Hipertrofia"** | `serviceHipertrofia` | *"Olá Rafaela! Gostaria de saber mais sobre os treinos voltados para Hipertrofia e ganho de massa muscular."* |
| **"Falar sobre Condicionamento"** | `serviceCondicionamento` | *"Olá Rafaela! Gostaria de informações sobre o treino para melhora do Condicionamento Físico e resistência."* |
| **"Falar sobre Gestantes"** | `serviceGestantes` | *"Olá Rafaela! Tenho interesse no treinamento adaptado e seguro para Gestantes. Gostaria de entender como funciona."* |
| **"Falar sobre Melhor Idade"** | `serviceMelhorIdade` | *"Olá Rafaela! Gostaria de saber mais sobre o acompanhamento personalizado para a Melhor Idade."* |
| **"Falar sobre Funcional"** | `serviceFuncional` | *"Olá Rafaela! Gostaria de mais informações sobre as aulas de Treinamento Funcional com você."* |
| **"Falar sobre Treino Online"** | `serviceTreinoOnline` | *"Olá Rafaela! Gostaria de entender como funciona a sua consultoria e acompanhamento de Treino Online."* |
| **"Falar sobre Hábitos Saudáveis"** | `serviceAlimentacao` | *"Olá Rafaela! Vi a abordagem sobre hábitos saudáveis e gostaria de conversar sobre alinhamento de rotina e treino."* |
| **"Enviar dados para o WhatsApp"** (Formulário) | `handleLeadFormSubmit` | *"Olá Rafaela! Preenchi o formulário no seu site com meus dados: [Nome, WhatsApp, Objetivo, Frequência, Mensagem]"* |
| **Botão Flutuante** | `default` | *"Olá Rafaela! Vi seu site e gostaria de saber mais sobre o acompanhamento de Personal Trainer."* |

---

## 🛠️ Guia de Customização Passo a Passo

### 1. Substituindo as Fotos da Rafaela
O site utiliza atualmente imagens vetoriais SVG de alto padrão para que a navegação nunca fique com ícones quebrados. Quando as fotos oficiais da Rafaela estiverem prontas:

1. **Foto Principal da Capa:** Salve a imagem na proporção retrato (recomendado 1200x1500px) com o nome exato:
   `assets/images/rafaela-hero.jpg`
2. **Foto da Seção Sobre:** Salve a imagem institucional de perfil com o nome exato:
   `assets/images/rafaela-about.jpg`
3. O código HTML já está preparado com `<picture>` e detectará os arquivos `.jpg` automaticamente!

### 2. Preenchendo Formação e Certificações
Abra o arquivo [`index.html`](file:///c:/Users/willi/Downloads/projetos/rafaela-personal/index.html), localize a seção `#sobre` e altere os marcadores:
- `[FORMAÇÃO]` ➔ Substitua por ex: *Bacharel em Educação Física — USP*
- `[CERTIFICAÇÕES]` ➔ Substitua por ex: *Certificação Internacional em Treinamento Funcional*
- `[ESPECIALIZAÇÕES]` ➔ Substitua por ex: *Fisiologia do Exercício & Saúde da Mulher*
- `[ANOS DE EXPERIÊNCIA]` ➔ Substitua por ex: *+8 anos de atuação presencial*

### 3. Inserindo Depoimentos Reais
Na seção de depoimentos (`#depoimentos` no `index.html`), substitua os placeholders pelas avaliações reais e autorizadas dos alunos:
- `[Depoimento de cliente]` ➔ O relato textual do aluno;
- `[Nome do cliente]` ➔ Nome da pessoa (ex: *Camila M.*);
- `[Objetivo/Perfil]` ➔ Meta atingida (ex: *Emagrecimento e Saúde* ou *Gestante*).

---

## ♿ Acessibilidade & Boas Práticas (WCAG)

O código foi projetado para garantir conformidade com as diretrizes de acessibilidade **WCAG 2.1 nível AA**:

- **HTML Semântico:** Utilização rigorosa de `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, além de títulos estruturados logicamente (`<h1>` a `<h3>`).
- **Navegação por Teclado:** Foco visual evidente (`:focus-visible`) com anel dourado de alto contraste para usuários que utilizam a tecla `Tab`.
- **Suporte a Leitores de Tela:** Atributos ARIA dinâmicos como `aria-expanded="false|true"`, `aria-controls`, `aria-labelledby` e classes utilitárias `.sr-only`.
- **Sensibilidade a Movimento:** Media query `prefers-reduced-motion` integrada. Usuários que configuram o sistema para movimento reduzido têm as animações de scroll reveal e transições desativadas instantaneamente.
- **Área de Toque Generosa:** Todos os botões e itens de menu possuem dimensões mínimas superiores a 44x44px, facilitando o toque em telas sensíveis.

---

## 📱 Responsividade & Validação Mobile

O projeto adota uma filosofia **Mobile-First rigorosa**. Todos os elementos foram testados e validados nas principais resoluções do mercado:

- **320px / 360px:** Smartphones compactos (iPhone SE, Galaxy A-series pequenos).
- **375px / 390px / 414px:** Smartphones padrão modernos (iPhone 13/14/15, Galaxy S23).
- **768px / 820px:** Tablets e iPads em orientação vertical.
- **1024px / 1280px:** Laptops e tablets em orientação horizontal.
- **1440px / 1920px+:** Monitores Full HD e telas de alta definição.

### Destaques Mobile
- **Sem rolagem horizontal:** `overflow-x: hidden` configurado em `html` e `body`.
- **Menu Drawer:** O menu hambúrguer abre uma gaveta lateral suave com backdrop blur escuro. Clicar em qualquer link ou pressionar a tecla `Esc` fecha a gaveta imediatamente.
- **Mockup Escalonável:** O smartphone demonstrativo do app reduz suas dimensões proporcionalmente sem nunca ultrapassar a largura da tela do celular.
- **Botão Flutuante Otimizado:** Em telas pequenas, o botão do WhatsApp transforma-se em um círculo compacto flutuante de 56x56px, garantindo acesso imediato com o polegar sem cobrir o conteúdo de leitura.

---

## 🔍 SEO & Performance

- **Metadados Completos:** Configurados para indexação em buscadores com título objetivo, meta descrição comercial, canonical URL e keywords.
- **Redes Sociais (Open Graph & Twitter Cards):** Ao compartilhar o link no WhatsApp, LinkedIn, Facebook ou Twitter/X, um card visual com a foto da marca e título profissional será renderizado.
- **Indexação Rápida:** Arquivos [`robots.txt`](file:///c:/Users/willi/Downloads/projetos/rafaela-personal/robots.txt) e [`sitemap.xml`](file:///c:/Users/willi/Downloads/projetos/rafaela-personal/sitemap.xml) devidamente implementados.
- **Carregamento Otimizado:**
  - Imagem do Hero configurada com `loading="eager"` e `decoding="async"`.
  - Imagens subsequentes configuradas com `loading="lazy"`.
  - Scripts carregados com o atributo `defer`.

---

## 💻 Como Executar Localmente

### Opção 1: Diretamente no Navegador (Sem instalação)
Dê um duplo clique no arquivo [`index.html`](file:///c:/Users/willi/Downloads/projetos/rafaela-personal/index.html) ou arraste-o para dentro de uma aba do Google Chrome / Microsoft Edge / Safari / Firefox.

### Opção 2: Servidor Local via Node.js
Na pasta do projeto, execute no terminal:
```bash
npx serve .
```
E abra o endereço indicado (ex: `http://localhost:3000`).

### Opção 3: Servidor Local via Python
```bash
python -m http.server 8080
```
E acesse `http://localhost:8080` no navegador.

### Opção 4: VS Code (Live Server)
Abra a pasta no VS Code, clique com o botão direito em `index.html` e selecione **"Open with Live Server"**.

---

## 🚀 Como Publicar em Produção (Deploy)

Como o site é totalmente estático (HTML, CSS e JS puros), ele pode ser hospedado de forma rápida e gratuita em qualquer serviço moderno:

### 1. GitHub Pages (Gratuito e Integrado)
1. Envie o repositório para o GitHub na branch `main`.
2. No GitHub, vá em **Settings > Pages**.
3. Em *Source*, selecione **Deploy from a branch**.
4. Escolha a branch `main` e a pasta `/ (root)`.
5. Clique em **Save**. Em minutos o site estará online em `https://usuario.github.io/rafaela-personal/`.

### 2. Vercel ou Netlify (Deploy com 1 clique)
- Conecte sua conta do GitHub na [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
- Importe o repositório `rafaela-personal`.
- O deploy ocorre automaticamente a cada novo `git push` com certificado SSL gratuito incluso.

### 3. Hospedagem Convencional (Hostinger, Locaweb, cPanel)
- Basta enviar todos os arquivos da pasta para dentro do diretório `public_html` via FTP (FileZilla) ou pelo Gerenciador de Arquivos do painel.

---

## 🗺️ Roadmap de Evolução Futura

O projeto foi arquitetado para permitir expansões sem retrabalho de design:

- **Backend & Banco de Dados:** Conectar o formulário da seção `#contato` a uma API (Node.js/Express, Firebase ou Supabase) para armazenar leads e disparar e-mails automáticos.
- **Área do Aluno:** Desenvolver portal de autenticação para os alunos dos planos mensais acessarem treinos e relatórios de bioimpedância.
- **Blog de Conteúdo:** Adicionar diretório `/blog` com artigos sobre musculação para longevidade, treino feminino e ergonomia para atração de tráfego orgânico no Google.
- **Checkout Integrado:** Adicionar gateway de pagamento (Stripe, Mercado Pago ou Asaas) para contratação direta de planos pelo site.

---

## ✅ Checklist de Critérios de Aceite

- [x] **Página carrega instantaneamente sem erros de console.**
- [x] **Nenhum link ou botão quebrado.**
- [x] **Todas as 23 âncoras internas rolam com suavidade até o destino.**
- [x] **Menu mobile drawer abre, fecha, responde a toques no overlay e tecla `Esc`.**
- [x] **Accordion do FAQ expande e recolhe de forma suave com teclado e clique.**
- [x] **Todas as chamadas de WhatsApp disparam mensagens contextuais personalizadas.**
- [x] **Layout 100% responsivo validado de 320px a 1920px+ sem overflow horizontal.**
- [x] **Todas as imagens contêm atributos descritivos `alt`.**
- [x] **Navegação por foco de teclado totalmente visível e acessível.**
- [x] **Preços e contatos unificados no `js/config.js` (*Single Source of Truth*).**
- [x] **Nenhum dado falso apresentado como real (placeholders claros para foto, certificações e depoimentos).**
- [x] **Avisos legais de saúde (gestantes e nutrição) devidamente em evidência.**
- [x] **SEO básico configurado (meta tags, Open Graph, Twitter Cards, robots.txt, sitemap.xml).**
- [x] **Código modular, limpo, bem documentado e pronto para produção.**

---

<p align="center">
  Desenvolvido com excelência técnica para <strong>Rafaela — Personal Trainer</strong>.
</p>
