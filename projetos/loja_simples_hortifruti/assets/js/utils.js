/**
 * Utils - Shared helper functions
 */
export const STORAGE_KEYS = {
  CART: 'catalog:cart',
  FAVORITES: 'catalog:favorites',
  THEME: 'catalog:theme',
  CUSTOM_CATALOG: 'catalog:custom_data',
};

export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

/** Debounce a function call */
export function debounce(fn, delay = 250) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/** Read from localStorage with JSON parsing */
export function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

/** Write to localStorage with JSON serialization */
export function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Format a number as currency using the loja currency/locale */
export function formatCurrency(value, currency = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value);
}

/** Escape HTML to prevent XSS */
export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Create DOM element with attributes and children */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'class') node.className = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value);
    } else if (key === 'html') node.innerHTML = value;
    else if (value !== null && value !== undefined) node.setAttribute(key, value);
  });
  const childArr = Array.isArray(children) ? children : [children];
  childArr.forEach((child) => {
    if (child === null || child === undefined) return;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
  return node;
}

/** Resolve the product image path (supports relative and absolute URLs) */
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}

/** Normalize text for search (lowercase, no accents) */
export function normalizeText(text = '') {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/** Copy text to clipboard */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const range = document.createRange();
    const temp = document.createElement('textarea');
    temp.value = text;
    temp.style.position = 'fixed';
    temp.style.opacity = '0';
    document.body.appendChild(temp);
    temp.select();
    let success = false;
    try {
      success = document.execCommand('copy');
    } catch {
      success = false;
    }
    document.body.removeChild(temp);
    return success;
  }
}

/** Share a product via Web Share API or fallback to copy */
export async function shareProduct(text, url) {
  if (navigator.share) {
    try {
      await navigator.share({ title: text, text, url });
      return true;
    } catch {
      return false;
    }
  }
  await copyToClipboard(`${text}: ${url}`);
  return true;
}

/** Refresh Lucide icons (call after DOM changes) */
export function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

/** Tiny helper to attach a callback to an element and return it */
export function tap(node, fn) {
  fn(node);
  return node;
}
