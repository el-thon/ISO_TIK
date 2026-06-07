import api from './api'
import { getUserData, isProductOwnerUser } from '@/utils/auth'

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])
const unwrap = (response) => response?.data?.data ?? response?.data ?? null
const PERIOD_ROUTE = '/period'

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

const requestPeriod = async (method, path, payloadOrConfig, maybeConfig) => {
  if (method === 'get' || method === 'delete') {
    return await api[method](path, payloadOrConfig)
  }
  return await api[method](path, payloadOrConfig, maybeConfig)
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
    map.set(id, map.has(id) ? { ...map.get(id), ...item } : item)
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
  const participantCount = forum?.participant_count ?? forum?.participants_count ?? 0
  const formulirCount = forum?.formulir_count ?? forum?.form_count ?? forum?.forms_count ?? forum?.topic_count ?? forum?.topics_count ?? 0
  const createdByUser = forum?.created_by_user ?? forum?.owner ?? forum?.responsible_user ?? null

  return {
    ...forum,
    participant_count: participantCount,
    participants_count: forum?.participants_count ?? participantCount,
    formulir_count: formulirCount,
    form_count: forum?.form_count ?? formulirCount,
    forms_count: forum?.forms_count ?? formulirCount,
    topic_count: forum?.topic_count ?? formulirCount,
    topics_count: forum?.topics_count ?? formulirCount,
    created_by_user: createdByUser,
    owner: forum?.owner ?? createdByUser,
    created_by: forum?.created_by ?? createdByUser?.name ?? createdByUser?.username ?? null,
    current_user_role: currentUserRole,
    user_role: forum?.user_role ?? currentUserRole,
    is_related: explicitRelated ?? (currentUserRole ? String(currentUserRole).toLowerCase() !== 'outsider' : false),
  }
}

const normalizePeriodDetail = (payload = {}) => {
  const period = payload?.period ?? payload?.forum_period ?? payload?.forumPeriod ?? payload
  return {
    ...payload,
    ...(period || {}),
    period,
    members: payload?.members ?? period?.members ?? [],
    current_user_role: payload?.current_user_role ?? period?.current_user_role ?? null,
    user_role: payload?.user_role ?? period?.user_role ?? null,
    is_related: payload?.is_related ?? period?.is_related ?? false,
    user_membership: payload?.user_membership ?? period?.user_membership ?? null,
    user_join_request: payload?.user_join_request ?? period?.user_join_request ?? null,
    my_join_request: payload?.my_join_request ?? period?.my_join_request ?? null,
  }
}

export async function listPeriods(params = {}) {
  const res = await requestPeriod('get', PERIOD_ROUTE, { params })
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

export async function getPeriod(periodId) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestPeriod('get', `${PERIOD_ROUTE}/${periodId}`)
  return normalizePeriodDetail(unwrap(res) ?? {})
}

export async function createPeriod(payload) {
  const res = await requestPeriod('post', PERIOD_ROUTE, payload)
  return unwrap(res) ?? {}
}

export async function updatePeriod(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestPeriod('put', `${PERIOD_ROUTE}/${periodId}`, payload)
  return unwrap(res) ?? {}
}

export async function listPeriodForums(periodId, params = {}) {
  if (!periodId) throw new Error('periodId is required')

  try {
    const res = await requestPeriod('get', `${PERIOD_ROUTE}/${periodId}/forums`, { params })
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
        const globalRes = await api.get('/forums', { params: { per_page: 100, forum_period_id: periodId } })
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
        // keep primary /period result when global reconciliation fails
      }
    }

    const resolvedPagination =
      resolvedForums.length === forums.length
        ? payload?.pagination ?? null
        : buildPaginationFromArray(resolvedForums, params)

    return {
      forums: resolvedForums.length === forums.length ? resolvedForums : sliceByParams(resolvedForums, params),
      period: payload?.period ?? payload?.forum_period ?? payload?.forumPeriod ?? null,
      pagination: resolvedPagination,
      raw: payload,
    }
  } catch (error) {
    const isProductOwner = isProductOwnerUser(getUserData())
    if (!isProductOwner || !isForbiddenError(error)) {
      throw error
    }

    const globalRes = await api.get('/forums', { params: { per_page: 100, forum_period_id: periodId } })
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

export async function createPeriodForum(periodId, payload) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestPeriod('post', `${PERIOD_ROUTE}/${periodId}/forums`, payload)
  return unwrap(res) ?? {}
}

