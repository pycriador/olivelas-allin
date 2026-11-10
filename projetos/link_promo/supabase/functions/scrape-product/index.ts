const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return `R$${value.toFixed(2).replace('.', ',')}`;
}

function unescapeString(str: string): string {
  return str
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/\\n/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function isProductId(input: string): boolean {
  const trimmed = input.trim();
  return !trimmed.startsWith('http') && /^[A-Za-z0-9\-]{4,20}$/.test(trimmed);
}

function isDataSufficient(data: { productName: string; newPrice: string }): boolean {
  const hasName = !!data.productName && data.productName.length > 5 &&
    !data.productName.toLowerCase().includes('mercado livre') &&
    !data.productName.toLowerCase().includes('mercado libre') &&
    !/verifique|captcha|continuar|verificação|robot/i.test(data.productName) &&
    !/^produto\s*(exemplo|teste)/i.test(data.productName);
  const hasPrice = !!data.newPrice && data.newPrice !== 'R$0,00';
  return hasName && hasPrice;
}

function isSocialPage(url: string): boolean {
  return url.includes('/social/') || url.includes('/sec/') || url.includes('s.shopee.com');
}

function isShopeeUrl(url: string): boolean {
  return url.includes('shopee.com');
}

function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  // Pattern: shopee.com.br/something/SHOP_ID/ITEM_ID
  const match = url.match(/shopee\.com(?:\.\w+)?\/[^\/]+\/(\d+)\/(\d+)/);
  if (match) return { shopId: match[1], itemId: match[2] };
  
  // Pattern: shopee.com.br/product/SHOP_ID/ITEM_ID  
  const match2 = url.match(/shopee\.com(?:\.\w+)?\/product\/(\d+)\/(\d+)/);
  if (match2) return { shopId: match2[1], itemId: match2[2] };
  
  // Pattern: shopee.com.br/-i.SHOP_ID.ITEM_ID
  const match3 = url.match(/shopee\.com(?:\.\w+)?\/.*-i\.(\d+)\.(\d+)/);
  if (match3) return { shopId: match3[1], itemId: match3[2] };
  
  return null;
}

// ─── Shopee Search Extraction ───────────────────────────────────────────────

type ShopeeSearchResult = {
  productName: string;
  oldPrice: string;
  newPrice: string;
  installments: string;
  productUrl?: string; // Real Shopee product URL found via search
};

async function scrapeShopeeViaSearch(shopId: string, itemId: string): Promise<ShopeeSearchResult | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) return null;

  console.log('Searching for Shopee product via Firecrawl search, shopId:', shopId, 'itemId:', itemId);
  
  const queries = [
    `shopee.com.br "${itemId}"`,
    `shopee.com.br ${itemId}`,
  ];
  
  for (const query of queries) {
    try {
      console.log('Firecrawl search query:', query);
      const response = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          limit: 5,
          lang: 'pt-BR',
          country: 'BR',
        }),
      });

      if (!response.ok) {
        console.error('Firecrawl search returned:', response.status);
        continue;
      }

      const searchData = await response.json();
      const results = searchData.data || searchData.results || [];
      console.log('Firecrawl search found', results.length, 'results for query:', query);

      // Collect all price info from ALL search results that mention this product
      let bestName = '';
      let bestUrl = '';
      const allPrices: number[] = [];
      let installments = '';

      for (const result of results) {
        const resultUrl = result.url || result.link || '';
        const title = result.title || '';
        const description = result.description || '';
        
        console.log('Search result:', { url: resultUrl, title: title.substring(0, 80), desc: description.substring(0, 120) });

        // Extract product name from title (Google caches Shopee product titles)
        const productName = title
          .replace(/\s*[\|–-]\s*Shopee\s*Brasil.*$/i, '')
          .replace(/\s*\|\s*Shopee.*$/i, '')
          .replace(/Compre .* no Shopee$/i, '')
          .replace(/\.{3}$/, '')
          .trim();

        // Keep the longest/best product name from Shopee results
        if (productName.length > bestName.length && resultUrl.includes('shopee.com')) {
          bestName = productName;
          bestUrl = resultUrl;
        }

        // Collect prices from description
        const priceMatches = [...description.matchAll(/R\$\s*([\d.,]+)/g)];
        for (const m of priceMatches) {
          const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
          if (val > 0 && val < 1000000) allPrices.push(val);
        }

        // Installments
        if (!installments) {
          const installmentMatch = description.match(/(\d+)x\s*(?:de\s*)?R\$\s*([\d.,]+)\s*(?:sem\s+juros)?/i);
          if (installmentMatch) {
            const qty = installmentMatch[1];
            const amount = installmentMatch[2].replace(/\./g, '').replace(',', '.');
            const price = parseFloat(amount);
            if (price > 0 && parseInt(qty) > 1) installments = `${qty}x de ${formatBRL(price)}`;
          }
        }
      }

      if (bestName && bestName.length > 5) {
        // Determine prices from collected data
        let oldPrice = '';
        let newPrice = '';
        const uniquePrices = [...new Set(allPrices)].sort((a, b) => b - a);
        
        if (uniquePrices.length >= 2) {
          oldPrice = formatBRL(uniquePrices[0]);
          newPrice = formatBRL(uniquePrices[uniquePrices.length - 1]);
        } else if (uniquePrices.length === 1) {
          newPrice = formatBRL(uniquePrices[0]);
        }

        // If no price found in initial search, that's okay — we'll try static HTML and Firecrawl next
        console.log('Shopee search extracted:', { productName: bestName, oldPrice, newPrice, installments, productUrl: bestUrl, allPrices: uniquePrices });
        return { productName: bestName, oldPrice, newPrice, installments, productUrl: bestUrl || undefined };
      }
    } catch (e) {
      console.error('Shopee search query failed:', e);
      continue;
    }
  }
  
  return null;
}


