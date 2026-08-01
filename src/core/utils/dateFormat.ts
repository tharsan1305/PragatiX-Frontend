/**
 * Date formatting helpers for ISO strings returned by backend APIs.
 */
export const formatDate = (isoString?: string | Date | null): string => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (_) {
    return 'N/A';
  }
};

export const formatDateTime = (isoString?: string | Date | null): string => {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return 'N/A';
  }
};

export default formatDate;
