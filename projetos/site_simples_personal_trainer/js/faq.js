/**
 * SITE PERSONAL RAFAELA — Módulo de FAQ (Accordion)
 * 
 * Gerencia a expansão e o recolhimento das perguntas frequentes
 * com suporte completo a acessibilidade (ARIA e teclado).
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const faqItems = document.querySelectorAll('.faq-item');

    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
      const button = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');

      if (!button || !answer) return;

      button.addEventListener('click', function () {
        const isExpanded = button.getAttribute('aria-expanded') === 'true';

        // Opcional: fechar outros itens para comportamento de acordeão único
        faqItems.forEach(function (otherItem) {
          if (otherItem !== item) {
            const otherBtn = otherItem.querySelector('.faq-question');
            const otherAns = otherItem.querySelector('.faq-answer');
            if (otherBtn && otherAns) {
              otherBtn.setAttribute('aria-expanded', 'false');
              otherAns.hidden = true;
              otherItem.classList.remove('is-active');
            }
          }
        });

        // Alternar estado do item clicado
        if (isExpanded) {
          button.setAttribute('aria-expanded', 'false');
          answer.hidden = true;
          item.classList.remove('is-active');
        } else {
          button.setAttribute('aria-expanded', 'true');
          answer.hidden = false;
          item.classList.add('is-active');
        }
      });
    });
  });
})();
