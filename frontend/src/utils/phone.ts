export function normalizeKenyanPhone(input: string): string | null {
  const cleaned = input.replace(/[\s()-]/g, '');
  const match = cleaned.match(/^(?:\+?254|0)?([17]\d{8})$/);
  return match ? `+254${match[1]}` : null;
}

export function formatKenyanPhone(e164: string): string {
  const local = e164.replace('+254', '');
  return `+254 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
}