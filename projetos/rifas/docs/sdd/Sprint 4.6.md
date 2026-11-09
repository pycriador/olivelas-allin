Sprint 4.6 — Gerador de Artes e Exportação da Grade da Campanha
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

Implementar um módulo para gerar imagens profissionais da campanha, permitindo compartilhar a situação atual da rifa em redes sociais e aplicativos de mensagens.

NÃO implementar IA.

NÃO implementar geração automática de campanhas.

O foco é exportar imagens de alta qualidade.

Objetivos

Implementar

Exportação da grade de números
Exportação da situação da campanha
Templates
Compartilhamento
Download
Impressão
Nova Aba

Adicionar

Artes

Dentro da campanha.

Layout

Mostrar modelos prontos.

Exemplo

Mapa dos números

Resumo da campanha

Cartaz

Story Instagram

Status WhatsApp

Banner

Nesta Sprint implementar apenas

Mapa dos números
Exportação da Grade

Gerar imagem.

Exemplo

001 🟩

002 ⬜

003 🟥

004 🟩

005 ⬜

Legenda

Disponível

Reservado

Pago

Bloqueado

Cancelado

Premiado

Layout

Criar grid automática.

Exemplo

001

002

003

004

005

006

007

008

009

Quantidade de colunas configurável.

Cores

Disponível

Cinza

Reservado

Amarelo

Pago

Verde

Bloqueado

Preto

Cancelado

Vermelho

Premiado

Dourado

Cabeçalho

Adicionar

Imagem da campanha

Nome

Produto

Valor por número

Data

Quantidade vendida

Porcentagem vendida

Rodapé

Adicionar

Link

QR Code (placeholder)

Telefone

WhatsApp

Informações

Mostrar

Vendidos

125

Disponíveis

75

Reservados

12

Total

200
Configurações

Permitir

Mostrar somente vendidos

Mostrar somente disponíveis

Mostrar somente reservados

Mostrar todos

Destacar

Permitir destacar

Pagos

Reservados

Premiados

Layouts

Adicionar

Tema Claro

Tema Escuro

Corporativo

Minimalista

Colorido

Dimensões

Exportar

1080x1080

1080x1350

1080x1920

1920x1080

A4
Formatos

Exportar

PNG

JPEG

PDF

Qualidade

Alta resolução.

300 DPI para impressão.

Preview

Mostrar

Preview em tempo real.

Toda alteração atualiza automaticamente.

Compartilhar

Botões

Baixar

Copiar

Compartilhar

Imprimir

QR Code

Adicionar área reservada.

Nesta Sprint

Placeholder.

Sprint futura

Gerar QR Code real.

Personalização

Permitir

Logo

Cor principal

Cor secundária

Fonte

Mostrar ou ocultar legenda

Mostrar ou ocultar estatísticas

Mostrar ou ocultar QR Code

Templates

Criar estrutura preparada para futuras artes.

CampaignPoster

NumberGrid

StoryTemplate

InstagramPost

WhatsAppStatus

BannerTemplate

Nesta Sprint implementar apenas

NumberGrid
Performance

Renderização em Canvas ou SVG.

Sem perda de qualidade.

Componentes

Criar

ArtworkGenerator

ArtworkPreview

ArtworkToolbar

NumberGridRenderer

ExportDialog

ArtworkSettings

Todos reutilizáveis.

Segurança

Somente

GLOBAL_ADMIN

poderá gerar artes.

Preparação para Sprint 5

Toda a infraestrutura deverá permitir futuramente gerar

Cartazes
Posts automáticos
Stories
Banners
Material de divulgação
QR Code funcional
Artes promocionais

Sem necessidade de alterações estruturais.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

O administrador puder exportar a grade de números da campanha em imagem.
A imagem representar corretamente o estado de cada número (disponível, reservado, pago, bloqueado, cancelado e premiado).
O cabeçalho exibir informações da campanha e indicadores de venda.
O administrador puder escolher o tamanho e o formato da exportação.
A pré-visualização refletir exatamente o arquivo exportado.
A geração funcionar em desktop e dispositivos móveis.
Não existirem erros de TypeScript, ESLint ou warnings críticos.
Melhorias que eu incluiria nesta Sprint

Além da grade colorida, eu adicionaria duas opções de visualização, pois elas atendem públicos diferentes:

1. Grade visual (cartela)

É a visão tradicional da rifa.

Exemplo:

001 🟩 002 ⬜ 003 🟩 004 🟨
005 🟩 006 ⬜ 007 ⬜ 008 🟥

Ideal para divulgação em redes sociais.

2. Lista de números vendidos

Exportar apenas os números já vendidos em ordem crescente.

Exemplo:

Números já vendidos

001
005
008
012
014
025
033
041

Essa versão é muito utilizada por organizadores para enviar rapidamente em grupos de WhatsApp, pois ocupa menos espaço e facilita a conferência por quem deseja escolher um número ainda disponível. Com os dois formatos compartilhando a mesma infraestrutura de renderização, a manutenção continua simples e a funcionalidade atende a diferentes formas de divulgação.
