export function pgDateToYmd(v: Date | string | null | undefined): string {
  if (!v) return '';
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

/** Verify student password using their registered phone number (mobile_number or father_mobile_number) */
export function verifyStudentPhonePassword(enteredPassword: string, mobileNumber?: string, fatherMobileNumber?: string): boolean {
  const trimmedEntered = enteredPassword.trim();
  if (!trimmedEntered) return false;
  const cleanEntered = trimmedEntered.replace(/\D/g, '');
  const phones = [mobileNumber, fatherMobileNumber].filter(Boolean) as string[];

  for (const phone of phones) {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) continue;
    if (trimmedEntered === trimmedPhone) return true;
    const cleanPhone = trimmedPhone.replace(/\D/g, '');
    if (cleanEntered.length > 0 && cleanEntered === cleanPhone) return true;
  }
  return false;
}