// ─── URL Resolution ─────────────────────────────────────────────────────────

async function resolveRedirects(url: string): Promise<string> {
  console.log('Resolving redirects for:', url);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    const finalUrl = response.url;
    console.log('Resolved to:', finalUrl);
    return finalUrl;
  } catch (e) {
    console.error('Redirect resolution failed:', e);
    return url;
  }
}

async function resolveProductIdToUrl(productId: string): Promise<string> {
  console.log('Resolving product ID:', productId);

  // 1. MLB direct URL
  const mlbMatch = productId.match(/^(MLB\d+)/i);
  if (mlbMatch) {
    const mlbId = mlbMatch[1].toUpperCase();
    return `https://www.mercadolivre.com.br/p/${mlbId}`;
  }

  // 2. ML public API search
  console.log('Trying ML API search for:', productId);
  try {
    const apiResponse = await fetch(
      `https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(productId)}&limit=1`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      if (apiData.results?.length > 0) {
        console.log('Found via API:', apiData.results[0].title);
        return apiData.results[0].permalink;
      }
    }
  } catch (e) {
    console.error('ML API search failed:', e);
  }

  // 3. Fallback HTML search
  const searchUrl = `https://lista.mercadolivre.com.br/${encodeURIComponent(productId)}`;
  console.log('Fallback search:', searchUrl);
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'pt-BR,pt;q=0.9',
      },
      redirect: 'follow',
    });
    if (!response.url?.includes('account-verification')) {
      const html = await response.text();
      const productLinkPatterns = [
        /href="(https:\/\/www\.mercadolivre\.com\.br\/[^"]*\/p\/MLB[^"#&]+)/,
        /href="(https:\/\/produto\.mercadolivre\.com\.br\/MLB[^"#&]+)/,
      ];
      for (const pattern of productLinkPatterns) {
        const match = html.match(pattern);
        if (match) return match[1];
      }
    }
  } catch (e) {
    console.error('Fallback search failed:', e);
  }

  // 4. Firecrawl search as last resort
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (apiKey) {
    console.log('Trying Firecrawl search for product ID:', productId);
    try {
      const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `site:mercadolivre.com.br ${productId}`,
          limit: 3,
          lang: 'pt-BR',
          country: 'BR',
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const results = searchData.data || searchData.results || [];
        console.log('Firecrawl search results:', results.length);

        for (const result of results) {
          const resultUrl = result.url || result.link;
          if (resultUrl && (resultUrl.includes('/p/MLB') || resultUrl.includes('produto.mercadolivre'))) {
            console.log('Found product via Firecrawl search:', resultUrl);
            return resultUrl;
          }
        }

        // If any ML URL found (even listing)
        for (const result of results) {
          const resultUrl = result.url || result.link;
          if (resultUrl && resultUrl.includes('mercadolivre.com')) {
            console.log('Found ML URL via Firecrawl search:', resultUrl);
            return resultUrl;
          }
        }
      }
    } catch (e) {
      console.error('Firecrawl search failed:', e);
    }
  }

  throw new Error(
    `Não encontrei o produto com ID "${productId}". ` +
    `Tente colar a URL direta do produto (ex: mercadolivre.com.br/.../p/MLB12345).`
  );
}

