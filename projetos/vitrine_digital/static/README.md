# Vitrine Digital — Versão Estática Autônoma 🌐

Esta pasta (`/static`) contém uma versão 100% estática e autônoma da **Vitrine Digital**, construída em **HTML5, CSS3 puro e Vanilla JavaScript**, sem nenhuma dependência de backend, Node.js, Supabase ou login.

---

## 🔄 Como sincronizar com os Anúncios Publicados no Sistema

A versão estática pode refletir exatamente todos os anúncios reais que foram analisados pela IA e aprovados/publicados na sua plataforma principal:

### Método 1: Exportação em 1 Clique (Pelo Navegador)
1. Acesse a Vitrine Digital no seu aplicativo.
2. Na barra de controles do Catálogo (ao lado do botão *Embaralhar*), clique em **"Exportar Estático"**.
3. O sistema irá gerar e baixar automaticamente o arquivo `anuncios.json` consolidando todos os comércios ativos, produtos extraídos, fotos em links públicos e números de WhatsApp.
4. Salve ou substitua o arquivo em `static/data/anuncios.json`.
5. Faça o commit e envie para o GitHub:
   ```bash
   git add static/data/anuncios.json
   git commit -m "chore: atualizar catalogo estatico de anuncios"
   git push origin main
   ```
Pronto! A vitrine do GitHub Pages atualizará com todos os anúncios reais.

---

## 🚀 Como publicar no GitHub Pages ou Servidor Estático

### Opção 1: GitHub Pages via GitHub Actions ou Branch dedicado
Você pode publicar o conteúdo da pasta `/static` diretamente no GitHub Pages configurando um workflow ou subindo para o branch `gh-pages`.

### Opção 2: Hospedagem em qualquer CDN / Servidor (Vercel, Netlify, Cloudflare Pages)
Basta apontar o diretório de publicação (Publish Directory) para `static`.

---

## 📝 Como adicionar ou editar produtos

Todos os dados dos estabelecimentos, fotos, preços, produtos e contatos de WhatsApp são carregados diretamente do arquivo:

📁 **`static/data/anuncios.json`**

### Exemplo de Estrutura:
```json
[
  {
    "id": "minha-loja-01",
    "businessName": "Nome da Minha Loja",
    "category": "Alimentação & Doces",
    "summary": "Descrição resumida dos produtos e serviços.",
    "phone": "5511999999999",
    "formattedPhone": "+55 (11) 99999-9999",
    "whatsappMessage": "Olá! Vi seu anúncio na Vitrine Digital e gostaria de fazer um pedido.",
    "primaryImage": "https://link-da-sua-imagem.com/foto.jpg",
    "images": [
      {
        "id": "img-1",
        "url": "https://link-da-sua-imagem.com/foto.jpg",
        "caption": "Nome do Prato / Foto"
      }
    ],
    "keywords": ["Bolo", "Doce", "Salgado"],
    "products": [
      {
        "name": "Bolo de Cenoura com Chocolate",
        "price": "R$ 35,00",
        "description": "Bolo caseiro com cobertura cremosa."
      }
    ],
    "address": "Rua Exemplo, 100 — Centro",
    "instagram": "@minhaloja",
    "workingHours": "Segunda a Sábado das 08h às 18h"
  }
]
```

---

## 🎨 Design System Olivelas
- Paleta em Carvão Nobre (`#151413`), Superfícies Minerais (`#201E1C`) e Dourado Ocre (`#A88C5A`).
- Tipografia em `Playfair Display` (títulos editoriais) e `Montserrat` (interface limpa).
- Botão oficial de conversão direta para o WhatsApp (`#25D366`).
