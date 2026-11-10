export interface NormalizedCategoryResult {
  originalValue: string;
  normalizedValue: string; // Key for grouped counting
  canonicalDisplay: string; // Best display label
}

/**
 * Checks whether a response value is empty:
 * - null
 * - undefined
 * - empty string ''
 * - string consisting purely of whitespace
 * - empty array []
 */
export function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0 || value.every((v) => isEmptyValue(v));
  }
  return false;
}

/**
 * Normalizes a category string for consistent deterministic grouping and aggregation.
 *
 * Normalization pipeline:
 * 1. Trims leading and trailing whitespace
 * 2. Collapses multiple consecutive spaces into a single space
 * 3. Converts to lowercase for normalized key comparison
 * 4. Normalizes unicode characters (NFC)
 * 5. Optionally removes diacritics / accents for flexible option matching
 */
export function normalizeCategory(
  value: string | null | undefined,
  options: { stripAccents?: boolean } = {}
): NormalizedCategoryResult {
  if (value === null || value === undefined) {
    return { originalValue: '', normalizedValue: '', canonicalDisplay: '' };
  }

  const raw = String(value);
  const trimmed = raw.trim().replace(/\s+/g, ' ');

  let cleaned = trimmed.toLowerCase();

  if (options.stripAccents) {
    cleaned = cleaned
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  } else {
    cleaned = cleaned.normalize('NFC');
  }

  // Canonical display: Preserve acronyms (<= 3 uppercase letters like RH, TI, IA, CEO) or capitalize first letter
  let canonicalDisplay = trimmed;
  if (trimmed.length > 0) {
    if (trimmed.length <= 4 && trimmed.toUpperCase() === trimmed) {
      canonicalDisplay = trimmed.toUpperCase();
    } else {
      // Capitalize first character and lowercase the rest unless mixed acronym
      canonicalDisplay = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    }
  }

  return {
    originalValue: raw,
    normalizedValue: cleaned,
    canonicalDisplay,
  };
}

/**
 * Match an answer string against predefined options using normalized keying
 */
export function matchOptionLabel(
  answer: string,
  predefinedOptions?: Array<{ value: string; label: string }>
): { label: string; normalizedKey: string; matchedOption: boolean } {
  const norm = normalizeCategory(answer, { stripAccents: true });

  if (!predefinedOptions || predefinedOptions.length === 0) {
    return {
      label: norm.canonicalDisplay || answer.trim(),
      normalizedKey: normalizeCategory(answer).normalizedValue,
      matchedOption: false,
    };
  }

  for (const opt of predefinedOptions) {
    const normValue = normalizeCategory(opt.value, { stripAccents: true }).normalizedValue;
    const normLabel = normalizeCategory(opt.label, { stripAccents: true }).normalizedValue;

    if (norm.normalizedValue === normValue || norm.normalizedValue === normLabel) {
      return {
        label: opt.label,
        normalizedKey: normalizeCategory(opt.label).normalizedValue,
        matchedOption: true,
      };
    }
  }

  return {
    label: norm.canonicalDisplay || answer.trim(),
    normalizedKey: normalizeCategory(answer).normalizedValue,
    matchedOption: false,
  };
}

/**
 * Splits checkbox multi-select strings by common delimiters (; | , \n)
 * Deduplicates multiple occurrences of the same item within the same response.
 */
export function splitCheckboxAnswer(rawAnswer: string | string[]): string[] {
  if (Array.isArray(rawAnswer)) {
    const cleaned = rawAnswer
      .map((item) => (typeof item === 'string' ? item.trim() : String(item).trim()))
      .filter((s) => s.length > 0);
    // Deduplicate within single respondent
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of cleaned) {
      const key = normalizeCategory(item).normalizedValue;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  }

  if (typeof rawAnswer !== 'string') {
    return [String(rawAnswer).trim()];
  }

  const str = rawAnswer.trim();
  if (!str) return [];

  // Split on semicolons, pipes, newlines, or commas
  const parts = str
    .split(/[;|\n,]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Deduplicate items selected by the same respondent
  const seen = new Set<string>();
  const result: string[] = [];
  for (const p of parts) {
    const key = normalizeCategory(p).normalizedValue;
    if (!seen.has(key) && p.length > 0) {
      seen.add(key);
      result.push(p);
    }
  }

  return result;
}

/**
 * Safely parses a numeric value for scale/number questions.
 * Returns { valid: true, value: number } or { valid: false, reason: string }
 */
export function parseNumericValue(
  raw: any
): { valid: true; value: number } | { valid: false; reason: string } {
  if (isEmptyValue(raw)) {
    return { valid: false, reason: 'Empty value' };
  }

  if (typeof raw === 'number') {
    if (isNaN(raw) || !isFinite(raw)) {
      return { valid: false, reason: 'Non-finite number value' };
    }
    return { valid: true, value: raw };
  }

  const str = String(raw).trim().replace(',', '.');
  const num = Number(str);

  if (isNaN(num) || !isFinite(num) || str === '') {
    return { valid: false, reason: `Cannot convert "${String(raw)}" to numeric value` };
  }

  return { valid: true, value: num };
}

/**
 * Safely parses date strings into canonical YYYY-MM-DD format.
 */
export function parseDateValue(
  raw: any
): { valid: true; isoDate: string; label: string } | { valid: false; reason: string } {
  if (isEmptyValue(raw)) {
    return { valid: false, reason: 'Empty date value' };
  }

  // If already Date
  if (raw instanceof Date) {
    if (isNaN(raw.getTime())) return { valid: false, reason: 'Invalid Date object' };
    const isoDate = raw.toISOString().split('T')[0];
    return { valid: true, isoDate, label: formatBrazilianDate(isoDate) };
  }

  const str = String(raw).trim();

  // Excel serial number (e.g. 45123)
  if (/^\d{5}$/.test(str)) {
    const serial = parseInt(str, 10);
    // Excel date epoch: Dec 30 1899
    const utcDays = serial - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const isoDate = date.toISOString().split('T')[0];
      return { valid: true, isoDate, label: formatBrazilianDate(isoDate) };
    }
  }

  // Check DD/MM/YYYY or DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (brMatch) {
    const day = brMatch[1].padStart(2, '0');
    const month = brMatch[2].padStart(2, '0');
    const year = brMatch[3];
    const isoDate = `${year}-${month}-${day}`;
    const testDate = new Date(isoDate);
    if (!isNaN(testDate.getTime())) {
      return { valid: true, isoDate, label: `${day}/${month}/${year}` };
    }
  }

  // Check YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    const testDate = new Date(isoDate);
    if (!isNaN(testDate.getTime())) {
      return { valid: true, isoDate, label: `${day}/${month}/${year}` };
    }
  }

  // Fallback Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const isoDate = parsed.toISOString().split('T')[0];
    return { valid: true, isoDate, label: formatBrazilianDate(isoDate) };
  }

  return { valid: false, reason: `Unrecognized date format "${str}"` };
}

function formatBrazilianDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

/**
 * Safely parses time strings into canonical HH:mm format.
 */
export function parseTimeValue(
  raw: any
): { valid: true; time: string; label: string } | { valid: false; reason: string } {
  if (isEmptyValue(raw)) {
    return { valid: false, reason: 'Empty time value' };
  }

  const str = String(raw).trim();
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);

  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      const hh = String(hours).padStart(2, '0');
      const mm = String(minutes).padStart(2, '0');
      const time = `${hh}:${mm}`;
      return { valid: true, time, label: time };
    }
  }

  return { valid: false, reason: `Invalid time format "${str}" (expected HH:mm)` };
}
