/**
 * SITE PERSONAL RAFAELA — Módulo WhatsApp
 * 
 * Centraliza a criação de links e abertura do WhatsApp com mensagens pré-configuradas.
 * Não duplica números de telefone. Utiliza sempre SITE_CONFIG.
 */

(function () {
  'use strict';

  /**
   * Gera a URL de abertura do WhatsApp
   * @param {string} message 
   * @returns {string}
   */
  function buildWhatsAppUrl(message) {
    const rawNumber = (SITE_CONFIG && SITE_CONFIG.contact && SITE_CONFIG.contact.whatsapp) || "5511999999999";
    const cleanNumber = rawNumber.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(message.trim());
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }

  /**
   * Abre o WhatsApp em uma nova aba com a mensagem especificada
   * @param {string} messageOrKey - Chave definida em SITE_CONFIG.whatsappMessages ou texto direto
   */
  function openWhatsApp(messageOrKey) {
    let finalMessage = messageOrKey;

    if (SITE_CONFIG && SITE_CONFIG.whatsappMessages && SITE_CONFIG.whatsappMessages[messageOrKey]) {
      finalMessage = SITE_CONFIG.whatsappMessages[messageOrKey];
    } else if (!finalMessage) {
      finalMessage = (SITE_CONFIG && SITE_CONFIG.whatsappMessages && SITE_CONFIG.whatsappMessages.default) || "Olá Rafaela!";
    }

    const url = buildWhatsAppUrl(finalMessage);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Captura os dados do formulário de contato e encaminha mensagem formatada ao WhatsApp
   * @param {Event} event 
   */
  function handleLeadFormSubmit(event) {
    if (event) event.preventDefault();

    const form = document.getElementById('lead-form');
    if (!form) return;

    const nameInput = document.getElementById('lead-name');
    const phoneInput = document.getElementById('lead-phone');
    const goalSelect = document.getElementById('lead-goal');
    const freqSelect = document.getElementById('lead-frequency');
    const msgInput = document.getElementById('lead-message');

    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const goal = goalSelect ? goalSelect.options[goalSelect.selectedIndex].text : '';
    const frequency = freqSelect ? freqSelect.options[freqSelect.selectedIndex].text : '';
    const customMessage = msgInput ? msgInput.value.trim() : '';

    if (!name || !phone) {
      alert('Por favor, preencha seu nome e WhatsApp.');
      return;
    }

    let formattedMessage = `Olá Rafaela! Preenchi o formulário no seu site com meus dados:\n\n` +
      `👤 *Nome:* ${name}\n` +
      `📱 *WhatsApp:* ${phone}\n` +
      `🎯 *Objetivo:* ${goal}\n` +
      `📅 *Frequência Desejada:* ${frequency}`;

    if (customMessage) {
      formattedMessage += `\n💬 *Mensagem:* ${customMessage}`;
    }

    openWhatsApp(formattedMessage);
  }

  // Exporta globalmente para fácil acesso nos templates e botões
  window.openWhatsApp = openWhatsApp;
  window.buildWhatsAppUrl = buildWhatsAppUrl;
  window.handleLeadFormSubmit = handleLeadFormSubmit;

  /**
   * Inicializa ouvintes para elementos declarativos e formulário de contato
   */
  document.addEventListener('DOMContentLoaded', function () {
    const triggers = document.querySelectorAll('[data-whatsapp-msg]');

    triggers.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        // Se for um link de navegação padrão, previne o salto para que abra o WhatsApp
        e.preventDefault();
        const msgKey = btn.getAttribute('data-whatsapp-msg');
        openWhatsApp(msgKey);
      });
    });

    // Ouvinte para envio do formulário de contato preliminar
    const leadForm = document.getElementById('lead-form');
    if (leadForm) {
      leadForm.addEventListener('submit', handleLeadFormSubmit);
    }
  });
})();
