import { debounce, refreshIcons } from './utils.js';

/**
 * Search - Real-time synchronized product search across header and catalog tools
 */
export class Search {
  constructor(inputs, onChange) {
    this.inputs = Array.isArray(inputs)
      ? inputs.filter(Boolean)
      : (inputs instanceof NodeList ? Array.from(inputs) : [inputs].filter(Boolean));
    this.onChange = onChange;
    this.clearButtons = Array.from(document.querySelectorAll('#header-search-clear, #catalog-search-clear, .tools__search-clear, .search-clear-btn'));

    this._bind();
  }

  _bind() {
    const handler = debounce((value) => {
      this.syncInputs(value);
      this.updateClearButtons(value);
      this.onChange(value);
    }, 150);

    this.inputs.forEach((input) => {
      input.addEventListener('input', (e) => {
        handler(e.target.value);
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.clear();
          input.blur();
        }
      });
    });

    this.clearButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.clear();
        const primaryInput = this.inputs[0];
        if (primaryInput) primaryInput.focus();
      });
    });

    // Global keyboard shortcut: pressing '/' focuses the nearest search input
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        const visibleInput = this.inputs.find((el) => el.offsetParent !== null) || this.inputs[0];
        if (visibleInput) {
          visibleInput.focus();
          visibleInput.select();
        }
      }
    });

    refreshIcons();
  }

  syncInputs(value) {
    this.inputs.forEach((input) => {
      if (input.value !== value) {
        input.value = value;
      }
    });
  }

  updateClearButtons(value) {
    const hasVal = Boolean(value && value.trim());
    this.clearButtons.forEach((btn) => {
      btn.style.display = hasVal ? 'inline-flex' : 'none';
    });
  }

  setValue(value) {
    this.syncInputs(value);
    this.updateClearButtons(value);
    this.onChange(value);
  }

  clear() {
    this.syncInputs('');
    this.updateClearButtons('');
    this.onChange('');
  }
}

