export function formatPrice(
  min: number | null | undefined,
  max: number | null | undefined,
  currency = 'EUR'
): string {
  const fmt = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });

  if (min != null && max != null) return `${fmt.format(min)} – ${fmt.format(max)}`;
  if (min != null) return `ab ${fmt.format(min)}`;
  if (max != null) return `bis ${fmt.format(max)}`;
  return 'Preis auf Anfrage';
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function formatMileage(km: number): string {
  return new Intl.NumberFormat('de-DE').format(km) + ' km';
}

export function formatPower(ps: number): string {
  return `${ps} PS`;
}

export function formatDisplacement(ccm: number): string {
  const liters = ccm / 1000;
  return `${liters.toFixed(1)} l`;
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
}
