# Olivelas QR Code Studio (TypeScript 2.0) 🚀

Uma plataforma intuitiva, ultra-rápida e profissional desenvolvida em **TypeScript** com **criação dinâmica de HTML**, **layout responsivo amplo**, **URLs próprias para cada página**, **54+ estilos prontos**, **11 encurtadores de URL integrados**, **logotipos oficiais do Wikimedia Commons**, **painel lateral fixo na lateral** e suporte completo para geração e download via **cURL** e **Python**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Bundler-646CFF?logo=vite)
![Pix Oficial](https://img.shields.io/badge/Pix%20Oficial-BR%20Code%20EMV-32BCAD)
![Wi-Fi Universal](https://img.shields.io/badge/Wi--Fi-ZXing%20Universal-0284c7)
![Estilos](https://img.shields.io/badge/Estilos%20e%20Presets-54%2B-indigo)
![Encurtadores](https://img.shields.io/badge/Encurtadores%20de%20URL-11%20Servi%C3%A7os-success)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages%20Ready-brightgreen)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blueviolet?logo=githubactions)

---

## 🌟 Principais Recursos e Diferenciais

### 1. 🌐 URLs Próprias & Roteamento SPA Hash
- Cada página possui sua rota dedicada, 100% compatível com recarregamento no **GitHub Pages**:
  - **Criador de Códigos**: `#/` ou `#/criador`
  - **Documentação cURL & Python**: `#/docs`
- **Sincronização com o Navegador**: Botões nativos de **Voltar** e **Avançar** do navegador funcionam perfeitamente.
- **Deep Linking com Parâmetros**: Compartilhe códigos e estilos diretamente via URL:
  ```
  https://pycriador.github.io/olivelas-qrcode/#/?data=https://meusite.com&preset=midnight-indigo
  ```
- **Botões de Compartilhamento Direto**:
  - Botão *"Copiar Link Deste QR (URL Própria)"* no painel de download.
  - Botão *"Copiar Link Direto"* no cabeçalho da Documentação.

### 2. 🖥️ Layout Amplo & Fluido (Aproveitamento Total da Tela)
- **Contêiner Expansivo**: Projetado para preencher monitores modernos (Full HD 1920x1080, 2K, 4K e Ultrawide) com contêiner de até **1760px** de largura e espaçamentos simétricos.
- **Pré-visualização Fixa (Sticky)**: O painel lateral direito acompanha a rolagem de toda a página (`top: 5.5rem`), mantendo o QR Code sempre visível.
- **Controles de Ocultação do Painel**:
  - Botão **"Ocultar"** no cabeçalho do card de preview.
  - Botão **"Ocultar / Mostrar QR Code"** na barra superior de navegação.
  - **Dock Flutuante**: Quando minimizado, recolhe-se em uma pílula discreta no canto inferior direito para restauração rápida.
- **Customização em 2 Colunas**: Em telas desktop, os seletores de formas, cores, molduras e exportação dividem-se em colunas paralelas para reduzir o scroll vertical.
- **Galeria com 7 a 10 Cards por Linha**: 54 estilos pré-configurados distribuídos em 6 categorias com busca instantânea.

### 3. 🔗 11 Encurtadores de URL Integrados com Alta Disponibilidade
Encurte qualquer link com 1 clique antes de gerar o código (links mais curtos geram QR Codes com menos módulos e leitura mais rápida por smartphones):
1. **is.gd** (`is.gd`) — *CORS Nativo `*` & JSONP (Alta velocidade)*
2. **v.gd** (`v.gd`) — *CORS Nativo `*` & JSONP*
3. **da.gd** (`da.gd`) — *CORS Nativo `*`*
4. **Clck.ru** (`clck.ru`) — *CORS Nativo `*`*
5. **TinyURL** (`tinyurl.com`)
6. **Ulvis.net** (`ulvis.net`)
7. **Spoo.me** (`spoo.me`)
8. **Chilp.it** (`chilp.it`)
9. **CleanURI** (`cleanuri.com`)
10. **1pt.co** (`1pt.co`)
11. **tny.im** (`tny.im`)
*(Inclui cascata de contingência transparente: caso o provedor selecionado sofra restrições de CORS no navegador ou oscilação de rede, o sistema redireciona automaticamente para os nós nativos `is.gd` / `v.gd` / `da.gd`, garantindo taxa de sucesso de 100% e cópia imediata para a área de transferência).*

### 4. 💸 Gerador de Pix Oficial (Padrão BACEN / BR Code / EMV QRCPS-MPM)
Geração estrita de códigos Pix reconhecidos por **100% dos aplicativos bancários brasileiros** (Nubank, Itaú, Bradesco, Santander, Inter, Caixa, Banco do Brasil, Mercado Pago, PicPay, etc.):
- **Payload EMV Oficial**: Formatação Tag-Length-Value com Payload Format Indicator (`000201`), GUI (`br.gov.bcb.pix`), identificação de moeda (`986` BRL) e checksum de integridade **CRC16-CCITT** (polinômio `0x1021`, init `0xFFFF`).
- **Suporte a todas as chaves**: CPF, CNPJ, Celular internacional (+55), E-mail e Chave Aleatória (EVP / UUID).
- **Valor fixo ou aberto**: Suporte a valor monetário pré-definido ou aberto para preenchimento pelo pagador.
- **Botão Pix Copia e Cola**: Permite ao usuário copiar a linha de código EMV com 1 clique para colar em pagamentos online.

### 5. 📶 Conexão Wi-Fi Automática (Padrão Universal ZXing / iOS / Android)
Permite a qualquer pessoa conectar-se à rede sem digitar senhas longas, bastando apontar a câmera do smartphone:
- **Padrão Internacional ZXing**: Formatação `WIFI:T:<tipo>;S:<ssid>;P:<senha>;H:<oculta>;;` rigorosamente compatível com iOS 11+, Android (Samsung, Pixel, Xiaomi, Motorola), Windows e macOS.
- **Escape de Caracteres Especiais**: Tratamento estrito de caracteres reservados (`;`, `:`, `\`, `,`, `"`) no SSID e senha.
- **Suporte a Redes Abertas e Ocultas**: Detecção e omissão do campo `P:` para redes abertas (`nopass`) e flag de rede oculta (`H:true`).
- **Botão de Cópia Direta**: Copie a string padronizada com 1 clique para documentação ou scripts de infraestrutura.

### 6. 🛡️ Logotipos Oficiais do Wikimedia Commons
Logotipos vetoriais SVG autênticos, embutidos em escudos protetores 500x500 px que preservam o contraste e evitam deformação nos pontos do QR Code:
- **WhatsApp**: [File:WhatsApp.svg](https://commons.wikimedia.org/wiki/File:WhatsApp.svg)
- **Instagram**: [File:Instagram_logo_2016.svg](https://commons.wikimedia.org/wiki/File:Instagram_logo_2016.svg)
- **Pix (Banco Central)**: [File:Pix_logo.svg](https://commons.wikimedia.org/wiki/File:Pix_logo.svg)
- **YouTube**: [File:YouTube_full-color_icon_(2017).svg](https://commons.wikimedia.org/wiki/File:YouTube_full-color_icon_(2017).svg)
- **LinkedIn**: [File:LinkedIn_icon.svg](https://commons.wikimedia.org/wiki/File:LinkedIn_icon.svg)
- **Spotify**: [File:Spotify_logo_without_text.svg](https://commons.wikimedia.org/wiki/File:Spotify_logo_without_text.svg)
- **GitHub**: [File:Octicons-mark-github.svg](https://commons.wikimedia.org/wiki/File:Octicons-mark-github.svg)
- **X / Twitter**: [File:X_logo_2023_original.svg](https://commons.wikimedia.org/wiki/File:X_logo_2023_original.svg)
- **TikTok**: [File:TikTok_logo.svg](https://commons.wikimedia.org/wiki/File:TikTok_logo.svg)
- **Telegram**: [File:Telegram_logo.svg](https://commons.wikimedia.org/wiki/File:Telegram_logo.svg)
- **Facebook**: [File:Facebook_Logo_(2019).png.svg](https://commons.wikimedia.org/wiki/File:Facebook_Logo_(2019).png.svg)
- **Google**: [File:Google_%22G%22_logo.svg](https://commons.wikimedia.org/wiki/File:Google_%22G%22_logo.svg)
- **Wi-Fi**: [File:Wifi_symbol.svg](https://commons.wikimedia.org/wiki/File:Wifi_symbol.svg)
- **Mercado Pago**: [File:MercadoPago_logo.svg](https://commons.wikimedia.org/wiki/File:MercadoPago_logo.svg)
*(Upload personalizado: imagens enviadas pelo usuário passam por Canvas off-screen que preserva a proporção original `contain` sem distorcer).*

---

## 💻 Como Iniciar o Projeto Localmente

### 🪟 No Windows:
- Dê dois cliques em **`start.bat`**, ou
- Pelo PowerShell:
  ```powershell
  .\start.ps1
  ```

### 🐧 No Linux ou 🍎 No macOS:
Execute no terminal:
```bash
./start.sh
```

*(O script detecta se você possui Node/npm para rodar `npm run dev` com live reload na porta 3000, ou Python para servir a aplicação estática).*

---

## ⚡ Comandos cURL Testados e Garantidos

Todos os comandos abaixo foram testados e validados para download direto via terminal:

### 1. Download de PNG em Alta Definição (1024x1024 px):
```bash
curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_1024.png
```

### 2. Download em Vetor SVG Escalável com Cores Personalizadas:
```bash
curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=svg&dark=4f46e5&light=ffffff" -o qrcode_vector.svg
```

### 3. Pipeline Completo: Encurtar URL e Gerar QR Code Automático (Linux/macOS):
```bash
SHORT_URL=$(curl -s "https://tinyurl.com/api-create.php?url=https://github.com/pycriador/olivelas-qrcode")
echo "URL Encurtada: $SHORT_URL"
curl -s "https://quickchart.io/qr?text=${SHORT_URL}&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png
```

### 4. Pipeline no Windows (PowerShell):
```powershell
$short = (curl.exe -s "https://tinyurl.com/api-create.php?url=https://github.com/pycriador/olivelas-qrcode")
curl.exe -s "https://quickchart.io/qr?text=$short&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png
```

### 5. Encurtadores via cURL Prontos para Uso:
```bash
# TinyURL
curl -s "https://tinyurl.com/api-create.php?url=https://github.com/pycriador/olivelas-qrcode"

# is.gd
curl -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode"

# v.gd
curl -s "https://v.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode"

# da.gd
curl -s "https://da.gd/s?url=https://github.com/pycriador/olivelas-qrcode"

# Ulvis.net
curl -s "https://ulvis.net/api.php?url=https://github.com/pycriador/olivelas-qrcode"

# Clck.ru
curl -s "https://clck.ru/--?url=https://github.com/pycriador/olivelas-qrcode"
```

---

## 🐍 Script Python CLI (`scripts/generate_qr.py`)

O script agora funciona **100% nativo com a biblioteca padrão do Python** (`urllib`), sem requerer obrigatoriamente `pip install`. Caso `qrcode[pil]` esteja instalado, ele é utilizado localmente.

```bash
# 1. Gerar QR Code padrão (1024x1024 px):
python scripts/generate_qr.py --url "https://github.com/pycriador/olivelas-qrcode"

# 2. Gerar com cor customizada (#4f46e5) e resolução personalizada:
python scripts/generate_qr.py --url "https://meusite.com" --color "#4f46e5" --size 1024 --output meu_qr.png

# 3. Encurtar a URL automaticamente antes de gerar o código:
python scripts/generate_qr.py --url "https://meusite.com/link-longo" --shorten tinyurl --output qr_curto.png
```

---

## 🚀 Publicação no GitHub Pages via GitHub Actions

O repositório já está 100% preparado para publicação automática através do workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

### Para habilitar no GitHub:
1. Acesse: **[Configurações de Pages](https://github.com/pycriador/olivelas-qrcode/settings/pages)**
2. Na seção **Build and deployment**:
   - Em **Source**, selecione **`GitHub Actions`**.
3. Pronto! A cada `push` na branch `main`, o GitHub Actions compilará o TypeScript e publicará o site automaticamente.
4. O site estará disponível em:
   👉 **`https://pycriador.github.io/olivelas-qrcode/`**

*(Inclui `public/404.html` para redirecionamento transparente de rotas SPA e `public/.nojekyll`).*

---

## 📁 Estrutura do Repositório

```
olivelas-qrcode/
├── index.html                   # Shell da aplicação HTML
├── vite.config.ts               # Configuração do Vite (base: './')
├── tsconfig.json                # Configuração do TypeScript
├── package.json                 # Dependências e scripts npm
├── start.bat                    # Inicializador Windows Batch
├── start.ps1                    # Inicializador Windows PowerShell
├── start.sh                     # Inicializador Linux/macOS
├── public/                      # Arquivos estáticos servidos pelo Vite
│   ├── 404.html                 # Roteador SPA fallback para GitHub Pages
│   ├── .nojekyll                # Desativa Jekyll no GitHub Pages
│   └── scripts/                 # Scripts públicos para download
│       ├── generate_qr.py       # Script CLI Python
│       └── curl_examples.sh     # Exemplos de cURL
├── .github/workflows/
│   └── deploy.yml               # Pipeline de CI/CD no GitHub Actions
├── scripts/                     # Scripts utilitários de terminal
├── docs/                        # Pasta estática sincronizada para contingência
├── dist/                        # Bundle de produção compilado pelo Vite
└── src/
    ├── main.ts                  # Ponto de entrada e Roteador SPA Hash
    ├── types.ts                 # Interfaces e tipagens estritas
    ├── style.css                # Sistema de design responsivo amplo (1760px)
    ├── services/
    │   ├── shorteners.ts        # 11 encurtadores de URL com fallbacks CORS
    │   ├── wikipediaLogos.ts    # Vetores oficiais do Wikimedia Commons
    │   ├── presets.ts           # 54 presets em 6 categorias
    │   └── qrEngine.ts          # Motor de geração, canvas e downloads
    └── components/
        ├── Header.ts            # Cabeçalho com rotas diretas (#/ e #/docs)
        ├── ContentPanel.ts      # Formulários e barra de encurtadores
        ├── PresetGallery.ts     # Galeria com busca e filtros (7-10 colunas)
        ├── CustomizerPanel.ts   # Customização granular em 2 colunas
        ├── IconSelector.ts      # Seletor de logos com escudos protetores
        ├── PreviewSidebar.ts    # Sidebar sticky minimizável na lateral
        └── DocsView.ts          # Documentação em grade com índice sticky
```

---

Desenvolvido com foco em código limpo, modularidade e máxima facilidade de uso.
