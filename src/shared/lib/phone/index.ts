export const PHONE_PREFIX = '+375';
export const PHONE_MAX_LENGTH = 19;
export const PHONE_PATTERN = String.raw`\+375 \(\d{2}\) \d{3}-\d{2}-\d{2}`;

export function phoneDigits(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('375')) digits = digits.slice(3);
  else if (digits.startsWith('80')) digits = digits.slice(2);
  else if (value.trim().startsWith('+')) return '';
  return digits.slice(0, 9);
}

function formatLocal(digits: string): string {
  if (!digits) return PHONE_PREFIX;
  let result = `${PHONE_PREFIX} (${digits.slice(0, 2)}`;
  if (digits.length >= 2) result += ')';
  if (digits.length > 2) result += ` ${digits.slice(2, 5)}`;
  if (digits.length > 5) result += `-${digits.slice(5, 7)}`;
  if (digits.length > 7) result += `-${digits.slice(7, 9)}`;
  return result;
}

export function formatPhone(value: string): string {
  return formatLocal(phoneDigits(value));
}

/** Edit subscriber digits while preserving the prefix, separators and caret position. */
export function editPhone(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  insertion = '',
  deletion?: 'backward' | 'forward',
): { value: string; caret: number } {
  const digits = phoneDigits(value);
  const digitIndex = (position: number) =>
    Math.max(0, value.slice(PHONE_PREFIX.length, position).replace(/\D/g, '').length);
  let start = digitIndex(selectionStart);
  let end = digitIndex(selectionEnd);
  if (selectionStart === selectionEnd) {
    if (deletion === 'backward') start = Math.max(0, start - 1);
    if (deletion === 'forward') end = Math.min(digits.length, end + 1);
  }
  const inserted = insertion.replace(/\D/g, '').slice(0, 9 - digits.length + end - start);
  const formatted = formatLocal(digits.slice(0, start) + inserted + digits.slice(end));
  const target = start + inserted.length;
  let caret = PHONE_PREFIX.length;
  let count = 0;
  while (caret < formatted.length) {
    if (/\d/.test(formatted[caret]!)) {
      if (count === target) break;
      count++;
    }
    caret++;
  }
  return { value: formatted, caret };
}
