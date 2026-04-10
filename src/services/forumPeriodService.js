import api from './api'
import { getUserData, isProductOwnerUser } from '@/utils/auth'

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

const LEGACY_ROUTE_RE = /^\/forum-periods\b/

const toRuanganPath = (legacyPath) => legacyPath.replace(LEGACY_ROUTE_RE, '/ruangan')

const isNotFoundError = (error) => Number(error?.response?.status) === 404
const isForbiddenError = (error) => Number(error?.response?.status) === 403

const normalizeId = (value) => String(value ?? '').trim()

const isForumInPeriod = (forum, periodId) => {
  const target = normalizeId(periodId)
  if (!target) return false

  const candidates = [
    forum?.forum_period_id,
    forum?.forum_period?.id,
    forum?.period_id,
    forum?.period?.id,
  ]

  return candidates.some((candidate) => normalizeId(candidate) === target)
}

const buildPaginationFromArray = (items = [], params = {}) => {
  const total = items.length
  const currentPage = Math.max(1, Number(params?.page || 1))
  const perPage = Math.max(1, Number(params?.per_page || total || 1))
  const lastPage = Math.max(1, Math.ceil(total / perPage))

  return {
    current_page: currentPage,
    per_page: perPage,
    total,
    last_page: lastPage,
  }
}

const requestWithRuanganFallback = async (method, legacyPath, payloadOrConfig, maybeConfig) => {
  const ruanganPath = toRuanganPath(legacyPath)

  try {
    if (method === 'get' || method === 'delete') {
      return await api[method](ruanganPath, payloadOrConfig)
    }
    return await api[method](ruanganPath, payloadOrConfig, maybeConfig)
  } catch (error) {
    if (!isNotFoundError(error)) throw error

    if (method === 'get' || method === 'delete') {
      return await api[method](legacyPath, payloadOrConfig)
    }
    return await api[method](legacyPath, payloadOrConfig, maybeConfig)
  }
}

const pickArrayData = (...sources) => {
  for (const source of sources) {
    if (!source) continue
    if (Array.isArray(source)) return source
    if (Array.isArray(source?.data)) return source.data
    if (Array.isArray(source?.items)) return source.items
    if (Array.isArray(source?.results)) return source.results
    if (Array.isArray(source?.list)) return source.list
  }
  return []
}

const uniqueForumsById = (items = []) => {
  const map = new Map()
  for (const item of ensureArray(items)) {
    const id = String(item?.id ?? '').trim()
    if (!id) continue
    if (!map.has(id)) {
      map.set(id, item)
      continue
    }

    const existing = map.get(id)
    map.set(id, {
      ...existing,
      ...item,
    })
  }
  return Array.from(map.values())
}

const sliceByParams = (items = [], params = {}) => {
  const currentPage = Math.max(1, Number(params?.page || 1))
  const perPage = Math.max(1, Number(params?.per_page || items.length || 1))
  const start = (currentPage - 1) * perPage
  const end = start + perPage
  return items.slice(start, end)
}

const normalizeForumRelation = (forum = {}) => {
  const currentUserRole = forum?.current_user_role ?? forum?.user_role ?? null
  const explicitRelated = typeof forum?.is_related === 'boolean' ? forum.is_related : null

  return {
    ...forum,
    current_user_role: currentUserRole,
    user_role: forum?.user_role ?? currentUserRole,
    is_related: explicitRelated ?? (currentUserRole ? String(currentUserRole).toLowerCase() !== 'outsider' : true),
  }
}

export async function listForumPeriods(params = {}) {
  const res = await requestWithRuanganFallback('get', '/forum-periods', { params })
  const payload = unwrap(res) ?? {}

  return {
    periods: ensureArray(
      pickArrayData(
        payload?.periods,
        payload?.items,
        payload?.data,
        payload?.results,
        payload?.list,
        payload
      )
    ),
  }
}

export async function getForumPeriod(periodId) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestWithRuanganFallback('get', `/forum-periods/${periodId}`)
  return unwrap(res) ?? {}
}

export async function createForumPeriod(payload) {
  const res = await requestWithRuanganFallback('post', '/forum-periods', payload)
  return unwrap(res) ?? {}
}

export async function updateForumPeriod(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestWithRuanganFallback('put', `/forum-periods/${periodId}`, payload)
  return unwrap(res) ?? {}
}

