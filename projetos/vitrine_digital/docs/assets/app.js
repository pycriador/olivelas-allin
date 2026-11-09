/**
 * AI WhatsApp Image Analyzer — Documentation Browser
 * High-performance bilingual client-side Markdown reader with Mermaid diagrams.
 */

(function () {
  "use strict";

  // Document Registry & Translation Mapping
  const DOCS_DATA = {
    "pt-BR": {
      langName: "Português",
      flag: "🇧🇷",
      defaultDoc: "pt-BR/visao-geral.md",
      groups: [
        {
          name: "Manual & Operação",
          items: [
            { id: "HOWTO-01", path: "pt-BR/como-funciona.md", title: "Como Funciona o Sistema (Manual)", counterpart: "en/how-it-works.md", icon: "🚀", type: "Guide", status: "ACCEPTED" }
          ]
        },
        {
          name: "Visão & Arquitetura",
          items: [
            { id: "PROJ-01", path: "pt-BR/visao-geral.md", title: "Visão Geral do Projeto", counterpart: "en/project-overview.md", icon: "📖", type: "Context", status: "ACCEPTED" },
            { id: "ARCH-01", path: "pt-BR/arquitetura.md", title: "Arquitetura do Sistema", counterpart: "en/architecture.md", icon: "🏛️", type: "Reference", status: "ACCEPTED" },
            { id: "ARCH-02", path: "pt-BR/contexto-do-sistema.md", title: "Contexto do Sistema", counterpart: "en/system-context.md", icon: "🌐", type: "Reference", status: "ACCEPTED" },
            { id: "ARCH-03", path: "pt-BR/fluxo-de-dados.md", title: "Fluxo de Dados", counterpart: "en/data-flow.md", icon: "🔄", type: "Reference", status: "ACCEPTED" },
            { id: "AI-CTX-01", path: "pt-BR/contexto-ia.md", title: "Contexto de IA & Prompts", counterpart: "en/ai-context.md", icon: "🤖", type: "Reference", status: "ACCEPTED" }
          ]
        },
        {
          name: "Engenharia & Contratos",
          items: [
            { id: "CTR-01", path: "pt-BR/contratos/README.md", title: "Contratos de Interface", counterpart: "en/contracts/README.md", icon: "📜", type: "Reference", status: "ACCEPTED" },
            { id: "INF-01", path: "pt-BR/infraestrutura/supabase.md", title: "Infraestrutura Supabase", counterpart: "en/infrastructure/supabase.md", icon: "🗄️", type: "Reference", status: "ACCEPTED" },
            { id: "DEC-01", path: "pt-BR/decisoes/adr-001-stack-tecnologico.md", title: "ADR-001 — Stack Tecnológica", counterpart: "en/decisions/adr-001-tech-stack.md", icon: "⚖️", type: "Reference", status: "ACCEPTED" }
          ]
        },
        {
          name: "Operações & Segurança",
          items: [
            { id: "OPS-01", path: "pt-BR/operacoes/perfil-do-servico.md", title: "Perfil do Serviço", counterpart: "en/operations/service-profile.md", icon: "📊", type: "Reference", status: "ACCEPTED" },
            { id: "OPS-02", path: "pt-BR/operacoes/runbook.md", title: "Runbook de Operações", counterpart: "en/operations/runbook.md", icon: "🛠️", type: "Reference", status: "ACCEPTED" },
            { id: "SEC-01", path: "pt-BR/seguranca/seguranca.md", title: "Segurança & Privacidade", counterpart: "en/security/security.md", icon: "🔒", type: "Reference", status: "ACCEPTED" },
            { id: "TPL-01", path: "pt-BR/templates/README.md", title: "Templates de Documentação", counterpart: "en/templates/README.md", icon: "📑", type: "Context", status: "ACCEPTED" }
          ]
        }
      ]
    },
    "en": {
      langName: "English",
      flag: "🇺🇸",
      defaultDoc: "en/project-overview.md",
      groups: [
        {
          name: "Manual & Operation",
          items: [
            { id: "HOWTO-01", path: "en/how-it-works.md", title: "How the System Works (Manual)", counterpart: "pt-BR/como-funciona.md", icon: "🚀", type: "Guide", status: "ACCEPTED" }
          ]
        },
        {
          name: "Vision & Architecture",
          items: [
            { id: "PROJ-01", path: "en/project-overview.md", title: "Project Overview", counterpart: "pt-BR/visao-geral.md", icon: "📖", type: "Context", status: "ACCEPTED" },
            { id: "ARCH-01", path: "en/architecture.md", title: "Architecture", counterpart: "pt-BR/arquitetura.md", icon: "🏛️", type: "Reference", status: "ACCEPTED" },
            { id: "ARCH-02", path: "en/system-context.md", title: "System Context", counterpart: "pt-BR/contexto-do-sistema.md", icon: "🌐", type: "Reference", status: "ACCEPTED" },
            { id: "ARCH-03", path: "en/data-flow.md", title: "Data Flow", counterpart: "pt-BR/fluxo-de-dados.md", icon: "🔄", type: "Reference", status: "ACCEPTED" },
            { id: "AI-CTX-01", path: "en/ai-context.md", title: "AI Context & Prompts", counterpart: "pt-BR/contexto-ia.md", icon: "🤖", type: "Reference", status: "ACCEPTED" }
          ]
        },
        {
          name: "Engineering & Contracts",
          items: [
            { id: "CTR-01", path: "en/contracts/README.md", title: "Interface Contracts", counterpart: "pt-BR/contratos/README.md", icon: "📜", type: "Reference", status: "ACCEPTED" },
            { id: "INF-01", path: "en/infrastructure/supabase.md", title: "Supabase Infrastructure", counterpart: "pt-BR/infraestrutura/supabase.md", icon: "🗄️", type: "Reference", status: "ACCEPTED" },
            { id: "DEC-01", path: "en/decisions/adr-001-tech-stack.md", title: "ADR-001 — Tech Stack Selection", counterpart: "pt-BR/decisoes/adr-001-tech-stack.md", icon: "⚖️", type: "Reference", status: "ACCEPTED" }
          ]
        },
        {
          name: "Operations & Security",
          items: [
            { id: "OPS-01", path: "en/operations/service-profile.md", title: "Service Profile", counterpart: "pt-BR/operacoes/perfil-do-servico.md", icon: "📊", type: "Reference", status: "ACCEPTED" },
            { id: "OPS-02", path: "en/operations/runbook.md", title: "Operations Runbook", counterpart: "pt-BR/operacoes/runbook.md", icon: "🛠️", type: "Reference", status: "ACCEPTED" },
            { id: "SEC-01", path: "en/security/security.md", title: "Security & Privacy", counterpart: "pt-BR/seguranca/seguranca.md", icon: "🔒", type: "Reference", status: "ACCEPTED" },
            { id: "TPL-01", path: "en/templates/README.md", title: "Documentation Templates", counterpart: "pt-BR/templates/README.md", icon: "📑", type: "Context", status: "ACCEPTED" }
          ]
        }
      ]
    }
  };

  // State
  const state = {
    currentLang: localStorage.getItem("doc_lang") || "pt-BR",
    currentPath: "",
    searchQuery: "",
    theme: localStorage.getItem("doc_theme") || "light",
    mermaidCounter: 0
  };

  // DOM Elements
  const els = {
    article: document.getElementById("article"),
    navTree: document.getElementById("navTree"),
    toc: document.getElementById("toc"),
    tocRail: document.getElementById("tocRail"),
    searchInput: document.getElementById("searchInput"),
    themeToggle: document.getElementById("themeToggle"),
    navToggle: document.getElementById("navToggle"),
    sidebar: document.getElementById("sidebar"),
    scrim: document.getElementById("scrim"),
    hljsLight: document.getElementById("hljs-light"),
    hljsDark: document.getElementById("hljs-dark")
  };

  // Initialize Mermaid
  function initMermaid(theme) {
    if (window.mermaid) {
      window.mermaid.initialize({
        startOnLoad: false,
        theme: theme === "dark" ? "dark" : "default",
        securityLevel: "loose",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        flowchart: { curve: "basis", htmlLabels: true },
        sequence: { actorFontFamily: "'Inter', sans-serif", messageFontFamily: "'Inter', sans-serif" }
      });
    }
  }

  // Configure marked parser with highlight.js
  if (window.marked) {
    const renderer = new window.marked.Renderer();

    // Custom code block renderer to capture mermaid blocks cleanly
    renderer.code = function (code, lang) {
      if (lang === "mermaid") {
        state.mermaidCounter++;
        const id = `mermaid-diag-${state.mermaidCounter}`;
        return `
          <div class="mermaid-container">
            <div class="mermaid-toolbar">
              <span class="mermaid-tag">📊 Diagrama de Arquitetura</span>
            </div>
            <div class="mermaid" id="${id}">${code}</div>
          </div>
        `;
      }

      let highlighted = code;
      if (window.hljs) {
        if (lang && window.hljs.getLanguage(lang)) {
          try {
            highlighted = window.hljs.highlight(code, { language: lang }).value;
          } catch (_) {}
        } else {
          try {
            highlighted = window.hljs.highlightAuto(code).value;
          } catch (_) {}
        }
      }

      return `
        <div class="codeblock">
          <div class="codeblock-head">
            <span>${lang || "code"}</span>
            <button type="button" class="cb-copy" onclick="window.__copyCode(this)">Copiar</button>
          </div>
          <pre><code>${highlighted}</code></pre>
        </div>
      `;
    };

    // Table wrapper renderer
    renderer.table = function (header, body) {
      return `
        <div class="table-wrap">
          <table>
            <thead>${header}</thead>
            <tbody>${body}</tbody>
          </table>
        </div>
      `;
    };

    window.marked.setOptions({
      renderer: renderer,
      gfm: true,
      breaks: true
    });
  }

  // Global Code Copy Function
  window.__copyCode = function (btn) {
    const pre = btn.closest(".codeblock").querySelector("pre code");
    if (!pre) return;
    navigator.clipboard.writeText(pre.innerText).then(() => {
      btn.innerText = "✓ Copiado!";
      btn.classList.add("done");
      setTimeout(() => {
        btn.innerText = "Copiar";
        btn.classList.remove("done");
      }, 2000);
    });
  };

  // Format GitHub Alerts/Callouts (> [!NOTE], > [!TIP], etc.)
  function transformAlerts(container) {
    const blockquotes = container.querySelectorAll("blockquote");
    blockquotes.forEach((bq) => {
      const firstP = bq.querySelector("p");
      if (!firstP) return;

      const text = firstP.innerHTML.trim();
      const match = text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(.*)/i);
      if (match) {
        const type = match[1].toUpperCase();
        const content = match[2];
        firstP.innerHTML = content;

        let icon = "ℹ️";
        let title = "Nota";
        let className = "callout-note";

        if (type === "TIP") {
          icon = "💡";
          title = "Dica";
          className = "callout-tip";
        } else if (type === "IMPORTANT") {
          icon = "📌";
          title = "Importante";
          className = "callout-important";
        } else if (type === "WARNING") {
          icon = "⚠️";
          title = "Atenção";
          className = "callout-warning";
        } else if (type === "CAUTION") {
          icon = "🛑";
          title = "Cuidado";
          className = "callout-caution";
        }

        const callout = document.createElement("div");
        callout.className = `callout-card ${className}`;
        callout.innerHTML = `
          <div class="callout-header">
            <span class="callout-icon">${icon}</span>
            <strong>${title}</strong>
          </div>
          <div class="callout-content">${bq.innerHTML}</div>
        `;
        bq.replaceWith(callout);
      }
    });
  }

  // Find document item across registry
  function findDocItem(path) {
    if (!path) return null;
    const clean = path.replace(/^[#/]+/, "");
    for (const lang of ["pt-BR", "en"]) {
      for (const group of DOCS_DATA[lang].groups) {
        const item = group.items.find((i) => i.path === clean);
        if (item) return { ...item, lang };
      }
    }
    return null;
  }

  // Theme Initializer and Toggle
  function initTheme() {
    applyTheme(state.theme);
    initMermaid(state.theme);

    if (els.themeToggle) {
      els.themeToggle.addEventListener("click", () => {
        const next = state.theme === "light" ? "dark" : "light";
        state.theme = next;
        localStorage.setItem("doc_theme", next);
        applyTheme(next);
        initMermaid(next);
        // Re-render current doc to update Mermaid diagram theme
        if (state.currentPath) {
          loadDocument(state.currentPath);
        }
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (els.hljsLight && els.hljsDark) {
      if (theme === "dark") {
        els.hljsLight.setAttribute("disabled", "disabled");
        els.hljsDark.removeAttribute("disabled");
      } else {
        els.hljsDark.setAttribute("disabled", "disabled");
        els.hljsLight.removeAttribute("disabled");
      }
    }
  }

  // Mobile Drawer Toggle
  function setupMobileNav() {
    if (els.navToggle && els.sidebar && els.scrim) {
      els.navToggle.addEventListener("click", () => {
        const isOpen = els.sidebar.classList.toggle("open");
        els.scrim.hidden = !isOpen;
        els.navToggle.setAttribute("aria-expanded", String(isOpen));
      });

      els.scrim.addEventListener("click", () => {
        els.sidebar.classList.remove("open");
        els.scrim.hidden = true;
        els.navToggle.setAttribute("aria-expanded", "false");
      });
    }
  }

  // Render Left Navigation Sidebar
  function renderNavTree() {
    if (!els.navTree) return;
    const langData = DOCS_DATA[state.currentLang] || DOCS_DATA["pt-BR"];

    let html = `
      <div style="margin-bottom: 16px; padding: 0 4px;">
        <div class="lang-switch">
          <div class="seg" style="width: 100%; display: flex; justify-content: space-around;">
            <button type="button" class="${state.currentLang === 'pt-BR' ? 'active' : ''}" onclick="window.__docSwitchLang('pt-BR')" style="flex: 1; border: 0; background: ${state.currentLang === 'pt-BR' ? 'var(--grad)' : 'transparent'}; color: ${state.currentLang === 'pt-BR' ? '#fff' : 'var(--muted)'}; font-weight: 600; padding: 7px; border-radius: 8px; cursor: pointer; transition: all .15s ease;">
              🇧🇷 Português
            </button>
            <button type="button" class="${state.currentLang === 'en' ? 'active' : ''}" onclick="window.__docSwitchLang('en')" style="flex: 1; border: 0; background: ${state.currentLang === 'en' ? 'var(--grad)' : 'transparent'}; color: ${state.currentLang === 'en' ? '#fff' : 'var(--muted)'}; font-weight: 600; padding: 7px; border-radius: 8px; cursor: pointer; transition: all .15s ease;">
              🇺🇸 English
            </button>
          </div>
        </div>
      </div>
    `;

    langData.groups.forEach((group, idx) => {
      const itemsHtml = group.items
        .map((item) => {
          const isActive = state.currentPath.endsWith(item.path);
          return `
            <a
              href="#/${item.path}"
              class="nav-item ${isActive ? "active" : ""}"
              data-path="${item.path}"
            >
              <span class="ni-icon">${item.icon}</span>
              <span>${item.title}</span>
            </a>
          `;
        })
        .join("");

      html += `
        <div class="nav-group open" data-group-id="${idx}">
          <button type="button" class="nav-group-label" onclick="this.parentElement.classList.toggle('open')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <span>${group.name}</span>
          </button>
          <div class="nav-group-items">
            ${itemsHtml}
          </div>
        </div>
      `;
    });

    els.navTree.innerHTML = html;
  }

  // Switch Language handler
  window.__docSwitchLang = function (newLang) {
    if (newLang === state.currentLang) return;
    state.currentLang = newLang;
    localStorage.setItem("doc_lang", newLang);

    // Try finding counterpart of current doc
    const currentItem = findDocItem(state.currentPath);
    let targetPath = DOCS_DATA[newLang].defaultDoc;
    if (currentItem && currentItem.counterpart) {
      targetPath = currentItem.counterpart;
    }

    location.hash = "#/" + targetPath;
  };

  // Build Table of Contents for Current Document
  function buildTOC() {
    if (!els.toc || !els.article) return;
    const headings = els.article.querySelectorAll("h2, h3");

    if (headings.length === 0) {
      els.toc.innerHTML = '<span style="color: var(--faint); font-size: 13px;">Sem subtítulos</span>';
      return;
    }

    let tocHtml = "";
    headings.forEach((heading, idx) => {
      const id = heading.id || `heading-${idx}`;
      heading.id = id;
      const level = heading.tagName.toLowerCase();
      const isH3 = level === "h3";

      tocHtml += `
        <a href="#${id}" class="toc-link ${isH3 ? "lvl-3" : ""}" data-target="${id}">
          ${heading.textContent}
        </a>
      `;
    });

    els.toc.innerHTML = tocHtml;

    // Click smooth scroll
    els.toc.querySelectorAll(".toc-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = link.getAttribute("data-target");
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          history.pushState(null, "", `#${targetId}`);
        }
      });
    });
  }

  // Highlight Active TOC Item on Scroll
  function setupScrollSpy() {
    window.addEventListener("scroll", () => {
      const headings = els.article ? els.article.querySelectorAll("h2, h3") : [];
      if (headings.length === 0) return;

      let activeId = "";
      const scrollY = window.scrollY + 120;

      headings.forEach((h) => {
        if (h.offsetTop <= scrollY) {
          activeId = h.id;
        }
      });

      if (els.toc) {
        els.toc.querySelectorAll(".toc-link").forEach((link) => {
          link.classList.toggle("active", link.getAttribute("data-target") === activeId);
        });
      }
    }, { passive: true });
  }

  // Render Mermaid Diagrams in container
  async function renderMermaids() {
    if (!window.mermaid) return;
    const diagrams = els.article.querySelectorAll(".mermaid");
    if (diagrams.length === 0) return;

    try {
      await window.mermaid.run({ nodes: diagrams });
    } catch (err) {
      console.warn("Mermaid rendering issue:", err);
    }
  }

  // Load and Render Markdown Document
  async function loadDocument(docPath) {
    const cleanPath = docPath.replace(/^[#/]+/, "");
    state.currentPath = cleanPath;

    // Detect language from path
    if (cleanPath.startsWith("en/")) {
      state.currentLang = "en";
    } else if (cleanPath.startsWith("pt-BR/")) {
      state.currentLang = "pt-BR";
    }
    localStorage.setItem("doc_lang", state.currentLang);

    renderNavTree();

    if (els.article) {
      els.article.innerHTML = `
        <div style="text-align: center; padding: 70px 0; color: var(--muted);">
          <div style="font-size: 32px; margin-bottom: 12px; animation: pulse 1.5s infinite;">⌛</div>
          <p style="font-size: 15px;">Carregando documentação...</p>
        </div>
      `;
    }

    try {
      const res = await fetch(cleanPath);
      if (!res.ok) {
        throw new Error(`Arquivo não encontrado (HTTP ${res.status}): ${cleanPath}`);
      }
      const markdown = await res.text();

      state.mermaidCounter = 0;

      // Convert Markdown to HTML
      let html = window.marked ? window.marked.parse(markdown) : markdown;
      if (window.DOMPurify) {
        html = window.DOMPurify.sanitize(html, {
          ADD_TAGS: ["svg", "path", "g", "polygon", "polyline", "rect", "circle", "line", "text", "defs", "marker", "foreignObject"],
          ADD_ATTR: ["viewBox", "width", "height", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "d", "x", "y", "transform", "id", "class", "style"]
        });
      }

      const docItem = findDocItem(cleanPath);
      const title = docItem ? docItem.title : cleanPath.split("/").pop().replace(".md", "");
      const type = docItem ? docItem.type : "Document";
      const status = docItem ? docItem.status : "ACCEPTED";
      const otherLang = state.currentLang === "pt-BR" ? "en" : "pt-BR";
      const counterpartPath = docItem && docItem.counterpart ? docItem.counterpart : null;

      const heroHeader = `
        <header class="doc-hero">
          <div class="doc-kicker">
            <span class="badge st-accepted">${status}</span>
            <span class="chip"><code>${docItem ? docItem.id : "DOC"}</code></span>
            <span class="chip">📌 ${type}</span>
            ${
              counterpartPath
                ? `<a href="#/${counterpartPath}" class="chip" style="text-decoration: none; color: var(--accent); font-weight: 600;">
                    🌐 Switch to ${otherLang === "en" ? "English" : "Português"} →
                   </a>`
                : ""
            }
          </div>
          <h1 class="doc-title">${title}</h1>
        </header>
      `;

      els.article.innerHTML = heroHeader + `<div class="markdown-body">${html}</div>`;

      // Transform callout alerts & clean elements
      transformAlerts(els.article);

      // Intercept internal markdown links in the article
      els.article.querySelectorAll("a").forEach((a) => {
        const href = a.getAttribute("href");
        if (href && !href.startsWith("http") && !href.startsWith("#") && !href.startsWith("mailto:")) {
          const baseParts = cleanPath.split("/");
          baseParts.pop();
          const targetParts = href.split("/");
          for (const p of targetParts) {
            if (p === "." || p === "") continue;
            if (p === "..") baseParts.pop();
            else baseParts.push(p);
          }
          a.setAttribute("href", "#/" + baseParts.join("/"));
        }
      });

      // Render Mermaid Diagrams
      await renderMermaids();

      // Build Table of Contents
      buildTOC();

      // Close mobile drawer if open
      if (els.sidebar) els.sidebar.classList.remove("open");
      if (els.scrim) els.scrim.hidden = true;

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      if (els.article) {
        els.article.innerHTML = `
          <div style="padding: 40px; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); text-align: center;">
            <div style="font-size: 36px; margin-bottom: 12px;">⚠️</div>
            <h2 style="font-family: var(--font-display); margin-bottom: 8px;">Documento não localizado</h2>
            <p style="color: var(--muted); margin-bottom: 20px;">${err.message}</p>
            <a href="#/${DOCS_DATA[state.currentLang].defaultDoc}" class="badge st-accepted" style="text-decoration: none; padding: 10px 20px; font-size: 13px;">
              Voltar à Página Inicial
            </a>
          </div>
        `;
      }
    }
  }

  // Setup Search Input Filter
  function setupSearch() {
    if (!els.searchInput) return;

    els.searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase().trim();
      const navItems = document.querySelectorAll(".nav-item");

      navItems.forEach((item) => {
        const text = item.textContent.toLowerCase();
        const match = text.includes(q);
        item.style.display = match ? "flex" : "none";
      });

      document.querySelectorAll(".nav-group").forEach((grp) => {
        const visibleChild = grp.querySelector(".nav-item[style*='display: flex']");
        grp.style.display = !q || visibleChild ? "block" : "none";
      });
    });

    // Shortcut "/" to focus search
    window.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== els.searchInput) {
        e.preventDefault();
        els.searchInput.focus();
      }
    });
  }

  // Router handler
  function route() {
    let hash = location.hash || "";
    if (!hash || hash === "#/" || hash === "#") {
      hash = "#/" + (DOCS_DATA[state.currentLang] || DOCS_DATA["pt-BR"]).defaultDoc;
      location.replace(hash);
      return;
    }

    const docPath = hash.replace(/^#\/?/, "");
    loadDocument(docPath);
  }

  // App Bootstrap
  function init() {
    initTheme();
    setupMobileNav();
    setupSearch();
    setupScrollSpy();
    renderNavTree();

    window.addEventListener("hashchange", route);
    route();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
