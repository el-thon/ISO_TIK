// Helper utilities to consistently decide whether a forum's *period* deadline has passed.
// Important: backend commonly returns forum_period_end_date as a date-only string (YYYY-MM-DD).
// JS Date parses that as UTC midnight, which can produce off-by-one issues. We treat it as
// local end-of-day (23:59:59.999) to match the business rule "tenggat 23:59".

export function parseLocalEndOfDay(value) {
  if (!value) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split('-').map(Number)
      return new Date(y, m - 1, d, 23, 59, 59, 999)
    }
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

/**
 * Compute whether the period deadline has passed.
 * Accepts a "container" object that may look like:
 * - forum: { forum_period_deadline_passed, forum_period_end_date }
 * - room/child forum objects that also carry those fields
 */
export function isPeriodDeadlinePassed(container, now = new Date()) {
  if (!container) return false

  const explicit = container?.forum_period_deadline_passed
  if (typeof explicit === 'boolean') return explicit

  const endDate = container?.forum_period_end_date
  const parsed = parseLocalEndOfDay(endDate)
  if (!parsed) return false
  return parsed < now
}
