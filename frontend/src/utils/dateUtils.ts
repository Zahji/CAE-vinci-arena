/**
 * Formats a Date to a string usable in an HTML date input (YYYY-MM-DD).
 * @param {Date} date - the date to format
 * @return {string} the formatted date string
 */
const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats an ISO datetime string to a readable French format (e.g. "15/04/2026 à 14h30").
 * Returns the raw string if parsing fails.
 * @param {string} dateTime - the ISO datetime string
 * @return {string} the formatted string
 */
const formatDateTime = (dateTime: string): string => {
  try {
    const date = new Date(dateTime);
    const day = date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} à ${hours}h${minutes}`;
  } catch {
    return dateTime;
  }
};

export { toLocalDateInputValue, formatDateTime };
