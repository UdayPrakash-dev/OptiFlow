/**
 * Formats a raw status string (e.g., "in_progress", "pending_approval") into clean title case ("In Progress", "Pending Approval").
 * 
 * WHY: Backend databases store statuses in snake_case or lowercase strings.
 * Users should see clean, capitalized, human-readable labels instead.
 * 
 * @param {string} status - Raw status string
 * @returns {string} Formatted label, or fallback '-' if empty
 */
export const formatStatus = (status) => {
  // WHY: Return a safe dash fallback if status is null or undefined to avoid crashes.
  if (!status || typeof status !== 'string') return '—';

  // Replace underscores and hyphens with spaces, then capitalize each word
  return status
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Maps a raw status string to a recommended badge color/variant.
 * 
 * WHY: Consistent colors across all pages (e.g. green for completed, yellow for pending)
 * build visual muscle memory for users.
 * 
 * @param {string} status - Raw status string
 * @returns {'success' | 'warning' | 'danger' | 'info' | 'default'} Badge variant name
 */
export const getStatusVariant = (status) => {
  if (!status || typeof status !== 'string') return 'default';

  const normalized = status.toLowerCase().replace(/[_-]/g, '');

  // Completed / Approved / Active states -> Success (Green)
  if (['completed', 'approved', 'active', 'passed', 'resolved', 'done'].includes(normalized)) {
    return 'success';
  }

  // Pending / In Progress / Under Review states -> Warning (Yellow/Amber)
  if (['pending', 'inprogress', 'underreview', 'review', 'inreview', 'draft', 'open'].includes(normalized)) {
    return 'warning';
  }

  // Failed / Rejected / Inactive / Danger states -> Danger (Red)
  if (['rejected', 'failed', 'inactive', 'blocked', 'cancelled', 'high', 'critical'].includes(normalized)) {
    return 'danger';
  }

  // Info / Scheduled states -> Info (Blue)
  if (['scheduled', 'info', 'assigned', 'new'].includes(normalized)) {
    return 'info';
  }

  return 'default';
};
