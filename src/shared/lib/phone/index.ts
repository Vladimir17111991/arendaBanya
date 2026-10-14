export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 11 && digits.startsWith('80')) digits = '375' + digits.slice(2);
  else if (digits.length === 9 && !value.trim().startsWith('+')) digits = '375' + digits;
  if (!digits.startsWith('375')) return '+' + digits;
  const local = digits.slice(3);
  return ['+375', local.slice(0, 2), local.slice(2, 5), local.slice(5, 7), local.slice(7)]
    .filter(Boolean)
    .join(' ');
}
