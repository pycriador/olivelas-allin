/**
 * Central Number & Percentage Formatting Engine (NumberFormatter)
 * 
 * Rules:
 * - Centralizes formatting for percentages, averages, medians, totals and numbers
 * - Supports decimal precision: 0, 1, 2, 3, or 4 places (default 2)
 * - Supports configurable decimal separators (',' or '.') and locales ('pt-BR', 'en-US')
 * - Supports configurable legend output format: 'count', 'percentage', 'both'
 * - Components must use NumberFormatter instead of raw .toFixed()
 */

import { DecimalSeparator, LegendDisplayFormat } from '../types/survey';

export interface NumberFormatterOptions {
  decimalPlaces?: number;
  decimalSeparator?: DecimalSeparator;
  locale?: string;
  legendFormat?: LegendDisplayFormat;
}

export class NumberFormatter {
  private static defaultDecimalPlaces: number = 2;
  private static defaultDecimalSeparator: DecimalSeparator = ',';
  private static defaultLocale: string = 'pt-BR';
  private static defaultLegendFormat: LegendDisplayFormat = 'both';

  /**
   * Clamp decimal precision to allowed range 0..4
   */
  public static clampDecimals(decimals?: number): number {
    if (typeof decimals !== 'number' || isNaN(decimals)) {
      return this.defaultDecimalPlaces;
    }
    return Math.max(0, Math.min(4, Math.floor(decimals)));
  }

  /**
   * Rounds a number mathematically to specific decimals without string artifacts
   */
  public static round(value: number | null | undefined, decimalPlaces?: number): number {
    if (value === null || value === undefined || isNaN(value)) {
      return 0;
    }
    const dec = this.clampDecimals(decimalPlaces);
    const factor = Math.pow(10, dec);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  /**
   * Formats a generic numeric value (e.g. 1234.56 -> "1.234,56" or "1234,56")
   */
  public static format(
    value: number | null | undefined,
    options?: NumberFormatterOptions | number
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }

    const opts: NumberFormatterOptions =
      typeof options === 'number'
        ? { decimalPlaces: options }
        : options || {};

    const dec = this.clampDecimals(opts.decimalPlaces ?? this.defaultDecimalPlaces);
    const separator = opts.decimalSeparator ?? this.defaultDecimalSeparator;
    const rounded = this.round(value, dec);

    const str = rounded.toFixed(dec);
    if (separator === ',') {
      return str.replace('.', ',');
    }
    return str;
  }

  /**
   * Formats percentages (e.g. 45.6789 -> "45,68%")
   */
  public static percentage(
    value: number | null | undefined,
    decimalPlaces?: number,
    decimalSeparator?: DecimalSeparator
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0%';
    }
    const dec = this.clampDecimals(decimalPlaces ?? this.defaultDecimalPlaces);
    const separator = decimalSeparator ?? this.defaultDecimalSeparator;
    const rounded = this.round(value, dec);

    const str = rounded.toFixed(dec);
    const formatted = separator === ',' ? str.replace('.', ',') : str;
    return `${formatted}%`;
  }

  /**
   * Formats mean / average values with precision
   */
  public static mean(
    value: number | null | undefined,
    decimalPlaces?: number,
    decimalSeparator?: DecimalSeparator
  ): string {
    return this.format(value, { decimalPlaces, decimalSeparator });
  }

  /**
   * Formats median values with precision
   */
  public static median(
    value: number | null | undefined,
    decimalPlaces?: number,
    decimalSeparator?: DecimalSeparator
  ): string {
    return this.format(value, { decimalPlaces, decimalSeparator });
  }

  /**
   * Formats integer totals (e.g. 1500 -> "1.500")
   */
  public static total(
    value: number | null | undefined,
    locale?: string
  ): string {
    if (value === null || value === undefined || isNaN(value)) {
      return '0';
    }
    return Math.round(value).toLocaleString(locale || this.defaultLocale);
  }

  /**
   * Formats legend item string according to requested legend display format
   * Examples:
   * - count: "32"
   * - percentage: "45,0%"
   * - both: "32 (45,0%)"
   */
  public static legendLabel(
    count: number,
    percentage: number,
    format: LegendDisplayFormat = 'both',
    decimalPlaces?: number,
    decimalSeparator?: DecimalSeparator
  ): string {
    const formattedCount = this.total(count);
    const formattedPct = this.percentage(percentage, decimalPlaces, decimalSeparator);

    switch (format) {
      case 'count':
        return formattedCount;
      case 'percentage':
        return formattedPct;
      case 'both':
      default:
        return `${formattedCount} (${formattedPct})`;
    }
  }
}

// Backward compatibility functional aliases
export const formatPercentage = (
  value: number,
  decimalPlaces: number = 2,
  separator: DecimalSeparator = ','
) => NumberFormatter.percentage(value, decimalPlaces, separator);

export const formatNumber = (
  value: number,
  decimalPlaces: number = 2,
  separator: DecimalSeparator = ','
) => NumberFormatter.format(value, { decimalPlaces, decimalSeparator: separator });

export const roundToDecimals = (value: number, decimalPlaces: number = 2) =>
  NumberFormatter.round(value, decimalPlaces);
