# Game Treasury

1. Arquitetura da Base de Dados (Esquema SQL/Prisma)

Esta estrutura garante a normalização total, permitindo que você rastreie desde o chip de uma placa-mãe de um console raro até o cupom de desconto daquela edição de colecionador na Amazon.

-- Habilitar RLS para isolamento por usuário

-- Todas as tabelas devem ter a coluna user_id

CREATE TABLE empresas (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  nome TEXT NOT NULL,

  tipo TEXT CHECK (tipo IN ('Desenvolvedora', 'Publicadora', 'Ambos')),

  pais TEXT,

  website TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

CREATE TABLE plataformas (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  nome TEXT NOT NULL,

  fabricante TEXT,

  geracao INTEGER,

  ano_lancamento INTEGER

);

CREATE TABLE jogos (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  titulo TEXT NOT NULL,

  titulo_alternativo TEXT,

  serie_id UUID REFERENCES series(id),

  ano_lancamento INTEGER,

  genero_id UUID REFERENCES generos(id),

  subgenero_id UUID REFERENCES subgeneros(id),

  desenvolvedora_id UUID REFERENCES empresas(id),

  publicadora_id UUID REFERENCES empresas(id),

  classificacao_indicativa TEXT,

  numero_jogadores TEXT,

  possui_online BOOLEAN DEFAULT false,

  tempo_medio_jogo INTEGER, -- em minutos

  idiomas TEXT[],

  nota_metacritic INTEGER,

  descricao TEXT,

  link_wikipedia TEXT,

  id_externo_igdb TEXT

);

CREATE TABLE itens (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  nome TEXT NOT NULL,

  tipo TEXT CHECK (tipo IN ('Console', 'Controle', 'Acessório')),

  plataforma_id UUID REFERENCES plataformas(id),

  marca TEXT,

  modelo TEXT,

  descricao TEXT,

  ano_lancamento INTEGER

);

CREATE TABLE colecao (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  tipo_item TEXT CHECK (tipo_item IN ('Jogo', 'Item')),

  jogo_id UUID REFERENCES jogos(id),

  item_id UUID REFERENCES itens(id),

  plataforma_id UUID REFERENCES plataformas(id),

  formato TEXT CHECK (formato IN ('Físico', 'Digital')),

  regiao TEXT,

  edicao TEXT,

  midia TEXT,

  completo BOOLEAN DEFAULT false,

  condicao TEXT,

  data_compra DATE,

  preco_pago DECIMAL(10,2),

  local_compra TEXT,

  status TEXT CHECK (status IN ('Backlog', 'Jogando', 'Finalizado')),

  nota_pessoal INTEGER CHECK (nota_pessoal BETWEEN 0 AND 10),

  localizacao_fisica TEXT,

  observacoes TEXT

);

CREATE TABLE lojas (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  nome TEXT NOT NULL,

  url_base TEXT,

  tipo TEXT

);

CREATE TABLE links_compra (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  jogo_id UUID REFERENCES jogos(id),

  item_id UUID REFERENCES itens(id),

  loja_id UUID REFERENCES lojas(id),

  url TEXT NOT NULL,

  preco DECIMAL(10,2) NOT NULL,

  frete DECIMAL(10,2) DEFAULT 0,

  disponibilidade BOOLEAN DEFAULT true,

  data_verificacao TIMESTAMP WITH TIME ZONE DEFAULT NOW()

);

CREATE TABLE cupons (

  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  user_id UUID REFERENCES auth.users(id),

  codigo TEXT NOT NULL,

  loja_id UUID REFERENCES lojas(id),

  tipo_desconto TEXT CHECK (tipo_desconto IN ('Porcentagem', 'Valor')),

  valor_desconto DECIMAL(10,2) NOT NULL,

  valor_minimo DECIMAL(10,2) DEFAULT 0,

  data_inicio TIMESTAMP WITH TIME ZONE,

  data_fim TIMESTAMP WITH TIME ZONE,

  ativo BOOLEAN DEFAULT true,

  descricao TEXT

);

2. Lógica de Negócio e Automações (Frontend/API)

Para o Lovable, a interface deve ser construída com React + Tailwind CSS + Lucide React para os ícones.

Cálculo de Preço Final: No frontend, criaremos uma função que verifica o cupom aplicado ao link.

Fórmula: $$PreçoFinal = (PreçoBase + Frete) - Desconto$$

O sistema deve validar se a data atual está entre data_inicio e data_fim e se o preco atinge o valor_minimo.

Isolamento de Dados: Utilizaremos o middleware do Supabase para injetar automaticamente o user_id em cada query, garantindo que o Willian não veja a coleção de outro "nerd" e vice-versa.

API REST: O Supabase gera automaticamente endpoints REST para cada tabela acima. O usuário poderá gerar uma API Key nas configurações do perfil para integrações externas.

3. Interface e Experiência do Usuário (UX/UI)

A UI seguirá um padrão SaaS Moderno (Dashboard lateral):

Dashboard: Widgets com counters animados.

Gráfico de Pizza: Distribuição por Plataforma.

Gráfico de Barras: Gastos mensais com "caça a relíquias".

Progresso de Backlog: Barra de porcentagem baseada no status "Finalizado".

Visualização de Itens: Cards com badges coloridas para "Digital" vs "Físico" e "Completo" (CIB - Complete in Box).

Tema: Toggle Switch no topo para alternar entre Dark Mode (Deep Blue/Slate) e Light Mode (Soft Gray/White).

Resumindo

Este sistema foi projetado para ser mais do que um simples CRUD; é uma ferramenta de Inventory Management para colecionadores exigentes. Ele resolve o problema de saber quanto foi investido na coleção, o que ainda precisa ser jogado e onde estão as melhores oportunidades de compra com cupons ativos, tudo isso sob uma camada de segurança multiusuário e API escalável.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://collection-vault-keeper.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/76f0741a-6754-45a2-9faa-9e7a54e4da43).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
