// Money helpers. Prices are stored as INTEGER paisa (smallest currency unit) in the DB.
// NEVER do arithmetic on floats — convert to paisa, compute, convert back.
//
// Currency model:
// - All prices stored in NPR paisa (integer).
// - eSewa expects NPR rupees (amount = paisa / 100).
// - Khalti expects NPR paisa (amount = paisa).
// - Display: formatCents(150000, 'NPR') -> "रू 1,500.00"

/** Paisa -> rupees, e.g. 150000 -> 1500 */
export function paisaToRupees(paisa: number): number {
  return Math.round(paisa) / 100;
}

/** Rupees -> paisa, rounded. e.g. 1500.5 -> 150050 */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Format paisa for display, e.g. 150000 -> "रू 1,500.00" */
export function formatPaisa(paisa: number, currency = 'NPR'): string {
  const rupees = paisaToRupees(paisa);
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  };
  try {
    return new Intl.NumberFormat('ne-NP', opts).format(rupees);
  } catch {
    return `${rupees.toFixed(2)} ${currency}`;
  }
}

/** Format paisa as a compact integer-ish display, e.g. 150000 -> "रू 1,500" */
export function formatPaisaCompact(paisa: number, currency = 'NPR'): string {
  const rupees = paisaToRupees(paisa);
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  };
  try {
    return new Intl.NumberFormat('ne-NP', opts).format(rupees);
  } catch {
    return `${Math.round(rupees)} ${currency}`;
  }
}

// Legacy aliases (for backward compat during transition)
export function centsToDollars(cents: number): number {
  return paisaToRupees(cents);
}

export function formatCents(cents: number, currency = 'NPR'): string {
  return formatPaisa(cents, currency);
}

export function formatCentsCompact(cents: number, currency = 'NPR'): string {
  return formatPaisaCompact(cents, currency);
}

export function dollarsToCents(dollars: number): number {
  return rupeesToPaisa(dollars);
}