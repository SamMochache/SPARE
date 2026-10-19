const kesFormatter = new Intl.NumberFormat('en-KE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const numberFormatter = new Intl.NumberFormat('en-KE');

export function formatKES(value: number): string {
  return `KES ${kesFormatter.format(value)}`;
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatCompactKES(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseAmount(value: string): number {
  const n = parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) && n > 0 ? n : 0;
}