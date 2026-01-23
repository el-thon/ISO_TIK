import api from './api'

export async function assignUserRole(userId, role) {
  if (!userId || !role) throw new Error('userId and role are required')
  const res = await api.post(`/admin/users/${userId}/roles`, { role })
  return res?.data ?? {}
}
