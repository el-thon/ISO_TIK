export const DEFAULT_PAGINATION = {
  current_page: 1,
  per_page: 15,
  total: 0,
  last_page: 1,
  from: null,
  to: null,
}

export const ensureArray = (value) => {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

export const mergePagination = (pagination = {}) => ({
  ...DEFAULT_PAGINATION,
  ...(pagination || {}),
})

export const unwrapApiPayload = (response) => {
  const dataPayload = response?.data?.data
  if (dataPayload !== undefined) return dataPayload

  const messagePayload = response?.data?.message
  if (messagePayload && typeof messagePayload === 'object') return messagePayload

  return response?.data ?? null
}
