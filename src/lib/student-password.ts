/** Normalize a Postgres `date` (or ISO string) to YYYY-MM-DD for password derivation. */
export function pgDateToYmd(v: Date | string): string {
  if (v instanceof Date) {
    // Use local calendar fields to avoid timezone backshift (e.g. 12 -> 11).
    const y = v.getFullYear();
    const m = v.getMonth() + 1;
    const d = v.getDate();
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return String(v).split('T')[0].split(' ')[0];
}

/** Password rule: DDMMYYYY + "26" (e.g. 12 Dec 2005 → 1212200526) */
export function expectedPasswordFromIsoDate(isoDate: string): string {
  const dayPart = isoDate.split('T')[0];
  const [y, m, d] = dayPart.split('-').map(Number);
  if (!y || !m || !d) return '';
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const yyyy = String(y);
  return `${dd}${mm}${yyyy}`;
}

export function normalizeApplicationNumber(raw: string): string {
  return raw.trim().replace(/^#/, '');
}
