/**
 * VITRINE DIGITAL — ANNOUNCEMENT DETAIL PAGE CONTROLLER
 * Reads ?id=... from the URL, fetches data/anuncios.json, and renders the ad & gallery.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const containerEl = document.getElementById("ad-content");
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("id");

  if (!targetId) {
    renderNotFound("Nenhum identificador de anúncio informado.");
    return;
  }

  try {
    const res = await fetch("data/anuncios.json");
    if (!res.ok) throw new Error("Erro ao carregar banco de dados.");
    const anuncios = await res.json();

    const ad = anuncios.find((item) => String(item.id) === String(targetId));

    if (!ad) {
      renderNotFound(`Anúncio "${targetId}" não encontrado.`);
      return;
    }

    renderAdDetail(ad);
  } catch (err) {
    console.error("Erro ao carregar detalhes:", err);
    renderNotFound("Falha ao comunicar com o arquivo de dados.");
  }
});

function renderAdDetail(ad) {
  const containerEl = document.getElementById("ad-content");
  if (!containerEl) return;

  // Atualiza título da aba do navegador
  document.title = `${ad.businessName} — Vitrine Digital`;

  const images = ad.images && ad.images.length > 0 ? ad.images : [{ url: ad.primaryImage || "images/placeholder.jpg", caption: ad.businessName }];
  const products = ad.products || [];
  const rawPhone = String(ad.phone || "").replace(/\D/g, "");
  const defaultMsg = encodeURIComponent(ad.whatsappMessage || `Olá! Vi o anúncio de ${ad.businessName} na Vitrine Digital e gostaria de fazer um pedido.`);
  const wppUrl = rawPhone ? `https://wa.me/${rawPhone}?text=${defaultMsg}` : null;

  containerEl.innerHTML = `
    <div class="ad-detail-grid">
      <!-- Coluna Esquerda: Galeria de Imagens -->
      <div class="ad-gallery-card">
        <div class="main-image-frame">
          <img
            id="main-ad-image"
            src="${images[0].url}"
            alt="${images[0].caption || ad.businessName}"
            onerror="if(this.src.includes('/storage/v1/object/sign/images/')){this.src=this.src.replace('/storage/v1/object/sign/images/','/storage/v1/object/public/images/').split('?')[0];}else if(!this.src.includes('unsplash.com')){this.src='https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80';}"
          />
        </div>

        ${
          images.length > 1
            ? `
          <div class="thumbnails-row">
            ${images
              .map(
                (img, idx) => `
              <button type="button" class="thumb-btn ${idx === 0 ? "active" : ""}" data-src="${img.url}" data-caption="${img.caption || ""}">
                <img
                  src="${img.url}"
                  alt="${img.caption || ""}"
                  onerror="if(this.src.includes('/storage/v1/object/sign/images/')){this.src=this.src.replace('/storage/v1/object/sign/images/','/storage/v1/object/public/images/').split('?')[0];}else if(!this.src.includes('unsplash.com')){this.src='https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80';}"
                />
              </button>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>

      <!-- Coluna Direita: Informações & Contato -->
      <div class="ad-info-card">
        <div>
          <div class="ad-header-badge">
            <span class="badge-tag">${ad.category || "Comércio"}</span>
          </div>
          <h1 class="ad-business-title" style="margin-top: 0.5rem;">${ad.businessName}</h1>
          <p class="ad-summary-text" style="margin-top: 0.75rem;">${ad.summary || ""}</p>
        </div>

        <!-- Box de Contato WhatsApp -->
        ${
          wppUrl
            ? `
          <div class="contact-card-box">
            <div>
              <span style="font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #25D366; letter-spacing: 0.08em;">
                Contato Oficial WhatsApp
              </span>
              <div class="contact-phone-text">${ad.formattedPhone || ad.phone}</div>
              ${ad.workingHours ? `<div style="font-size: 0.72rem; color: #A8A199; margin-top: 0.25rem;">${ad.workingHours}</div>` : ""}
            </div>

            <a href="${wppUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-wpp" style="padding: 0.8rem 1.5rem; font-size: 0.85rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.077-1.745-.384-.969-.404-1.591-1.391-1.639-1.455-.048-.063-.388-.517-.388-.986s.245-.7.332-.801c.088-.101.192-.126.257-.126.065 0 .129.002.186.005.059.003.139-.022.217.165.08.192.273.666.297.714.024.048.04.105.008.169-.032.064-.048.105-.096.161-.048.056-.101.125-.145.168-.048.048-.098.1-.042.196.056.096.249.41.534.664.368.327.679.429.775.477.096.048.153.042.209-.022.056-.064.241-.281.305-.377.064-.096.129-.08.217-.048.088.032.562.265.658.313.096.048.161.072.185.113.024.041.024.234-.12.639z" />
              </svg>
              <span>Conversar no WhatsApp</span>
            </a>
          </div>
        `
            : ""
        }

        <!-- Endereço & Redes Sociais -->
        ${
          ad.address || ad.instagram
            ? `
          <div style="background: var(--bg-surface); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg); padding: 1rem; font-size: 0.8rem; color: var(--color-dim); display: flex; flex-direction: column; gap: 0.35rem;">
            ${ad.address ? `<div><strong>📍 Endereço:</strong> ${ad.address}</div>` : ""}
            ${ad.instagram ? `<div><strong>📸 Instagram:</strong> <span style="color: var(--color-gold-light);">${ad.instagram}</span></div>` : ""}
          </div>
        `
            : ""
        }

        <!-- Catálogo de Produtos e Serviços -->
        ${
          products.length > 0
            ? `
          <div class="products-table-box">
            <h3 class="products-table-title">Cardápio & Ofertas Disponíveis</h3>
            <div class="products-list-items">
              ${products
                .map(
                  (p) => `
                <div class="product-row-item">
                  <div>
                    <h4>${p.name}</h4>
                    ${p.description ? `<p>${p.description}</p>` : ""}
                  </div>
                  ${p.price ? `<div class="price">${p.price}</div>` : ""}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;

  // Listener para trocar imagem principal ao clicar na miniatura
  containerEl.querySelectorAll(".thumb-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      containerEl.querySelectorAll(".thumb-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mainImg = document.getElementById("main-ad-image");
      if (mainImg) {
        mainImg.src = btn.getAttribute("data-src");
      }
    });
  });
}

function renderNotFound(msg) {
  const containerEl = document.getElementById("ad-content");
  if (!containerEl) return;
  containerEl.innerHTML = `
    <div class="empty-state">
      <h3>Anúncio Não Encontrado</h3>
      <p>${msg}</p>
      <div style="margin-top: 1.5rem;">
        <a href="index.html" class="btn btn-gold">← Voltar para a Vitrine</a>
      </div>
    </div>
  `;
}
