/**
 * Formats a raw date value (string, timestamp, or Date object) into a clean, human-readable format.
 * 
 * WHY: Backend APIs often return ISO-8601 strings (e.g. "2026-10-04T18:24:00Z").
 * Displaying raw ISO strings looks unpolished and confusing to users.
 * This helper ensures a consistent format (e.g. "Oct 4, 2026") across all tables and cards.
 * 
 * @param {string | number | Date} dateValue - The date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Optional custom formatting options
 * @returns {string} Formatted date string, or a fallback '-' if invalid/empty
 */
export const formatDate = (dateValue, options = {}) => {
  // WHY: Return a safe dash fallback if no date is provided so the UI doesn't crash or say "undefined".
  if (!dateValue) return '—';

  const date = new Date(dateValue);

  // WHY: If the date string is malformed or invalid, Date.getTime() returns NaN.
  // Checking isNaN prevents rendering "Invalid Date" on the screen.
  if (isNaN(date.getTime())) {
    return '—';
  }

  // Default options: Clean standard format like "Oct 4, 2026"
  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };

  // WHY: Using built-in Intl.DateTimeFormat eliminates the need for heavy external libraries like moment or date-fns.
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
};

/**
 * Formats a date including the time (e.g. "Oct 4, 2026, 11:30 PM").
 * Useful for audit logs, message timestamps, and activity feeds.
 */
export const formatDateTime = (dateValue) => {
  return formatDate(dateValue, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};
