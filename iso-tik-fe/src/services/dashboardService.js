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

function unwrap(response, key, fallback) {
  const payload = response?.data?.data ?? null
  if (key && payload && Object.prototype.hasOwnProperty.call(payload, key)) {
    return payload[key] ?? fallback
  }
  if (!key && payload) {
    return payload
  }
  return fallback
}

export async function getSummary() {
  const res = await api.get('/dashboard')
  const summary = unwrap(res, 'summary', SUMMARY_DEFAULTS) || SUMMARY_DEFAULTS
  return { ...SUMMARY_DEFAULTS, ...summary }
}

export async function getMyAssignments() {
  const res = await api.get('/dashboard/my-assignments')
  return unwrap(res, 'assignments', []) ?? []
}

export async function getTopicsNeedingAttention() {
  const res = await api.get('/dashboard/topics-needing-attention')
  return unwrap(res, 'topics', []) ?? []
}

export async function getUpcomingDeadlines() {
  const res = await api.get('/dashboard/upcoming-deadlines')
  return unwrap(res, 'deadlines', []) ?? []
}

export async function getStatistics() {
  const res = await api.get('/dashboard/statistics')
  const stats = unwrap(res, 'statistics', STATS_DEFAULTS) || STATS_DEFAULTS
  return { ...STATS_DEFAULTS, ...stats }
}

export default {
  getSummary,
  getMyAssignments,
  getTopicsNeedingAttention,
  getUpcomingDeadlines,
  getStatistics,
}
