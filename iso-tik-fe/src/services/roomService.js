import api from './api'

const DEFAULT_PAGINATION = {
	current_page: 1,
	per_page: 15,
	total: 0,
	last_page: 1,
	from: null,
	to: null,
}

const ensureArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const unwrap = (response) => response?.data?.data ?? response?.data ?? null

export async function listRooms(params = {}) {
	const res = await api.get('/rooms', { params })
	const payload = unwrap(res) ?? {}
	const securityLevels = ensureArray(
		payload.security_levels ??
		payload.securityLevels ??
		payload.available_security_levels ??
		payload.availableSecurityLevels ??
		payload.metadata?.security_levels ??
		payload.metadata?.securityLevels ??
		[]
	)
	return {
		rooms: ensureArray(payload.rooms ?? payload.items ?? []),
		pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
		securityLevels,
		metadata: payload.metadata ?? null,
	}
}

export async function getRoom(roomId) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.get(`/rooms/${roomId}`)
	return unwrap(res) ?? {}
}

export async function updateRoom(roomId, payload) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.put(`/rooms/${roomId}`, payload)
	return unwrap(res) ?? {}
}

export async function deleteRoom(roomId) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.delete(`/rooms/${roomId}`)
	return res?.data ?? {}
}

export async function lockRoom(roomId, payload = {}) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.post(`/rooms/${roomId}/lock`, payload)
	return unwrap(res) ?? {}
}

export async function unlockRoom(roomId) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.post(`/rooms/${roomId}/unlock`)
	return unwrap(res) ?? {}
}

export async function archiveRoom(roomId) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.post(`/rooms/${roomId}/archive`)
	return unwrap(res) ?? {}
}

export async function restoreRoom(roomId) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.post(`/rooms/${roomId}/restore`)
	return unwrap(res) ?? {}
}

export async function listParticipants(roomId, params = {}) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.get(`/rooms/${roomId}/participants`, { params })
	const payload = unwrap(res) ?? {}
	return {
		participants: ensureArray(payload.participants ?? []),
		pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
	}
}

export async function addParticipant(roomId, payload) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.post(`/rooms/${roomId}/participants`, payload)
	return unwrap(res) ?? {}
}

export async function updateParticipant(roomId, participantId, payload) {
	if (!roomId || !participantId) throw new Error('roomId and participantId are required')
	const res = await api.put(`/rooms/${roomId}/participants/${participantId}`, payload)
	return unwrap(res) ?? {}
}

export async function removeParticipant(roomId, participantId) {
	if (!roomId || !participantId) throw new Error('roomId and participantId are required')
	const res = await api.delete(`/rooms/${roomId}/participants/${participantId}`)
	return res?.data ?? {}
}

export async function leaveRoom(roomId) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.post(`/rooms/${roomId}/leave`)
	return unwrap(res) ?? {}
}

export async function listTopics(roomId, params = {}) {
	if (!roomId) throw new Error('roomId is required')
	const res = await api.get(`/rooms/${roomId}/topics`, { params })
	const payload = unwrap(res) ?? {}
	return {
		topics: ensureArray(payload.topics ?? []),
		pagination: { ...DEFAULT_PAGINATION, ...(payload.pagination ?? {}) },
	}
}

export default {
	listRooms,
	getRoom,
	updateRoom,
	deleteRoom,
	lockRoom,
	unlockRoom,
	archiveRoom,
	restoreRoom,
	listParticipants,
	addParticipant,
	updateParticipant,
	removeParticipant,
	leaveRoom,
	listTopics,
}