// ─── Extractors ─────────────────────────────────────────────────────────────

function extractMercadoLivreData(html: string) {
  console.log('Parsing Mercado Livre page...');
  let productName = '';
  let oldPrice = '';
  let newPrice = '';
  let installments = '';

  // 1. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      try {
        const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        const data = JSON.parse(jsonContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          if (item['@type'] === 'Product' || (item.name && item.offers)) {
            if (item.name && item.name.length > 3) productName = item.name;
            if (item.offers) {
              const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
              if (offers.lowPrice) newPrice = formatBRL(parseFloat(offers.lowPrice));
              else if (offers.price) newPrice = formatBRL(parseFloat(offers.price));
            }
          }
        }
      } catch { /* skip */ }
    }
  }

  // 2. og:title
  if (!productName || productName.length < 5) {
    const ogMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) ||
                    html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i);
    if (ogMatch) {
      const title = ogMatch[1].replace(/\s*[\|–-]\s*Mercado Li[bv]re.*$/i, '').trim();
      if (title.length > 3) productName = title;
    }
  }

  // 3. <title>
  if (!productName || productName.length < 5) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = titleMatch[1].replace(/\s*[\|–-]\s*Mercado Li[bv]re.*$/i, '').trim();
      if (title.length > 3) productName = title;
    }
  }

  // 4. Preloaded state
  if (!productName || productName.length < 5) {
    const preloadedPatterns = [/"title"\s*:\s*"([^"]{5,})"/, /"short_title"\s*:\s*"([^"]{5,})"/];
    for (const pattern of preloadedPatterns) {
      const match = html.match(pattern);
      if (match && match[1].length > 5 && !match[1].includes('Mercado Livre')) {
        productName = unescapeString(match[1]);
        break;
      }
    }
  }

  // 5. Price from meta
  if (!newPrice) {
    const priceMetaPatterns = [
      /<meta\s+itemprop="price"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+itemprop="price"/i,
      /<meta\s+property="product:price:amount"\s+content="([^"]+)"/i,
      /<meta\s+content="([^"]+)"\s+property="product:price:amount"/i,
    ];
    for (const pattern of priceMetaPatterns) {
      const match = html.match(pattern);
      if (match) {
        const price = parseFloat(match[1]);
        if (price > 0) { newPrice = formatBRL(price); break; }
      }
    }
  }

  // 6. Price from HTML
  if (!newPrice) {
    const pricePatterns = [
      /andes-money-amount__fraction[^>]*>(\d[\d.]*)<\/span>/,
      /"price_amount"\s*:\s*(\d+\.?\d*)/,
      /"price"\s*:\s*(\d+\.?\d*)/,
    ];
    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const value = match[1].replace(/\./g, '').replace(',', '.');
        const price = parseFloat(value);
        if (price > 0 && price < 1000000) { newPrice = formatBRL(price); break; }
      }
    }
  }

  // 7. Old price
  const oldPricePatterns = [
    /"original_price"\s*:\s*(\d+\.?\d*)/i,
    /"list_price"\s*:\s*(\d+\.?\d*)/i,
    /del[^>]*>.*?R\$\s*([\d.,]+)/is,
    /line-through[^>]*>.*?R\$\s*([\d.,]+)/is,
    /andes-money-amount--previous[^>]*>.*?andes-money-amount__fraction[^>]*>(\d[\d.]*)<\/span>/is,
  ];
  for (const pattern of oldPricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const value = match[1].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(value);
      if (price > 0 && price < 1000000) { oldPrice = formatBRL(price); break; }
    }
  }

  // 8. Installments
  const installmentPatterns = [
    /(\d+)x\s*(?:de\s*)?R\$\s*([\d.,]+)\s*(?:sem\s+juros)?/i,
    /"installments":\s*\{[^}]*"quantity":\s*(\d+)[^}]*"amount":\s*([\d.]+)/i,
    /em\s+(\d+)x\s+(?:de\s+)?R\$\s*([\d.,]+)/i,
  ];
  for (const pattern of installmentPatterns) {
    const match = html.match(pattern);
    if (match) {
      const qty = match[1];
      const amount = match[2].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(amount);
      if (price > 0 && parseInt(qty) > 1) { installments = `${qty}x de ${formatBRL(price)}`; break; }
    }
  }

  // Validate old price > new price
  if (oldPrice && newPrice) {
    const oldVal = parseFloat(oldPrice.replace('R$', '').replace('.', '').replace(',', '.'));
    const newVal = parseFloat(newPrice.replace('R$', '').replace('.', '').replace(',', '.'));
    if (oldVal < newVal) {
      // Swap — likely inverted extraction
      console.log('Prices appear inverted, swapping:', { oldPrice, newPrice });
      [oldPrice, newPrice] = [newPrice, oldPrice];
    }
  }

  console.log('ML Extracted:', { productName, oldPrice, newPrice, installments });
  return { productName, oldPrice, newPrice, installments };
}

