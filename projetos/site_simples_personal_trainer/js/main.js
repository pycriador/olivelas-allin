/**
 * SITE PERSONAL RAFAELA — Script Principal
 * 
 * Orquestra a injeção dinâmica de dados de SITE_CONFIG, ano de copyright,
 * botão "Voltar ao topo" e animações de scroll reveal.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // 1. Atualizar Ano Dinâmico no Rodapé
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
      yearSpan.textContent = new Date().getFullYear();
    }

    // 2. Preencher dados dinâmicos a partir de SITE_CONFIG (Single Source of Truth)
    function applyDynamicConfig() {
      if (typeof SITE_CONFIG === 'undefined') return;

      // Injeção de contatos formatados
      const phoneElements = document.querySelectorAll('[data-config-phone]');
      phoneElements.forEach(function (el) {
        el.textContent = SITE_CONFIG.contact.whatsappFormatted;
      });

      const emailElements = document.querySelectorAll('[data-config-email]');
      emailElements.forEach(function (el) {
        el.textContent = SITE_CONFIG.contact.email;
        if (el.tagName === 'A') el.href = `mailto:${SITE_CONFIG.contact.email}`;
      });

      const instagramElements = document.querySelectorAll('[data-config-instagram]');
      instagramElements.forEach(function (el) {
        el.textContent = SITE_CONFIG.contact.instagram;
        if (el.tagName === 'A') el.href = SITE_CONFIG.contact.instagramUrl;
      });

      // Injeção dinâmica de preços
      const priceSingle = document.querySelector('[data-price="singleClass"]');
      if (priceSingle && SITE_CONFIG.pricing.singleClass) {
        priceSingle.textContent = `R$ ${SITE_CONFIG.pricing.singleClass.price}`;
      }

      const priceCombo3x = document.querySelector('[data-price="combo3x"]');
      if (priceCombo3x && SITE_CONFIG.pricing.combos.threeTimes) {
        priceCombo3x.textContent = `R$ ${SITE_CONFIG.pricing.combos.threeTimes.pricePerHour}`;
      }

      const priceCombo2x = document.querySelector('[data-price="combo2x"]');
      if (priceCombo2x && SITE_CONFIG.pricing.combos.twoTimes) {
        priceCombo2x.textContent = `R$ ${SITE_CONFIG.pricing.combos.twoTimes.pricePerHour}`;
      }

      const priceMonthly3x = document.querySelector('[data-price="monthlyPerformance"]');
      if (priceMonthly3x && SITE_CONFIG.pricing.monthly.performance) {
        priceMonthly3x.textContent = `R$ ${SITE_CONFIG.pricing.monthly.performance.priceMonth.toLocaleString('pt-BR')}`;
      }

      const priceMonthly2x = document.querySelector('[data-price="monthlyEquilibrium"]');
      if (priceMonthly2x && SITE_CONFIG.pricing.monthly.equilibrium) {
        priceMonthly2x.textContent = `R$ ${SITE_CONFIG.pricing.monthly.equilibrium.priceMonth.toLocaleString('pt-BR')}`;
      }
    }

    applyDynamicConfig();

    // 3. Botão "Voltar ao Topo" (Back to Top)
    const backToTopBtn = document.querySelector('.back-to-top');
    if (backToTopBtn) {
      function checkBackToTop() {
        if (window.scrollY > 400) {
          backToTopBtn.classList.add('is-visible');
        } else {
          backToTopBtn.classList.remove('is-visible');
        }
      }

      window.addEventListener('scroll', checkBackToTop, { passive: true });
      checkBackToTop();

      backToTopBtn.addEventListener('click', function () {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    }

    // 4. Scroll Reveal Suave com Intersection Observer
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      const revealElements = document.querySelectorAll('.reveal-on-scroll');

      const observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      });

      revealElements.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Se preferir movimento reduzido ou sem suporte, exibe direto
      document.querySelectorAll('.reveal-on-scroll').forEach(function (el) {
        el.classList.add('is-revealed');
      });
    }

    // 5. Log amigável com orientações para o usuário/desenvolvedor
    console.info(
      "%c Rafaela Personal Trainer %c Site pronto para produção. Configure seus dados em /js/config.js ",
      "background: #0f3b30; color: #f8faf9; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
      "background: #f0fdf4; color: #166534; padding: 4px 8px; border-radius: 4px;"
    );
  });
})();
