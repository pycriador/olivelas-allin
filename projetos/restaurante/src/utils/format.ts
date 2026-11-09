const CURRENCY_LOCALE_MAP: Record<string, string> = {
  BRL: 'pt-BR',
  EUR: 'pt-PT',
  USD: 'en-US',
  GBP: 'en-GB',
  JPY: 'ja-JP',
  ARS: 'es-AR',
  CLP: 'es-CL',
  MXN: 'es-MX',
};

/**
 * Formats a monetary number according to the restaurant's configured currency.
 * Automatically chooses the best matching locale or falls back gracefully.
 * Never hardcodes currency symbols like 'R$'.
 */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = 'BRL',
  locale?: string
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '—';
  }

  const normalizedCurrency = (currency || 'BRL').toUpperCase();
  const targetLocale = locale || CURRENCY_LOCALE_MAP[normalizedCurrency] || 'pt-BR';

  try {
    return new Intl.NumberFormat(targetLocale, {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${normalizedCurrency} ${amount.toFixed(2)}`;
  }
}

/**
 * Formats ISO date string to localized date
 */
export function formatDate(dateString: string | null | undefined, locale: string = 'pt-BR'): string {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

/**
 * Formats ISO date string to localized date & time
 */
export function formatDateTime(dateString: string | null | undefined, locale: string = 'pt-BR'): string {
  if (!dateString) return '—';
  try {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}
