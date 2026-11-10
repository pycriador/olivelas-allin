import { debounce } from './utils.js';

/**
 * Search - real-time header search (debounced)
 */
export class Search {
  constructor(input, onChange) {
    this.input = input;
    this.onChange = onChange;
    this._bind();
  }

  _bind() {
    const handler = debounce((e) => this.onChange(e.target.value), 250);
    this.input.addEventListener('input', handler);
  }

  clear() {
    this.input.value = '';
    this.onChange('');
  }
}
