import { z } from 'zod'

export const DEADLINE_ERROR_MESSAGE_ID = 'Deadline periode sudah lewat'
export const DEADLINE_ERROR_MESSAGE_EN = 'Period deadline has passed'

export const isDeadlinePassedErrorMessage = (message = '') =>
  String(message || '').toLowerCase().includes(DEADLINE_ERROR_MESSAGE_ID.toLowerCase()) ||
  String(message || '').toLowerCase().includes(DEADLINE_ERROR_MESSAGE_EN.toLowerCase())

export const isForumRelated = (forum) => {
  if (forum?.is_related === true) return true
  if (forum?.is_related === false) return false
  const role = String(forum?.current_user_role ?? forum?.user_role ?? '').toLowerCase().trim()
  if (!role) return true
  if (['outsider', 'none', 'guest', 'unrelated'].includes(role)) return false
  return true
}

export const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export const createRoomSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
})

export const createPeriodSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  period_type: z.enum(['monthly', 'quarterly', 'semesterly', 'yearly'], {
    required_error: 'Tipe periode wajib dipilih',
  }),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})

export const updatePeriodSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').optional().or(z.literal('')),
  period_type: z.enum(['monthly', 'quarterly', 'semesterly', 'yearly']).optional(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})