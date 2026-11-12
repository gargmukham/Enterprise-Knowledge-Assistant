/**
 * Format an ISO timestamp into a readable date string (e.g. "Nov 12, 2026").
 * Returns "—" when the date is missing or invalid.
 */
export function formatDate(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

/**
 * Format an ISO timestamp with both date and time for metadata details.
 */
export function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

/**
 * Format an ISO timestamp into a compact label for chart axes (e.g. "Nov 12").
 */
export function formatShortDate(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(parsed);
}

/**
 * Return a local YYYY-MM-DD key for grouping records by calendar day.
 */
export function toDateKey(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check whether an ISO timestamp falls within the last `days` days.
 */
export function isWithinLastDays(value, days = 7) {
  if (!value) {
    return false;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;
  return now - parsed.getTime() <= windowMs && parsed.getTime() <= now + 60000;
}

