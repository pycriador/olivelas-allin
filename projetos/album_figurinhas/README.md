# MatchBook Creator

Crie uma aplicação web moderna e enterprise-grade no Lovable Cloud para criação de álbuns personalizados inspirados na Copa do Mundo 2026, focada em montagem visual de páginas A4 com figurinhas/fotos personalizadas. O sistema NÃO será um álbum de colecionador tradicional. O objetivo é permitir que administradores criem layouts totalmente customizados e que visitantes não logados apenas façam upload e colagem de fotos nos espaços definidos.

A aplicação deve ser extremamente moderna, responsiva, visualmente refinada e otimizada para desktop, tablet e mobile.

Stack obrigatória:

* React 19+
* Next.js 16+
* TypeScript
* TailwindCSS
* shadcn/ui
* Zustand
* React Hook Form
* Zod
* Framer Motion
* Lovable Cloud
* Estrutura preparada para Flask + SQLAlchemy + PostgreSQL futuramente

Arquitetura:

* Modular
* Escalável
* Componentizada
* Separação clara entre:

  * Builder/Admin
  * Viewer/User
  * PDF Engine
  * Storage Layer
  * Upload System

Objetivo principal:
Criar um sistema visual onde:

* O administrador cria páginas personalizadas
* O administrador posiciona espaços de figurinha livremente
* O administrador define tamanho das figurinhas em centímetros (CM)
* O administrador escolhe quantas figurinhas quiser por página
* O usuário visitante apenas sobe as fotos
* O sistema gera PDF funcional em A4
* Cada página possui ID único
* Cada álbum possui ID único
* O sistema compila todas as páginas em um PDF final

IMPORTANTE:

* O mockup inicial NÃO deve vir preenchido
* Nenhuma figurinha deve existir automaticamente
* O canvas deve iniciar vazio
* O administrador monta tudo manualmente

Permissões:
Criar dois tipos principais de acesso:

1. Administrador
   Usuário administrador fixo:

* [willian.o.jesus@gmail.com](mailto:willian.o.jesus@gmail.com)

O administrador poderá:

* Criar álbuns
* Editar álbuns
* Criar páginas
* Editar páginas
* Deletar páginas
* Criar templates
* Configurar layouts
* Configurar fundos
* Configurar elementos decorativos
* Criar espaços de figurinha
* Definir tamanho das figurinhas em CM
* Habilitar/desabilitar numeração das figurinhas
* Gerar PDFs
* Duplicar páginas
* Organizar ordem das páginas

2. Usuário visitante não logado
   O usuário NÃO precisa criar conta.

O visitante poderá:

* Abrir um álbum
* Navegar entre páginas
* Clicar nas figurinhas vazias
* Fazer upload de fotos
* Ajustar enquadramento
* Visualizar preview
* Gerar PDF da página ou álbum

Sistema de páginas:
Cada página deve possuir:

* ID único
* Nome
* Ordem
* Tipo:

  * capa
  * página comum
  * contracapa
* Configuração de fundo
* Lista de elementos

Sistema multi páginas:
Implementar:

* Navegação entre páginas
* Página simples
* Página dupla
* Reordenação drag-and-drop
* Duplicação de páginas
* Preview geral do álbum
* Compilação automática do álbum final

Editor visual estilo Canva/Figma:
Criar um editor profissional contendo:

* Drag and drop
* Resize livre
* Snap grid
* Zoom
* Undo/redo
* Layers
* Mini mapa
* Guias inteligentes
* Alinhamento automático
* Sistema de coordenadas
* Sistema de páginas

Canvas:

* Canvas central responsivo
* Preview real do A4
* Renderização precisa para PDF
* Escala proporcional
* Conversão real de CM para pixels
* Precisão de impressão

IMPORTANTE:
Os tamanhos das figurinhas DEVEM ser configuráveis em centímetros (CM).

Exemplo:

* 3cm x 4cm
* 5cm x 7cm
* 9cm x 12cm

O sistema deve converter automaticamente:

* CM -> pixels
* Pixels -> PDF

Sistema de figurinhas:
Os espaços de foto devem funcionar como:

* placeholders clicáveis
* formato de figurinha
* upload simples
* crop automático
* preview instantâneo
* centralização automática
* ajuste inteligente da imagem

Formatos suportados:

* JPG
* PNG
* WEBP

Configuração das figurinhas:
Cada figurinha deve possuir:

* ID único
* posição X/Y
* largura em CM
* altura em CM
* rotação
* borda
* raio
* sombra
* número opcional
* título opcional
* legenda opcional

IMPORTANTE:
O administrador deve conseguir:

* habilitar numeração
* desabilitar numeração
* escolher posição da numeração
* escolher estilo da numeração

Quantidade de figurinhas:
NÃO deve existir limite fixo.

O administrador deve poder:

* adicionar quantas figurinhas quiser na página
* posicionar livremente
* redimensionar individualmente
* criar grids automáticos opcionais

Layouts:
O administrador poderá:

* escolher fundo da página
* escolher fundo do álbum
* adicionar overlays
* adicionar logos
* adicionar banners
* adicionar textos decorativos
* adicionar elementos gráficos
* adicionar bandeiras
* adicionar molduras
* adicionar stickers decorativos

Sistema de upload:
As imagens devem:

* ser salvas no diretório do projeto
* ser registradas no Lovable Cloud
* possuir referência persistente
* possuir compressão otimizada
* possuir metadados

Metadados:

* ID
* Nome original
* Nome interno
* Álbum relacionado
* Página relacionada
* Figurinha relacionada
* Data de upload
* Tamanho
* Tipo MIME
* Dimensões

Sistema de PDF:
O sistema de download PDF A4 DEVE funcionar corretamente.

Requisitos obrigatórios:

* Exportação funcional
* PDF em alta resolução
* Tamanho A4 real
* Preservar posições exatas
* Preservar dimensões em CM
* Preservar qualidade das imagens
* Download instantâneo
* Preview antes da exportação

Funcionalidades PDF:

* Exportar página individual
* Exportar álbum completo
* Geração assíncrona
* Barra de progresso
* Retry automático
* Compressão inteligente

IMPORTANTE:
O PDF final deve ficar visualmente idêntico ao preview do canvas.

Interface:
Criar interface:

* moderna
* premium
* minimalista
* intuitiva
* rápida
* extremamente responsiva

Inspirada em:

* Canva
* Figma
* Adobe Express
* FIFA World Cup Design
* Panini

Criar:

* sidebar administrativa
* topbar moderna
* painel lateral de propriedades
* biblioteca de elementos
* navegação inferior de páginas
* sistema de layers

Tema:

* Light/Dark mode
* Glassmorphism leve
* Bordas arredondadas
* Sombras suaves
* Micro animações
* Transições fluidas

Dashboard administrativo:
Criar dashboard contendo:

* quantidade de álbuns
* quantidade de páginas
* uploads realizados
* PDFs gerados
* armazenamento utilizado
* estatísticas gerais

Persistência:
Criar mock backend funcional contendo:

* dados mockados
* persistência local
* estrutura preparada para APIs futuras
* estrutura preparada para banco relacional

Componentes esperados:

* AlbumBuilder
* PageCanvas
* StickerSlot
* StickerEditor
* UploadCard
* PDFExporter
* PageNavigator
* TemplateManager
* BackgroundSelector
* LayerManager
* PropertiesPanel
* AlbumPreview
* GridGenerator

Qualidade:
O sistema deve parecer um SaaS premium pronto para produção, com UX refinada, excelente performance e arquitetura moderna.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://album-forge-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/01e9d8ed-4f8d-4a13-82d4-b31ebc978ff0).

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
