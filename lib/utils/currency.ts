/**
 * Currency utilities for consistent cents/dollars handling
 *
 * IMPORTANT: All monetary values should be stored in CENTS (integers) in the database.
 * Use these utilities for conversion at API boundaries.
 */

/**
 * Convert dollars to cents (for storage)
 * @param dollars - Amount in dollars (e.g., 29.99)
 * @returns Amount in cents (e.g., 2999)
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars (for display)
 * @param cents - Amount in cents (e.g., 2999)
 * @returns Amount in dollars (e.g., 29.99)
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Format cents as a currency string
 * @param cents - Amount in cents (e.g., 2999)
 * @param options - Intl.NumberFormat options
 * @returns Formatted string (e.g., "$29.99")
 */
export function formatCurrency(
  cents: number,
  options: Intl.NumberFormatOptions = {}
): string {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    ...options,
  }).format(dollars);
}

/**
 * Format cents as a compact currency string (for large amounts)
 * @param cents - Amount in cents
 * @returns Formatted string (e.g., "$30K")
 */
export function formatCurrencyCompact(cents: number): string {
  const dollars = centsToDollars(cents);
  if (dollars >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(dollars);
  }
  return formatCurrency(cents);
}

/**
 * Parse a currency string to cents
 * @param value - String like "$29.99" or "29.99"
 * @returns Amount in cents, or null if invalid
 */
export function parseCurrencyToCents(value: string): number | null {
  // Remove currency symbols, commas, and whitespace
  const cleaned = value.replace(/[$,\s]/g, "");
  const parsed = parseFloat(cleaned);

  if (isNaN(parsed)) {
    return null;
  }

  return dollarsToCents(parsed);
}

/**
 * Safely convert a potentially undefined/null value to cents
 * Returns 0 if the value is not a valid number
 */
export function toCentsSafe(dollars: unknown): number {
  if (typeof dollars === "number" && !isNaN(dollars)) {
    return dollarsToCents(dollars);
  }
  if (typeof dollars === "string") {
    const parsed = parseFloat(dollars);
    if (!isNaN(parsed)) {
      return dollarsToCents(parsed);
    }
  }
  return 0;
}