function extractShopeeData(html: string) {
  console.log('Parsing Shopee page...');
  let productName = '';
  let oldPrice = '';
  let newPrice = '';
  let installments = '';

  // 1. Try OG meta tags (often present even before JS renders)
  const ogTitleMatch = html.match(/<meta\s+(?:property|name)="og:title"\s+content="([^"]+)"/i) ||
                       html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:title"/i);
  if (ogTitleMatch) productName = ogTitleMatch[1].replace(/\s*[\|–-]\s*Shopee.*$/i, '').trim();

  if (!productName) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) productName = titleMatch[1].replace(/\s*[\|–-]\s*Shopee.*$/i, '').trim();
  }

  // 2. Try __INITIAL_STATE__ or embedded JSON data (Shopee sometimes embeds this)
  const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
  if (initialStateMatch) {
    try {
      const state = JSON.parse(initialStateMatch[1]);
      console.log('Found __INITIAL_STATE__ in Shopee HTML');
      // Navigate common Shopee state structures
      const item = state?.item?.item || state?.productDetail?.item || state?.pdp?.item;
      if (item) {
        if (!productName && item.name) productName = item.name;
        if (item.price) {
          const p = typeof item.price === 'number' && item.price > 1000 ? item.price / 100000 : item.price;
          newPrice = formatBRL(p);
        }
        if (item.price_before_discount) {
          const op = typeof item.price_before_discount === 'number' && item.price_before_discount > 1000 
            ? item.price_before_discount / 100000 : item.price_before_discount;
          oldPrice = formatBRL(op);
        }
      }
    } catch (e) {
      console.log('Failed to parse __INITIAL_STATE__:', e);
    }
  }

  // 3. Try embedded JSON patterns in script tags
  if (!newPrice) {
    const shopeeDataPatterns = [
      /"price"\s*:\s*(\d+)/,
      /"price_min"\s*:\s*(\d+)/,
      /"item_basic":\s*\{[^}]*?"price"\s*:\s*(\d+)/,
    ];
    for (const pattern of shopeeDataPatterns) {
      const match = html.match(pattern);
      if (match) {
        const rawValue = parseInt(match[1]);
        // Shopee uses price * 100000 for internal storage
        const value = rawValue > 100000 ? rawValue / 100000 : rawValue;
        if (value > 0 && value < 100000) { newPrice = formatBRL(value); break; }
      }
    }
  }

  if (!oldPrice) {
    const oldPricePatterns = [/"price_before_discount"\s*:\s*(\d+)/, /"price_max_before_discount"\s*:\s*(\d+)/];
    for (const pattern of oldPricePatterns) {
      const match = html.match(pattern);
      if (match) {
        const rawValue = parseInt(match[1]);
        const value = rawValue > 100000 ? rawValue / 100000 : rawValue;
        if (value > 0) { oldPrice = formatBRL(value); break; }
      }
    }
  }

  // 4. Try og:description for prices  
  if (!newPrice) {
    const ogDescMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]+)"/i) ||
                         html.match(/<meta\s+content="([^"]+)"\s+(?:property|name)="og:description"/i);
    if (ogDescMatch) {
      const desc = ogDescMatch[1];
      const priceMatch = desc.match(/R\$\s*([\d.,]+)/);
      if (priceMatch) {
        const value = priceMatch[1].replace(/\./g, '').replace(',', '.');
        const price = parseFloat(value);
        if (price > 0) newPrice = formatBRL(price);
      }
    }
  }

  // 5. Fallback: any R$ in HTML
  if (!newPrice) {
    const priceMatch = html.match(/R\$\s*([\d.,]+)/);
    if (priceMatch) {
      const value = priceMatch[1].replace(/\./g, '').replace(',', '.');
      const price = parseFloat(value);
      if (price > 0) newPrice = formatBRL(price);
    }
  }

  const installmentMatch = html.match(/(\d+)x\s*(?:de\s*)?R\$\s*([\d.,]+)/i);
  if (installmentMatch) installments = `${installmentMatch[1]}x de R$${installmentMatch[2]}`;

  console.log('Shopee Extracted:', { productName, oldPrice, newPrice, installments });
  return { productName, oldPrice, newPrice, installments };
}

