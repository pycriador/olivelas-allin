Sprint 4.5 — Campaign Media Manager, Open Graph e Compartilhamento Social
Objetivo

Continuar o desenvolvimento da plataforma RaffleHub.

Esta Sprint tem como objetivo criar um gerenciamento profissional das imagens da campanha.

Não é apenas um upload de arquivos.

O sistema deverá permitir organizar, editar, selecionar e compartilhar imagens corretamente em todos os canais.

Objetivos

Implementar

Gerenciamento completo de imagens
Galeria
Imagem de capa
Imagem de compartilhamento
Ordenação
Compressão
Crop
Preview
Open Graph
SEO
Compartilhamento Social
Banco

Criar (ou evoluir) tabela

campaign_images

Campos

id

campaign_id

storage_path

filename

mime_type

width

height

size

display_order

image_type

alt_text

caption

is_active

uploaded_by

created_at

updated_at
image_type

Criar enum

COVER

GALLERY

SHARE

THUMBNAIL

BANNER
Regras

A campanha poderá possuir

várias imagens de galeria;
apenas uma imagem de capa;
apenas uma imagem de compartilhamento;
apenas uma thumbnail;
apenas um banner.

Ao selecionar uma nova imagem de um tipo exclusivo, a anterior deverá ser desmarcada automaticamente.

Tela

Adicionar nova aba

Imagens

Dentro da campanha.

Layout

Criar galeria moderna.

Cards.

Preview.

Grid responsiva.

Lazy Loading.

Upload

Permitir

Drag and Drop

Upload múltiplo

Colar imagem (Ctrl + V)

Selecionar arquivos

Upload por celular

Formatos

Aceitar

PNG

JPG

JPEG

WEBP
Validação

Validar

Tipo

Tamanho

Dimensão

Duplicidade

Compressão

Comprimir automaticamente.

Manter qualidade.

Gerar WebP quando possível.

Crop

Adicionar editor.

Permitir

Zoom

Rotação

Recorte

Ordenação

Permitir

Arrastar

↓

Reordenar

↓

Persistir ordem.

Informações

Cada imagem deverá possuir

Nome

Dimensão

Peso

Data

Tipo

Autor

Ações

Cada imagem

Possui menu

Editar

Renomear

Mover

Duplicar

Baixar

Excluir

Selecionar Capa

Criar ação

Definir como Capa

Ao definir

↓

Atualizar campanha.

↓

Atualizar Open Graph.

↓

Atualizar SEO.

↓

Atualizar Compartilhamento.

Selecionar Compartilhamento

Criar ação

Usar para Compartilhamento

Caso não exista

↓

Utilizar automaticamente

Imagem de capa.

Página Pública

Mostrar

Imagem principal.

Galeria.

Carrossel.

Zoom.

Fullscreen.

Compartilhamento

Quando compartilhar

WhatsApp

Facebook

Telegram

LinkedIn

X

Copiar Link

O sistema deverá utilizar

Imagem de Compartilhamento

Caso exista.

Caso contrário

↓

Imagem de Capa.

Open Graph

Gerar automaticamente

<meta property="og:title">

<meta property="og:description">

<meta property="og:image">

<meta property="og:url">

<meta property="og:type">
Twitter Card

Gerar

twitter:image

twitter:title

twitter:description
SEO

Atualizar

JSON-LD

Schema.org

Canonical

Meta Image

Link Compartilhável

Quando compartilhar

https://meusite.com/r/iphone17

A miniatura deverá ser

A imagem de capa ou a imagem de compartilhamento.

Nunca uma imagem aleatória.

Preview

Criar botão

Visualizar Compartilhamento

Mostrar simulação

WhatsApp

Facebook

Telegram

LinkedIn

X

Assim o administrador consegue validar antes de divulgar.

Dashboard

Adicionar indicadores

Quantidade de imagens

Espaço utilizado

Imagem de capa configurada

Imagem de compartilhamento configurada

Componentes

Criar

CampaignMediaManager

MediaGrid

MediaUploader

MediaCropper

MediaCard

MediaPreview

SharePreview

ImageSorter

CoverSelector

ShareImageSelector

Todos reutilizáveis.

Storage

Organizar

campaigns/

{campaign_id}/

cover/

gallery/

share/

thumbnail/

banner/
Performance

Lazy Loading

Compressão

Cache

Thumbnail automática

Pré-carregamento da imagem de capa

Segurança

Somente

GLOBAL_ADMIN

poderá

Enviar

Excluir

Editar

Selecionar capa

Selecionar imagem de compartilhamento

Responsividade

Desktop

Notebook

Tablet

Mobile

Preparação para Sprint 5

Toda a infraestrutura deverá ser reutilizada nas páginas de checkout e confirmação de compra.

Critérios de Aceitação (Definition of Done)

A Sprint somente poderá ser considerada concluída quando:

O administrador puder gerenciar todas as imagens da campanha em uma interface dedicada.
Apenas uma imagem de capa e uma imagem de compartilhamento estiverem ativas por campanha.
A ordenação da galeria for persistida.
A página pública exibir corretamente a capa e a galeria.
Os links compartilhados utilizarem a imagem de compartilhamento ou, na ausência dela, a imagem de capa como miniatura (Open Graph/Twitter Card).
O administrador puder visualizar uma prévia do compartilhamento antes de publicar.
As imagens forem armazenadas de forma organizada no Storage.
Não existirem erros de TypeScript, ESLint ou warnings críticos.
Uma melhoria importante para o futuro

Eu também adicionaria um recurso de geração automática de arte para divulgação. A partir da imagem de capa, o sistema poderia criar modelos prontos para Instagram, Facebook, WhatsApp Status e Stories, inserindo automaticamente informações da campanha (nome, valor por número, quantidade disponível e QR Code ou link). Essa funcionalidade pode ser planejada para uma Sprint futura, aproveitando toda a infraestrutura de gerenciamento de imagens criada nesta Sprint, sem necessidade de alterações na arquitetura.
