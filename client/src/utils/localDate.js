/**
 * Format a Date as YYYY-MM-DD in the runtime's local timezone.
 * Avoid Date#toISOString(), which shifts the calendar day near UTC midnight.
 */
export function formatLocalDateYYYYMMDD(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