export async function listForumPeriodForums(periodId, params = {}) {
  if (!periodId) throw new Error('periodId is required')

  try {
    const res = await requestWithRuanganFallback('get', `/forum-periods/${periodId}/forums`, { params })
    const payload = unwrap(res) ?? {}

    const forums = ensureArray(
      pickArrayData(
        payload?.forums,
        payload?.items,
        payload?.data,
        payload?.results,
        payload?.list,
        payload?.period?.forums,
        payload?.forum_period?.forums,
        payload
      )
    ).map(normalizeForumRelation)

    let resolvedForums = forums

    const shouldReconcileWithGlobal = resolvedForums.length <= 1
    if (shouldReconcileWithGlobal) {
      try {
        const globalRes = await api.get('/forums', { params: { per_page: 1000, forum_period_id: periodId } })
        const globalPayload = unwrap(globalRes) ?? {}
        const globalForums = ensureArray(
          pickArrayData(
            globalPayload?.forums,
            globalPayload?.items,
            globalPayload?.data,
            globalPayload?.results,
            globalPayload?.list,
            globalPayload
          )
        )
          .filter((forum) => isForumInPeriod(forum, periodId))
          .map(normalizeForumRelation)

        const merged = uniqueForumsById([...resolvedForums, ...globalForums])
        if (merged.length > resolvedForums.length) {
          resolvedForums = merged
        }
      } catch {
        // keep primary /ruangan result when global reconciliation fails
      }
    }

    const resolvedPagination =
      resolvedForums.length === forums.length
        ? payload?.pagination ?? null
        : buildPaginationFromArray(resolvedForums, params)

    return {
      forums:
        resolvedForums.length === forums.length
          ? resolvedForums
          : sliceByParams(resolvedForums, params),
      period:
        payload?.period ??
        payload?.forum_period ??
        payload?.forumPeriod ??
        null,
      pagination: resolvedPagination,
      raw: payload,
    }
  } catch (error) {
    const isProductOwner = isProductOwnerUser(getUserData())
    if (!isProductOwner || !isForbiddenError(error)) {
      throw error
    }

    // Fallback for product_owner: fetch from global /forums and scope by period when possible.
    const globalRes = await api.get('/forums', { params: { per_page: 1000, forum_period_id: periodId } })
    const globalPayload = unwrap(globalRes) ?? {}

    const allForums = ensureArray(
      pickArrayData(
        globalPayload?.forums,
        globalPayload?.items,
        globalPayload?.data,
        globalPayload?.results,
        globalPayload?.list,
        globalPayload
      )
    ).map(normalizeForumRelation)

    const filteredByPeriod = allForums.filter((forum) => isForumInPeriod(forum, periodId))
    // If API already scoped by forum_period_id but items don't expose period fields,
    // keep all returned rows so UI total still matches fetched data.
    const scopedForums = filteredByPeriod.length > 0 ? filteredByPeriod : allForums

    const pagination = buildPaginationFromArray(scopedForums, params)
    const start = (pagination.current_page - 1) * pagination.per_page
    const end = start + pagination.per_page

    return {
      forums: scopedForums.slice(start, end),
      period: null,
      pagination,
      raw: globalPayload,
    }
  }
}

export async function createForumPeriodForum(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestWithRuanganFallback('post', `/forum-periods/${periodId}/forums`, payload)
  return unwrap(res) ?? {}
}

export async function updateForumPeriodForum(periodId, forumId, payload) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await requestWithRuanganFallback('put', `/forum-periods/${periodId}/forums/${forumId}`, payload)
  return unwrap(res) ?? {}
}

export async function listForumPeriodForumTopics(periodId, forumId, params = {}) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await requestWithRuanganFallback('get', `/forum-periods/${periodId}/forums/${forumId}/topics`, { params })
  const payload = unwrap(res) ?? {}

  return {
    topics: ensureArray(
      pickArrayData(
        payload?.topics,
        payload?.items,
        payload?.data,
        payload?.results,
        payload?.list,
        payload
      )
    ),
    forum: payload?.forum ?? null,
    period: payload?.period ?? null,
    pagination: payload?.pagination ?? null,
  }
}

export async function createForumPeriodForumTopic(periodId, forumId, payload) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await requestWithRuanganFallback('post', `/forum-periods/${periodId}/forums/${forumId}/topics`, payload)
  return unwrap(res) ?? {}
}

export async function joinForumPeriodByCode(payload) {
  const res = await requestWithRuanganFallback('post', '/forum-periods/join', payload)
  return unwrap(res) ?? {}
}

export default {
  listForumPeriods,
  getForumPeriod,
  createForumPeriod,
  updateForumPeriod,
  listForumPeriodForums,
  createForumPeriodForum,
  updateForumPeriodForum,
  listForumPeriodForumTopics,
  createForumPeriodForumTopic,
  joinForumPeriodByCode,
}