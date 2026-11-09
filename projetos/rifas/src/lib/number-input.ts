export interface ParseNumbersResult {
  numbers: number[];
  invalid: string[];
  duplicates: string[];
}

const TOKEN_SEPARATORS = /[\s,;]+/;
const RANGE_PATTERN = /^(\d+)\s*-\s*(\d+)$/;
const SINGLE_PATTERN = /^\d+$/;

function tokenLabel(token: string): string {
  return token.replace(/\s+/g, " ").trim();
}

export function parseNumbersExpression(input: string, maxNumber: number): ParseNumbersResult {
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<number>();
  const numbers: number[] = [];

  const tokens = input.split(TOKEN_SEPARATORS).map(tokenLabel).filter(Boolean);

  for (const token of tokens) {
    const range = token.match(RANGE_PATTERN);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      if (start > end) {
        invalid.push(token);
        continue;
      }
      for (let n = start; n <= end; n += 1) {
        if (n < 1 || n > maxNumber) {
          invalid.push(token);
          break;
        }
        if (seen.has(n)) {
          duplicates.push(String(n));
          continue;
        }
        seen.add(n);
        numbers.push(n);
      }
      continue;
    }

    if (token.match(SINGLE_PATTERN)) {
      const n = Number(token);
      if (n < 1 || n > maxNumber) {
        invalid.push(token);
        continue;
      }
      if (seen.has(n)) {
        duplicates.push(token);
        continue;
      }
      seen.add(n);
      numbers.push(n);
      continue;
    }

    invalid.push(token);
  }

  return { numbers, invalid, duplicates };
}

export function parseNumbersList(input: string, maxNumber: number): ParseNumbersResult {
  const invalid: string[] = [];
  const duplicates: string[] = [];
  const seen = new Set<number>();
  const numbers: number[] = [];

  const tokens = input
    .split(/[\s,;]+/)
    .map(tokenLabel)
    .filter(Boolean);

  for (const token of tokens) {
    if (!token.match(SINGLE_PATTERN)) {
      invalid.push(token);
      continue;
    }
    const n = Number(token);
    if (n < 1 || n > maxNumber) {
      invalid.push(token);
      continue;
    }
    if (seen.has(n)) {
      duplicates.push(token);
      continue;
    }
    seen.add(n);
    numbers.push(n);
  }

  return { numbers, invalid, duplicates };
}
