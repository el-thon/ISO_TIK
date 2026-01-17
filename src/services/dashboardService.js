import api from './api'

const SUMMARY_DEFAULTS = {
  active_assignments: 0,
  topics_needing_attention: 0,
  upcoming_deadlines: 0,
  unread_notifications: 0,
  recent_activity: 0,
}

const STATS_DEFAULTS = {
  total_assignments: 0,
  completed_assignments: 0,
  active_assignments: 0,
  completion_rate: 0,
  on_time_completion_rate: 0,
  average_completion_days: null,
  topics_created: 0,
  comments_made: 0,
  rooms_participated: 0,
}

const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const pick = (obj, keys) => {
  if (!obj) return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}

const unwrap = (response) => {
  if (!response) return null
  return response?.data?.data ?? response?.data ?? null
}

const pickArrayData = (...sources) => {
  for (const source of sources) {
    if (!source) continue
    if (Array.isArray(source)) return source
    if (Array.isArray(source?.data)) return source.data
  }
  return null
}

const normalizeSummary = (payload) => {
  const source =
    payload?.summary ||
    payload?.dashboard ||
    payload?.data?.summary ||
    payload?.data?.dashboard ||
    payload ||
    {}

  return {
    active_assignments: toNumber(pick(source, ['active_assignments', 'activeAssignments', 'assignments_active', 'assignmentsActive']), 0),
    topics_needing_attention: toNumber(
      pick(source, ['topics_needing_attention', 'topicsNeedingAttention', 'attention_topics', 'topicsAttention']),
      0
    ),
    upcoming_deadlines: toNumber(
      pick(source, ['upcoming_deadlines', 'upcomingDeadlines', 'deadlines_upcoming', 'deadlineUpcoming']),
      0
    ),
    unread_notifications: toNumber(
      pick(source, ['unread_notifications', 'unreadNotifications', 'notifications_unread', 'unreadNotificationCount']),
      0
    ),
    recent_activity: toNumber(pick(source, ['recent_activity', 'recentActivity', 'activity_recent', 'activityLast30Days']), 0),
  }
}

const normalizeStats = (payload) => {
  const source =
    payload?.statistics ||
    payload?.stats ||
    payload?.data?.statistics ||
    payload?.data?.stats ||
    payload ||
    {}

  return {
    total_assignments: toNumber(pick(source, ['total_assignments', 'totalAssignments', 'assignments_total']), 0),
    completed_assignments: toNumber(pick(source, ['completed_assignments', 'completedAssignments', 'assignments_completed']), 0),
    active_assignments: toNumber(pick(source, ['active_assignments', 'activeAssignments', 'assignments_active']), 0),
    completion_rate: toNumber(pick(source, ['completion_rate', 'completionRate', 'assignments_completion_rate']), 0),
    on_time_completion_rate: toNumber(
      pick(source, ['on_time_completion_rate', 'onTimeCompletionRate', 'assignments_on_time_rate']),
      0
    ),
    average_completion_days:
      pick(source, ['average_completion_days', 'averageCompletionDays', 'avg_completion_days']) ?? null,
    topics_created: toNumber(pick(source, ['topics_created', 'topicsCreated']), 0),
    comments_made: toNumber(pick(source, ['comments_made', 'commentsMade']), 0),
    rooms_participated: toNumber(pick(source, ['rooms_participated', 'roomsParticipated']), 0),
  }
}

const normalizeAssignment = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  const topic = raw.topic || raw.topic_data || raw.topic_detail || null
  return {
    ...raw,
    topic,
    assigned_by: raw.assigned_by || raw.assigner || raw.from_user || raw.created_by || null,
  }
}

const normalizeDeadline = (raw) => {
  if (!raw || typeof raw !== 'object') return raw
  const deadlineAt = raw.deadline_at || raw.deadlineAt || null
  const daysUntil = raw.days_until_deadline ?? raw.daysUntilDeadline
  if (deadlineAt && typeof daysUntil !== 'number') {
    const diffMs = new Date(deadlineAt).getTime() - Date.now()
    const computedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return { ...raw, deadline_at: deadlineAt, days_until_deadline: computedDays }
  }
  return { ...raw, deadline_at: deadlineAt }
}

export async function getSummary() {
  const res = await api.get('/dashboard')
  const payload = unwrap(res)
  const summary = normalizeSummary(payload)
  return { ...SUMMARY_DEFAULTS, ...summary }
}

export async function getMyAssignments() {
  const res = await api.get('/dashboard/my-assignments')
  const payload = unwrap(res)
  const arraySource =
    pickArrayData(
      payload?.assignments,
      payload?.data?.assignments,
      payload?.items,
      payload?.data?.items,
      payload?.results,
      payload?.data?.results,
      payload?.list,
      payload?.data?.list,
      payload
    ) ?? []

  return ensureArray(arraySource).map(normalizeAssignment)
}

export async function getTopicsNeedingAttention() {
  const res = await api.get('/dashboard/topics-needing-attention')
  const payload = unwrap(res)
  const topics =
    pickArrayData(
      payload?.topics,
      payload?.data?.topics,
      payload?.items,
      payload?.data?.items,
      payload?.results,
      payload?.data?.results,
      payload?.list,
      payload?.data?.list,
      payload
    ) ?? []

  return ensureArray(topics)
}

export async function getUpcomingDeadlines() {
  const res = await api.get('/dashboard/upcoming-deadlines')
  const payload = unwrap(res)
  const deadlines =
    pickArrayData(
      payload?.deadlines,
      payload?.data?.deadlines,
      payload?.topics,
      payload?.data?.topics,
      payload?.items,
      payload?.data?.items,
      payload?.results,
      payload?.data?.results,
      payload?.list,
      payload?.data?.list,
      payload
    ) ?? []

  return ensureArray(deadlines).map(normalizeDeadline)
}

export async function getStatistics() {
  const res = await api.get('/dashboard/statistics')
  const payload = unwrap(res)
  const stats = normalizeStats(payload)
  return { ...STATS_DEFAULTS, ...stats }
}

export default {
  getSummary,
  getMyAssignments,
  getTopicsNeedingAttention,
  getUpcomingDeadlines,
  getStatistics,
}
