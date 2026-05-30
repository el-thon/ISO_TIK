import api from './api'

const unwrap = (response) => response?.data?.data ?? response?.data ?? {}

const ensureArray = (value) => (Array.isArray(value) ? value : [])

export async function getSystemSettings() {
  const res = await api.get('/admin/system/settings')
  const payload = unwrap(res)
  return {
    settings: ensureArray(payload?.settings),
  }
}

export async function updateSystemSettings(settings) {
  const res = await api.put('/admin/system/settings', { settings })
  const payload = unwrap(res)
  return {
    settings: ensureArray(payload?.settings),
  }
}

export default {
  getSystemSettings,
  updateSystemSettings,
}