// ─── Markdown Extractor (for Firecrawl results) ────────────────────────────

function extractFromMarkdown(markdown: string) {
  console.log('Extracting product data from Firecrawl markdown...');
  let productName = '';
  let oldPrice = '';
  let newPrice = '';
  let installments = '';

  // Skip known ML section headers and generic titles
  const skipPatterns = [
    /quem viu/i, /produtos? recomendados?/i, /também comprou/i,
    /veja também/i, /ofertas? do dia/i, /mais vendidos/i,
    /mercado li[bv]re/i, /descubra/i, /frete grátis/i,
    /carrinho/i, /comprar agora/i, /adicionar/i,
    /^compartilh/i, /^ver mais/i, /^voltar/i,
  ];

  const isGenericText = (text: string) =>
    skipPatterns.some(p => p.test(text)) || text.length < 5;

  // Product name: find first meaningful heading
  const headingMatches = [...markdown.matchAll(/^#+\s+(.+)$/gm)];
  for (const match of headingMatches) {
    const title = match[1].replace(/\s*[\|–-]\s*Mercado Li[bv]re.*$/i, '').trim();
    if (!isGenericText(title) && title.length > 5) {
      productName = title;
      break;
    }
  }

  // Try bold text if no heading worked
  if (!productName) {
    const boldMatches = [...markdown.matchAll(/\*\*([^*]{5,})\*\*/g)];
    for (const match of boldMatches) {
      const text = match[1].trim();
      if (!isGenericText(text) && text.length > 5) {
        productName = text;
        break;
      }
    }
  }

  // Try first substantial line (non-empty, non-generic, non-link-only)
  if (!productName) {
    const lines = markdown.split('\n').map(l => l.trim()).filter(l => l.length > 10);
    for (const line of lines) {
      const cleaned = line.replace(/[#*\[\]()]/g, '').trim();
      if (!isGenericText(cleaned) && cleaned.length > 10 && !cleaned.startsWith('http')) {
        productName = cleaned.slice(0, 150);
        break;
      }
    }
  }

  // Prices: find all R$ occurrences, use the largest as old and smallest as new
  const priceMatches = [...markdown.matchAll(/R\$\s*([\d.,]+)/g)];
  const prices: number[] = [];
  for (const m of priceMatches) {
    const val = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
    if (val > 0 && val < 1000000) prices.push(val);
  }
  // De-duplicate
  const uniquePrices = [...new Set(prices)];
  if (uniquePrices.length >= 2) {
    uniquePrices.sort((a, b) => b - a);
    oldPrice = formatBRL(uniquePrices[0]);
    newPrice = formatBRL(uniquePrices[1]);
  } else if (uniquePrices.length === 1) {
    newPrice = formatBRL(uniquePrices[0]);
  }

  // Installments
  const installmentMatch = markdown.match(/(\d+)x\s*(?:de\s*)?R\$\s*([\d.,]+)\s*(?:sem\s+juros)?/i);
  if (installmentMatch) {
    const qty = installmentMatch[1];
    const amount = installmentMatch[2].replace(/\./g, '').replace(',', '.');
    const price = parseFloat(amount);
    if (price > 0 && parseInt(qty) > 1) installments = `${qty}x de ${formatBRL(price)}`;
  }

  console.log('Markdown Extracted:', { productName, oldPrice, newPrice, installments });
  return { productName, oldPrice, newPrice, installments };
}

// ─── Firecrawl Fallback ─────────────────────────────────────────────────────

async function scrapeWithFirecrawl(url: string): Promise<{ productName: string; oldPrice: string; newPrice: string; installments: string } | null> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.log('FIRECRAWL_API_KEY not set, skipping Firecrawl fallback');
    return null;
  }

  // For Shopee, try canonical product URL for better rendering
  let scrapeUrl = url;
  const isShopee = isShopeeUrl(url);
  if (isShopee) {
    const ids = extractShopeeIds(url);
    if (ids) {
      scrapeUrl = `https://shopee.com.br/product/${ids.shopId}/${ids.itemId}`;
      console.log('Using canonical Shopee URL for Firecrawl:', scrapeUrl);
    }
  }

  console.log('Using Firecrawl to scrape:', scrapeUrl);
  try {
    const isSocial = isSocialPage(url);
    // Always use extract for Shopee (fully JS-rendered) and social pages
    const useExtract = isSocial || isShopee;

    const bodyPayload: Record<string, any> = {
      url: scrapeUrl,
      formats: useExtract ? ['extract', 'markdown'] : ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: isShopee ? 5000 : 3000,
      location: { country: 'BR', languages: ['pt-BR'] },
    };

    if (useExtract) {
      const shopeePrompt = 'Extract the product information from this Shopee product page. The product name is the main title shown on the page. Return the exact product name/title as shown, the current sale price, the original price before discount (if available), and installment payment info. Do NOT use placeholder names like "Produto Exemplo".';
      const mlPrompt = 'Extract the MAIN product being shared/recommended on this page. If there are multiple products, pick the first/featured one. Return the product name, current price (preço atual), original price before discount (preço antigo/riscado), and installment info.';
      
      bodyPayload.extract = {
        prompt: isShopee ? shopeePrompt : mlPrompt,
        schema: {
          type: 'object',
          properties: {
            productName: { type: 'string', description: 'The exact full product name/title as displayed on the page' },
            newPrice: { type: 'string', description: 'Current sale price in BRL (e.g. R$299,90)' },
            oldPrice: { type: 'string', description: 'Original/old/strikethrough price in BRL before discount, if available' },
            installments: { type: 'string', description: 'Installment info (e.g. 12x de R$24,99 sem juros)' },
          },
          required: ['productName'],
        },
      };
    }

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Firecrawl API error:', result);
      return null;
    }

    const firecrawlData = result.data || result;
    console.log('Firecrawl scrape successful');

    // ── CAPTCHA Detection for Shopee ──
    // Shopee aggressively blocks scrapers. When blocked, the markdown is very short
    // and the LLM will hallucinate prices. We must detect this and return null.
    if (isShopee) {
      const markdownLen = firecrawlData.markdown?.length || 0;
      const markdownText = (firecrawlData.markdown || '').toLowerCase();
      const extractData = firecrawlData.extract || firecrawlData.json;
      const extractName = (extractData?.productName || '').toLowerCase();
      
      const captchaIndicators = [
        markdownLen < 2000, // Real product pages have much more content
        /verifique|captcha|verificação|robot|conteúdo principal/i.test(markdownText),
        /produto\s*(exemplo|teste)|product\s*example|nome do produto/i.test(extractName),
        extractName.length < 5,
      ];
      const captchaScore = captchaIndicators.filter(Boolean).length;
      
      console.log('Shopee CAPTCHA detection:', { markdownLen, captchaScore, extractName: extractName.substring(0, 40) });
      
      if (captchaScore >= 2) {
        console.log('CAPTCHA detected on Shopee page (score:', captchaScore, ') — ALL data is unreliable, returning null');
        return null;
      }
    }

    // For extract-mode pages, try extract data first
    const extractData = firecrawlData.extract || firecrawlData.json;
    let extractResult: { productName: string; oldPrice: string; newPrice: string; installments: string } | null = null;
    
    if (useExtract && extractData) {
      console.log('Firecrawl extract result:', JSON.stringify(extractData));
      const cleanPrice = (p: string) => p?.replace(/[~*_]/g, '').trim() || '';
      const extractName = extractData.productName?.replace(/[~*_]/g, '').trim() || '';
      
      // Check if the name looks like a placeholder/hallucination
      const isPlaceholder = !extractName || extractName.length < 5 ||
        /^produto\s*(exemplo|teste|sample)/i.test(extractName) ||
        /^(product|item|example)/i.test(extractName) ||
        /nome do produto/i.test(extractName);
      
      extractResult = {
        productName: isPlaceholder ? '' : extractName,
        oldPrice: cleanPrice(extractData.oldPrice),
        newPrice: cleanPrice(extractData.newPrice),
        installments: extractData.installments?.replace(/[~*_]/g, '').trim() || '',
      };
    }

    // Also try markdown to get product name if extract failed for name
    let mdData: { productName: string; oldPrice: string; newPrice: string; installments: string } | null = null;
    if (firecrawlData.markdown) {
      console.log('Firecrawl markdown length:', firecrawlData.markdown.length);
      mdData = extractFromMarkdown(firecrawlData.markdown);
    }

    // Combine: prefer extract prices (LLM is better at identifying correct prices) 
    // but use markdown name if extract name was a placeholder
    if (extractResult) {
      if (!extractResult.productName && mdData?.productName) {
        extractResult.productName = mdData.productName;
        console.log('Using markdown product name instead of extract placeholder:', mdData.productName);
      }
      if (extractResult.productName && extractResult.newPrice) {
        return extractResult;
      }
      // If extract has name but no price, try markdown prices
      if (extractResult.productName && !extractResult.newPrice && mdData?.newPrice) {
        return { ...mdData, productName: extractResult.productName };
      }
    }

    // If extract totally failed, use markdown
    if (mdData && isDataSufficient(mdData)) {
      console.log('Using Firecrawl markdown extraction');
      return mdData;
    }
    
    // Return whatever we have (even if incomplete)
    if (extractResult && (extractResult.productName || extractResult.newPrice)) return extractResult;
    if (mdData) return mdData;

    // Try HTML extraction (for non-Shopee pages — Shopee HTML is empty without JS)
    if (firecrawlData.html && !isShopee) {
      const isMl = url.includes('mercadolivre') || url.includes('mercadolibre');
      const htmlData = isMl ? extractMercadoLivreData(firecrawlData.html) : extractShopeeData(firecrawlData.html);
      if (isDataSufficient(htmlData)) {
        console.log('Firecrawl HTML extraction successful');
        return htmlData;
      }
    }

    return null;
  } catch (e) {
    console.error('Firecrawl scrape failed:', e);
    return null;
  }
}

// ─── Static HTML Fetch ──────────────────────────────────────────────────────

async function fetchPageHtml(url: string): Promise<{ html: string; finalUrl: string } | null> {
  console.log('Fetching page:', url);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'identity',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    console.error('Failed to fetch page:', response.status);
    return null;
  }

  let finalUrl = response.url || url;

  // Handle account-verification redirect
  if (finalUrl.includes('account-verification') && finalUrl.includes('go=')) {
    try {
      const goParam = new URL(finalUrl).searchParams.get('go');
      if (goParam) {
        console.log('Re-fetching from account-verification redirect:', goParam);
        const retryResponse = await fetch(goParam, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Accept-Encoding': 'identity',
          },
          redirect: 'follow',
        });
        if (retryResponse.ok) {
          return { html: await retryResponse.text(), finalUrl: goParam };
        }
      }
    } catch (e) {
      console.error('Failed to handle account-verification:', e);
    }
  }

  return { html: await response.text(), finalUrl };
}

