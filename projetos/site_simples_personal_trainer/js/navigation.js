/**
 * SITE PERSONAL RAFAELA — Módulo de Navegação
 * 
 * Gerencia o menu mobile drawer, o sticky header dinâmico no scroll
 * e a rolagem suave acessível com compensação de offset.
 */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    const header = document.querySelector('.site-header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link, .nav-action-btn');
    const overlay = document.querySelector('.nav-overlay');

    if (!header || !menuToggle || !navMenu) return;

    // --- 1. Sticky Header com efeito ao rolar ---
    function handleScroll() {
      if (window.scrollY > 24) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Checagem inicial

    // --- 2. Menu Mobile Drawer ---
    function openMenu() {
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Fechar menu de navegação');
      navMenu.classList.add('is-open');
      if (overlay) overlay.classList.add('is-visible');
      document.body.classList.add('menu-open');
    }

    function closeMenu() {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Abrir menu de navegação');
      navMenu.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-visible');
      document.body.classList.remove('menu-open');
    }

    menuToggle.addEventListener('click', function () {
      const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Fechar menu ao pressionar tecla Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('is-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });

    // Fechar menu ao clicar em qualquer link de navegação interno
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (navMenu.classList.contains('is-open')) {
          closeMenu();
        }
      });
    });

    // Fechar menu se a janela for redimensionada para desktop
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 1024 && navMenu.classList.contains('is-open')) {
        closeMenu();
      }
    }, { passive: true });
  });
})();
