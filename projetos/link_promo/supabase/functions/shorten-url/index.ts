const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function shortenWithTinyUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const shortUrl = await response.text();
      if (shortUrl.startsWith('http')) {
        return shortUrl;
      }
    }
  } catch (e) {
    console.error('TinyURL error:', e);
  }
  return null;
}

async function shortenWithIsGd(url: string): Promise<string | null> {
  try {
    const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const shortUrl = await response.text();
      if (shortUrl.startsWith('http')) {
        return shortUrl;
      }
    }
  } catch (e) {
    console.error('is.gd error:', e);
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Shortening URL:', url);

    // Try TinyURL first, then is.gd as fallback
    let shortUrl = await shortenWithTinyUrl(url);
    let provider = 'tinyurl';

    if (!shortUrl) {
      shortUrl = await shortenWithIsGd(url);
      provider = 'is.gd';
    }

    if (!shortUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Não foi possível encurtar a URL. Tente novamente.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('URL shortened via', provider, ':', shortUrl);

    return new Response(
      JSON.stringify({ success: true, shortUrl, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('URL shortening error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