// ─── Main Handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL ou ID do produto é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    url = url.trim();
    console.log('Input:', url);

    // Resolve product ID → URL
    if (isProductId(url)) {
      console.log('Detected product ID, resolving...');
      url = await resolveProductIdToUrl(url);
      console.log('Resolved URL:', url);
    }

    // Resolve shortened URLs
    if (url.includes('/sec/') || url.includes('s.shopee') || (!url.includes('/p/') && !url.includes('/produto/'))) {
      url = await resolveRedirects(url);
    }

    // Handle account-verification in URL
    if (url.includes('account-verification') && url.includes('go=')) {
      try {
        const goParam = new URL(url).searchParams.get('go');
        if (goParam) { url = goParam; console.log('Extracted from account-verification:', url); }
      } catch { /* ignore */ }
    }

    const isMercadoLivre = url.includes('mercadolivre.com') || url.includes('mercadolibre.com');
    const isShopee = url.includes('shopee.com');
    const marketplace = isMercadoLivre ? 'mercadolivre' : isShopee ? 'shopee' : 'unknown';

    if (marketplace === 'unknown') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL não reconhecida. Use uma URL do Mercado Livre ou Shopee.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const useSocialFallback = isSocialPage(url);
    const isShopeeLink = isShopeeUrl(url);
    let data: { productName: string; oldPrice: string; newPrice: string; installments: string } | null = null;
    let searchProductName = ''; // Reliable name from search (not CAPTCHA'd)

    // Strategy 0: Shopee search (uses Google cached data to avoid CAPTCHA)
    if (isShopeeLink) {
      const ids = extractShopeeIds(url);
      if (ids) {
        console.log('Shopee product detected — trying search first');
        const searchResult = await scrapeShopeeViaSearch(ids.shopId, ids.itemId);
        if (searchResult) {
          searchProductName = searchResult.productName;
          data = {
            productName: searchResult.productName,
            oldPrice: searchResult.oldPrice,
            newPrice: searchResult.newPrice,
            installments: searchResult.installments,
          };
          // If search found a real product URL, use it for Firecrawl instead of the redirect URL
          if (searchResult.productUrl && searchResult.productUrl.includes('shopee.com')) {
            console.log('Using search-found product URL for Firecrawl:', searchResult.productUrl);
            url = searchResult.productUrl;
          }
        }
      }
    }

    // Strategy 1: Firecrawl for social pages or Shopee (JS-rendered, static won't work)
    if ((!data || !isDataSufficient(data)) && (useSocialFallback || isShopeeLink)) {
      console.log('Using Firecrawl for JS-rendered/social page');
      const fcData = await scrapeWithFirecrawl(url);
      if (fcData) {
        // Detect if Firecrawl hit a CAPTCHA page
        const fcIsCaptcha = /verifique|captcha|continuar|verificação|robot/i.test(fcData.productName) ||
          /^produto\s*(exemplo|teste)/i.test(fcData.productName);
        
        if (fcIsCaptcha) {
          console.log('Firecrawl hit CAPTCHA — discarding ALL Firecrawl data (prices are unreliable)');
          // Keep search data, don't overwrite with hallucinated prices
        } else {
          // Firecrawl data is valid — use it, but keep search name if better
          if (searchProductName && searchProductName.length > fcData.productName.length) {
            fcData.productName = searchProductName;
          }
          if (isDataSufficient(fcData)) {
            data = fcData;
          }
        }
      }
    }

    // Strategy 2: Static HTML scraping
    if (!data || !isDataSufficient(data)) {
      console.log('Trying static HTML scraping...');
      const page = await fetchPageHtml(url);
      if (page) {
        url = page.finalUrl;
        console.log('HTML length:', page.html.length);

        const staticData = isMercadoLivre || url.includes('mercadolivre') || url.includes('mercadolibre')
          ? extractMercadoLivreData(page.html)
          : extractShopeeData(page.html);

        console.log('Static extraction result:', staticData);

        if (isDataSufficient(staticData)) {
          // Static data is complete — use it but keep search name if better
          if (searchProductName && searchProductName.length > (staticData.productName?.length || 0)) {
            staticData.productName = searchProductName;
          }
          data = staticData;
        } else if (data) {
          // Merge: keep existing name from search, take any new prices from static
          if (!data.newPrice && staticData.newPrice) data.newPrice = staticData.newPrice;
          if (!data.oldPrice && staticData.oldPrice) data.oldPrice = staticData.oldPrice;
          if (!data.installments && staticData.installments) data.installments = staticData.installments;
          if (!data.productName && staticData.productName) data.productName = staticData.productName;
        } else {
          data = staticData;
        }
      }
    }

    // Strategy 3: Firecrawl fallback if static data was insufficient (non-social, non-Shopee)
    if (data && !isDataSufficient(data) && !useSocialFallback && !isShopeeLink) {
      console.log('Static data insufficient — trying Firecrawl fallback');
      const firecrawlData = await scrapeWithFirecrawl(url);
      if (firecrawlData && isDataSufficient(firecrawlData)) {
        data = firecrawlData;
      }
    }

    if (!data) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível extrair dados do produto.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Final result:', data);

    return new Response(
      JSON.stringify({
        success: true,
        data: { ...data, marketplace, originalUrl: url },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
