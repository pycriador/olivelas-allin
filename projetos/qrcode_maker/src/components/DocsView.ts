export function renderDocsView(onBackToApp: () => void, onShowToast: (msg: string) => void): HTMLElement {
  const container = document.createElement('div');
  container.className = 'docs-container';

  container.innerHTML = `
    <!-- Layout em Grade Ampla para Documentação -->
    <div class="docs-grid-layout">
      
      <!-- Barra Lateral Sticky (Navegação & Downloads) -->
      <aside class="docs-sidebar-sticky">
        <div class="panel-card docs-nav-card">
          <a href="#/" id="btn-docs-back" class="btn-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Voltar ao Criador Interativo
          </a>

          <!-- Indicador de URL Própria -->
          <div class="docs-url-badge-box">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <span style="font-size: 0.72rem; font-weight: 700; text-transform: uppercase; color: var(--text-muted);">URL Própria da Página:</span>
              <span class="url-protocol-pill">#/docs</span>
            </div>
            <button type="button" id="btn-copy-docs-url" class="btn-copy-url-pill" title="Copiar URL direta para compartilhar esta página de documentação">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              Copiar Link Direto
            </button>
          </div>

          <!-- Índice de Seções -->
          <nav class="docs-toc-nav" aria-label="Índice da Documentação">
            <span class="docs-toc-title">Sumário Rápido</span>
            <a href="#sec-curl" class="docs-toc-link">
              <span class="toc-badge">1</span>
              <span>Comandos cURL Rápidos</span>
            </a>
            <a href="#sec-python" class="docs-toc-link">
              <span class="toc-badge">2</span>
              <span>Script Python Automatizado</span>
            </a>
            <a href="#sec-params" class="docs-toc-link">
              <span class="toc-badge">3</span>
              <span>Parâmetros da API cURL</span>
            </a>
            <a href="#sec-shorteners" class="docs-toc-link">
              <span class="toc-badge">4</span>
              <span>11 Encurtadores via Terminal</span>
            </a>
          </nav>

          <!-- Scripts para Download Direto -->
          <div class="docs-downloads-box">
            <span class="docs-toc-title">Arquivos Prontos</span>
            <a href="scripts/generate_qr.py" download="generate_qr.py" class="btn-doc-download full-width">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar Script Python (.py)
            </a>
            <a href="scripts/curl_examples.sh" download="curl_examples.sh" class="btn-doc-download outline full-width">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
              Baixar Exemplos cURL (.sh)
            </a>
          </div>
        </div>
      </aside>

      <!-- Coluna Principal de Conteúdo -->
      <main class="docs-content-col">
        
        <!-- Header da Página -->
        <div class="docs-header-card">
          <h1 class="docs-main-title">📚 Documentação cURL & Scripts Python</h1>
          <p class="docs-subtitle">
            Gere, customize e baixe códigos QR Code em alta definição diretamente do terminal ou em pipelines automatizados de DevOps e scripts.
          </p>
        </div>

        <!-- SEÇÃO 1: COMANDOS cURL -->
        <section id="sec-curl" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">1</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Gerando QR Codes via cURL (100% Funcional)</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Comandos testados para rodar diretamente no terminal Linux, macOS ou Windows PowerShell.</p>
            </div>
          </div>

          <!-- Exemplo 1.1 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 1: Download de QR Code PNG em Alta Definição (1024x1024 px)</span>
              <button class="btn-copy-code" data-target="code-curl-1">Copiar Comando</button>
            </div>
            <pre><code id="code-curl-1">curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_1024.png</code></pre>
          </div>

          <!-- Exemplo 1.2 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 2: Download em Vetor SVG Escalável com Cores Personalizadas</span>
              <button class="btn-copy-code" data-target="code-curl-2">Copiar Comando</button>
            </div>
            <pre><code id="code-curl-2">curl -s "https://quickchart.io/qr?text=https%3A%2F%2Fgithub.com%2Fpycriador%2Folivelas-qrcode&size=1024&format=svg&dark=4f46e5&light=ffffff" -o qrcode_vector.svg</code></pre>
          </div>

          <!-- Exemplo 1.3 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 3: Pipeline: Encurtar URL e Baixar QR Code Automático (Linux/macOS)</span>
              <button class="btn-copy-code" data-target="code-curl-3">Copiar Bash</button>
            </div>
            <pre><code id="code-curl-3"># Encurta a URL via is.gd/TinyURL e gera o QR Code 1024px diretamente do link encurtado
SHORT_URL=$(curl -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode")
echo "URL Encurtada: $SHORT_URL"
curl -s "https://quickchart.io/qr?text=$SHORT_URL&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png</code></pre>
          </div>

          <!-- Exemplo 1.4 -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 4: Pipeline no Windows (PowerShell)</span>
              <button class="btn-copy-code" data-target="code-curl-4">Copiar PowerShell</button>
            </div>
            <pre><code id="code-curl-4"># Encurta e baixa o QR Code no PowerShell (Windows)
$short = (curl.exe -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode")
Write-Host "URL Encurtada: $short"
curl.exe -s "https://quickchart.io/qr?text=$short&size=1024&format=png&dark=4f46e5&light=ffffff" -o qrcode_encurtado.png</code></pre>
          </div>

          <!-- Exemplo 1.5: Pix Oficial BACEN -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 5: Download de QR Code Pix Oficial (Padrão BACEN / BR Code)</span>
              <button class="btn-copy-code" data-target="code-curl-5">Copiar Comando Pix</button>
            </div>
            <pre><code id="code-curl-5"># Baixar QR Code Pix estático (EMV oficial reconhecido por qualquer app de banco)
curl -s -G "https://quickchart.io/qr" \
  --data-urlencode "text=00020126330014br.gov.bcb.pix011112345678900520400005303986540510.005802BR5913WILLIAN JESUS6008BRASILIA62070503***63043133" \
  --data-urlencode "size=1024" \
  --data-urlencode "format=png" \
  --data-urlencode "dark=059669" \
  --data-urlencode "light=ffffff" \
  -o qrcode_pix.png</code></pre>
          </div>

          <!-- Exemplo 1.6: Wi-Fi Conexão Automática -->
          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Exemplo 6: Download de QR Code Wi-Fi Universal (ZXing / iOS / Android)</span>
              <button class="btn-copy-code" data-target="code-curl-6">Copiar Comando Wi-Fi</button>
            </div>
            <pre><code id="code-curl-6"># Baixar QR Code de Wi-Fi para conexão automática (apontou a câmera, conectou)
curl -s -G "https://quickchart.io/qr" \
  --data-urlencode "text=WIFI:T:WPA;S:MinhaCasa_5G;P:minhasenha123;;" \
  --data-urlencode "size=1024" \
  --data-urlencode "format=png" \
  --data-urlencode "dark=0284c7" \
  --data-urlencode "light=ffffff" \
  -o qrcode_wifi.png</code></pre>
          </div>
        </section>

        <!-- SEÇÃO 2: SCRIPT PYTHON OFICIAL -->
        <section id="sec-python" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">2</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Script Python Automatizado (CLI)</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Script completo com suporte a cores personalizadas, encurtador de URL automático e alta resolução.</p>
            </div>
          </div>

          <div style="background: var(--bg-surface-secondary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
            <h3 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.5rem;">Instalação de Dependências:</h3>
            <pre><code style="font-family: monospace; font-size: 0.85rem;">pip install qrcode[pil] requests</code></pre>
          </div>

          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Como executar o script incluído no repositório (scripts/generate_qr.py):</span>
              <button class="btn-copy-code" data-target="code-py-cli">Copiar Exemplo</button>
            </div>
            <pre><code id="code-py-cli"># 1. Gerar QR Code padrão
python scripts/generate_qr.py --url "https://github.com/pycriador/olivelas-qrcode"

# 2. Gerar QR Code Pix Oficial (Padrão BACEN / BR Code)
python scripts/generate_qr.py --pix-key "12345678900" --pix-name "Willian Jesus" --pix-amount 25.00 -o pix_25.png

# 3. Gerar QR Code Wi-Fi para conexão automática (iOS e Android)
python scripts/generate_qr.py --wifi-ssid "MinhaCasa_5G" --wifi-pass "minhasenha123" -o wifi_casa.png

# 4. Gerar com cor customizada (#4f46e5) e resolução 1024px
python scripts/generate_qr.py --url "https://meusite.com" --color "#4f46e5" --size 1024 --output meu_qrcode.png

# 5. Encurtar automaticamente a URL antes de gerar o código
python scripts/generate_qr.py --url "https://meusite.com/artigo-longo" --shorten isgd --output qr_curto.png</code></pre>
          </div>

          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Código Python Independente (Pronto para Copiar):</span>
              <button class="btn-copy-code" data-target="code-py-full">Copiar Código Python</button>
            </div>
            <pre><code id="code-py-full">import qrcode
import requests
from PIL import Image

def generate_qr(url: str, output_path: str = "qrcode.png", fill_color: str = "#4f46e5", back_color: str = "#ffffff"):
    """Gera um QR Code em alta definição e salva no disco."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=20, # Alta definição
        border=3,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color=fill_color, back_color=back_color)
    img.save(output_path)
    print(f"[OK] QR Code salvo com sucesso em: {output_path}")

if __name__ == "__main__":
    generate_qr("https://github.com/pycriador/olivelas-qrcode", "olivelas_qr.png")</code></pre>
          </div>
        </section>

        <!-- SEÇÃO 3: PARÂMETROS E TABELA DE REFERÊNCIA -->
        <section id="sec-params" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">3</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Tabela de Parâmetros da API cURL</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Valores suportados para customizações rápidas via chamadas HTTP.</p>
            </div>
          </div>

          <div style="overflow-x: auto;">
            <table class="docs-table">
              <thead>
                <tr>
                  <th>Parâmetro</th>
                  <th>Tipo</th>
                  <th>Padrão</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>data</code> / <code>text</code></td>
                  <td>String (URL-encoded)</td>
                  <td>Obrigatório</td>
                  <td>O conteúdo, link ou mensagem que o QR Code irá codificar.</td>
                </tr>
                <tr>
                  <td><code>size</code></td>
                  <td>Inteiro (px)</td>
                  <td><code>1024</code></td>
                  <td>Dimensões quadradas da imagem final (ex: 512, 1024, 2048).</td>
                </tr>
                <tr>
                  <td><code>format</code></td>
                  <td><code>png</code> | <code>svg</code> | <code>webp</code></td>
                  <td><code>png</code></td>
                  <td>Formato do arquivo resultante. Use <code>svg</code> para impressão gráfica e corte.</td>
                </tr>
                <tr>
                  <td><code>dark</code> / <code>color</code></td>
                  <td>Hexadecimal</td>
                  <td><code>#0f172a</code></td>
                  <td>Cor dos pontos e marcadores do código (ex: <code>4f46e5</code>).</td>
                </tr>
                <tr>
                  <td><code>light</code> / <code>bg</code></td>
                  <td>Hexadecimal</td>
                  <td><code>#ffffff</code></td>
                  <td>Cor do plano de fundo. Adicione <code>00</code> no final para transparência em SVG.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SEÇÃO 4: ENCURTADORES DE URL VIA TERMINAL -->
        <section id="sec-shorteners" class="panel-card docs-section-card">
          <div class="docs-section-heading">
            <div class="step-badge">4</div>
            <div>
              <h2 style="font-size: 1.25rem; font-weight: 700; color: var(--text-primary);">Encurtadores de URL via Terminal (100% Testados)</h2>
              <p style="font-size: 0.85rem; color: var(--text-muted);">Comandos cURL diretos para encurtar links sem necessidade de chaves de API pagas.</p>
            </div>
          </div>

          <div class="code-example-block">
            <div class="code-header">
              <span class="code-title">Endpoints cURL Prontos para Execução:</span>
              <button class="btn-copy-code" data-target="code-shorteners-curl">Copiar Comandos</button>
            </div>
            <pre><code id="code-shorteners-curl"># 1. TinyURL (Mais estável e popular)
curl -s "https://tinyurl.com/api-create.php?url=https://github.com/pycriador/olivelas-qrcode"

# 2. is.gd (Retorna apenas o link encurtado)
curl -s "https://is.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode"

# 3. v.gd (Com prévia de segurança)
curl -s "https://v.gd/create.php?format=simple&url=https://github.com/pycriador/olivelas-qrcode"

# 4. da.gd (Super rápido e minimalista)
curl -s "https://da.gd/s?url=https://github.com/pycriador/olivelas-qrcode"

# 5. Ulvis.net (Alta disponibilidade)
curl -s "https://ulvis.net/api.php?url=https://github.com/pycriador/olivelas-qrcode"

# 6. Clck.ru (Yandex ecosystem)
curl -s "https://clck.ru/--?url=https://github.com/pycriador/olivelas-qrcode"

# 7. Spoo.me (Suporte a estatísticas JSON)
curl -s -X POST -d "url=https://github.com/pycriador/olivelas-qrcode" -H "Accept: application/json" https://spoo.me</code></pre>
          </div>
        </section>

      </main>
    </div>
  `;

  // Eventos
  container.querySelector('#btn-docs-back')?.addEventListener('click', (e) => {
    e.preventDefault();
    onBackToApp();
  });

  // Copiar URL própria da página
  container.querySelector('#btn-copy-docs-url')?.addEventListener('click', async () => {
    try {
      const fullUrl = `${window.location.origin}${window.location.pathname}#/docs`;
      await navigator.clipboard.writeText(fullUrl);
      onShowToast('URL própria da Documentação copiada! Pronto para compartilhar.');
    } catch {
      onShowToast('Não foi possível copiar o link');
    }
  });

  container.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetId = btn.getAttribute('data-target');
      const codeEl = container.querySelector(`#${targetId}`);
      if (codeEl) {
        await navigator.clipboard.writeText(codeEl.textContent || '');
        btn.textContent = 'Copiado!';
        onShowToast('Código copiado para a área de transferência!');
        setTimeout(() => { btn.textContent = 'Copiar'; }, 2000);
      }
    });
  });

  return container;
}
