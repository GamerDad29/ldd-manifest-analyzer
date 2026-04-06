/** Format as currency, no decimals: $12,345 */
export function fm(n: number): string {
  return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/** Format as currency with cents: $12.34 */
export function fd(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format as percentage: 55% */
export function pc(n: number): string {
  return Math.round(n * 100) + '%';
}

/** Countdown string from ISO date */
export function timeLeft(endIso: string): string {
  const d = new Date(endIso).getTime() - Date.now();
  if (d <= 0) return 'Closed';
  const h = Math.floor(d / 3600000);
  const m = Math.floor((d % 3600000) / 60000);
  return h + 'h ' + m + 'm';
}