export async function updatePeriodForum(periodId, forumId, payload) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await requestPeriod('put', `${PERIOD_ROUTE}/${periodId}/forums/${forumId}`, payload)
  return unwrap(res) ?? {}
}

export async function listPeriodForumForms(periodId, forumId, params = {}) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await requestPeriod('get', `${PERIOD_ROUTE}/${periodId}/forums/${forumId}/topics`, { params })
  const payload = unwrap(res) ?? {}
  const forms = ensureArray(pickArrayData(payload?.forms, payload?.formulir, payload?.topics, payload?.items, payload?.data, payload?.results, payload?.list, payload))

  return {
    forms,
    topics: forms,
    forum: payload?.forum ?? null,
    period: payload?.period ?? null,
    pagination: payload?.pagination ?? null,
  }
}

export const listPeriodForumFormulirs = listPeriodForumForms

export async function createPeriodForumForm(periodId, forumId, payload) {
  if (!periodId) throw new Error('periodId is required')
  if (!forumId) throw new Error('forumId is required')
  const res = await requestPeriod('post', `${PERIOD_ROUTE}/${periodId}/forums/${forumId}/topics`, payload)
  return unwrap(res) ?? {}
}

export const createPeriodForumFormulir = createPeriodForumForm

export async function joinPeriodByCode(payload) {
  if (!payload?.period_id) throw new Error('period_id is required to join period')
  const res = await requestPeriod('post', `${PERIOD_ROUTE}/join`, payload)
  return unwrap(res) ?? {}
}

export async function listPeriodJoinRequests(periodId, params = {}) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestPeriod('get', `${PERIOD_ROUTE}/${periodId}/join-requests`, { params })
  const payload = unwrap(res) ?? {}

  return {
    period_id: payload?.period_id ?? periodId,
    requests: ensureArray(
      pickArrayData(
        payload?.requests,
        payload?.items,
        payload?.data,
        payload?.results,
        payload?.list,
        payload
      )
    ),
  }
}

export async function getMyPeriodJoinRequest(periodId) {
  if (!periodId) throw new Error('periodId is required')
  const res = await requestPeriod('get', `${PERIOD_ROUTE}/${periodId}/join-requests/me`)
  const payload = unwrap(res) ?? {}

  return {
    period_id: payload?.period_id ?? periodId,
    is_member: Boolean(payload?.is_member),
    join_request: payload?.join_request ?? null,
  }
}

export async function approvePeriodJoinRequest(periodId, joinRequestId) {
  if (!periodId) throw new Error('periodId is required')
  if (!joinRequestId) throw new Error('joinRequestId is required')
  const res = await requestPeriod('post', `${PERIOD_ROUTE}/${periodId}/join-requests/${joinRequestId}/approve`)
  return unwrap(res) ?? {}
}

export async function rejectPeriodJoinRequest(periodId, joinRequestId, payload = {}) {
  if (!periodId) throw new Error('periodId is required')
  if (!joinRequestId) throw new Error('joinRequestId is required')
  const res = await requestPeriod('post', `${PERIOD_ROUTE}/${periodId}/join-requests/${joinRequestId}/reject`, payload)
  return unwrap(res) ?? {}
}

export default {
  listPeriods,
  getPeriod,
  createPeriod,
  updatePeriod,
  listPeriodForums,
  createPeriodForum,
  updatePeriodForum,
  listPeriodForumFormulirs,
  listPeriodForumForms,
  createPeriodForumFormulir,
  createPeriodForumForm,
  joinPeriodByCode,
  listPeriodJoinRequests,
  getMyPeriodJoinRequest,
  approvePeriodJoinRequest,
  rejectPeriodJoinRequest,
}
