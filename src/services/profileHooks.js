import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo, useRef } from 'react'
import { getAccessToken } from './api'
import * as profileService from './profileService'

// ============ UTILITY FUNCTIONS UNTUK PHOTO ============
const PHOTO_OVERRIDE_KEY = 'iso_tik_profile_photo_override'
const PHOTO_VERSION_KEY = 'iso_tik_photo_version'

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''

const STORAGE_BASE = (explicitStorageBase || apiOrigin || proxyTarget || (import.meta.env.DEV ? 'http://localhost:8000' : runtimeFallback)).replace(/\/$/, '')

const resolvePhotoUrl = (path, bypassCache = false) => {
  if (!path) return null
  
  let timestamp = Date.now()
  if (!bypassCache) {
    try {
      const storedVersion = localStorage.getItem(PHOTO_VERSION_KEY)
      if (storedVersion) timestamp = storedVersion
    } catch { /* ignore */ }
  }
  
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}${path.includes('?') ? '&' : '?'}_t=${timestamp}`
  }
  
  const isAbsolutePath = path.startsWith('/mnt/') || 
                         path.startsWith('/home/') || 
                         path.startsWith('C:/') || 
                         path.startsWith('D:/') ||
                         path.startsWith('/Users/')
  
  if (isAbsolutePath) {
    const storageIndex = path.indexOf('public/storage/')
    if (storageIndex !== -1) {
      const relativePath = path.substring(storageIndex + 'public/storage/'.length)
      return `${STORAGE_BASE}/storage/${relativePath}?_t=${timestamp}`
    }
    const parts = path.split('/')
    const filename = parts[parts.length - 1]
    const folder = parts[parts.length - 2]
    if (filename && folder) {
      return `${STORAGE_BASE}/storage/profile-photos/${folder}/${filename}?_t=${timestamp}`
    }
  }
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  let fullUrl = cleanPath.startsWith('storage/') 
    ? `${STORAGE_BASE}/${cleanPath}`
    : `${STORAGE_BASE}/storage/${cleanPath}`
  
  return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${timestamp}`
}

const extractPhotoPath = (payload) => {
  if (!payload) return null
  if (payload.photo_url) return payload.photo_url
  if (payload.profile?.photo_url) return payload.profile.photo_url
  if (payload.data?.photo_url) return payload.data.photo_url
  if (payload.data?.profile?.photo_url) return payload.data.profile.photo_url
  if (payload.user?.photo_url) return payload.user.photo_url
  return null
}

// ============ UTILITY FUNCTIONS UNTUK SIGNATURE ============
/**
 * Build storage URL from stored_path
 * stored_path format: "signatures/{userId}/filename.png"
 */
const buildStorageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  return `${STORAGE_BASE}/storage/${cleanPath}`
}

/**
 * Extract signature data from API response
 * Response structure from SignatureController: { data: { signature: { ... } } }
 */
const extractSignatureData = (response) => {
  if (!response) return null
  // Handle response dari useQuery (sudah unwrapped oleh service)
  if (response.signature) return response.signature
  // Handle raw response
  if (response.data?.signature) return response.data.signature
  return null
}

// ============ AUTH HELPERS ============
const hasToken = () => Boolean(getAccessToken())

const authEnabled = (options = {}, defaultEnabled = true) => {
  const flag = options.enabled ?? defaultEnabled
  return flag && hasToken()
}

// ============ PROFILE QUERIES & MUTATIONS ============
export function useProfile(options = {}) {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.fetchProfile(),
    staleTime: 1000 * 30,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useUpdateProfile(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => profileService.updateProfile(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUpdateEmployment(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ payload }) => profileService.updateEmployment({ payload }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useUploadProfilePhoto(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => profileService.uploadPhoto(file),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'security'] })
      const photoUrl = data?.photo_url || data?.data?.photo_url
      if (photoUrl) {
        queryClient.setQueryData(['profile'], (old) => ({
          ...(old || {}),
          photo_url: photoUrl,
          profile: {
            ...(old?.profile || {}),
            photo_url: photoUrl,
          },
        }))
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteProfilePhoto(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => profileService.deletePhoto(),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useChangePassword(options = {}) {
  return useMutation({
    mutationFn: (payload) => profileService.changePassword(payload),
    ...options,
  })
}

export function useSessions(params = {}, options = {}) {
  return useQuery({
    queryKey: ['profile', 'sessions', params],
    queryFn: () => profileService.getSessions(params),
    keepPreviousData: true,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useLoginHistory(params = {}, options = {}) {
  return useQuery({
    queryKey: ['profile', 'login-history', params],
    queryFn: () => profileService.getLoginHistory(params),
    keepPreviousData: true,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useSignature(options = {}) {
  return useQuery({
    queryKey: ['profile', 'signature'],
    queryFn: () => profileService.getSignature(),
    staleTime: 1000 * 30,
    retry: false,
    ...options,
    enabled: authEnabled(options),
  })
}

export function useUploadSignature(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file) => profileService.uploadSignature(file),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'signature'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (data && (data.id || data.signature_url || data.stored_path)) {
        queryClient.setQueryData(['profile', 'signature'], data)
      }
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDeleteSignature(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => profileService.deleteSignature(),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'signature'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useDownloadSignature(options = {}) {
  return useMutation({
    mutationFn: () => profileService.downloadSignature(),
    ...options,
  })
}

export function useRevokeSession(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, payload }) => profileService.revokeSession(sessionId, payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'security'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

export function useRevokeAllSessions(options = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => profileService.revokeAllSessions(payload),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'security'] })
      queryClient.invalidateQueries({ queryKey: ['profile', 'sessions'] })
      if (options.onSuccess) options.onSuccess(data, variables, context)
    },
    ...options,
  })
}

// ============ CUSTOM HOOK: useProfilePhoto ============
/**
 * Custom hook untuk manajemen foto profil (upload, preview, delete)
 * 
 * @param {Object} profileData - Data profil dari useProfile()
 * @param {Function} refetch - Function refetch dari useProfile()
 * @returns {Object} Props dan handlers untuk komponen avatar
 */
export function useProfilePhoto(profileData, refetch) {
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  
  const [photoMessage, setPhotoMessage] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [photoOverride, setPhotoOverride] = useState(() => {
    try {
      return localStorage.getItem(PHOTO_OVERRIDE_KEY)
    } catch {
      return null
    }
  })
  const [photoVersion, setPhotoVersion] = useState(() => {
    try {
      return localStorage.getItem(PHOTO_VERSION_KEY) || Date.now().toString()
    } catch {
      return Date.now().toString()
    }
  })

  const uploadMutation = useUploadProfilePhoto()
  const deleteMutation = useDeleteProfilePhoto()

  const currentPhotoPath = useMemo(() => extractPhotoPath(profileData), [profileData])

  const avatarSrc = useMemo(() => {
    if (avatarPreview) return avatarPreview
    if (photoOverride) return resolvePhotoUrl(photoOverride, true)
    if (currentPhotoPath) return resolvePhotoUrl(currentPhotoPath, false)
    return null
  }, [avatarPreview, photoOverride, currentPhotoPath, photoVersion])

  const updatePhotoVersion = () => {
    const newVersion = Date.now().toString()
    setPhotoVersion(newVersion)
    try { 
      localStorage.setItem(PHOTO_VERSION_KEY, newVersion) 
    } catch { /* ignore */ }
  }

  const resetPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setAvatarPreview(null)
    setAvatarError(false)
  }

  const handleSelectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setPhotoMessage(null)
    
    const objectUrl = URL.createObjectURL(file)
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = objectUrl
    setAvatarPreview(objectUrl)
    setAvatarError(false)
    
    try {
      await uploadMutation.mutateAsync(file)
      setPhotoMessage('Foto profil berhasil diperbarui')
      
      // ✅ TAMBAHKAN 3 BARIS INI:
      setPhotoOverride(null)                          // Reset state
      localStorage.removeItem(PHOTO_OVERRIDE_KEY)    // Clear localStorage override
      
      updatePhotoVersion()
      setTimeout(() => setPhotoMessage(null), 3000)
      setTimeout(() => refetch(), 1000)
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal mengunggah foto'
      setPhotoMessage(message)
      resetPreview()
      setTimeout(() => setPhotoMessage(null), 3000)
    }
  }

  const handleDeletePhoto = async () => {
    if (!currentPhotoPath && !photoOverride) return
    setPhotoMessage(null)
    
    try {
      await deleteMutation.mutateAsync()
      setPhotoMessage('Foto profil dihapus')
      setPhotoOverride(null)
      updatePhotoVersion()
      try { localStorage.removeItem(PHOTO_OVERRIDE_KEY) } catch { /* ignore */ }
      refetch()
      resetPreview()
      setTimeout(() => setPhotoMessage(null), 3000)
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal menghapus foto'
      setPhotoMessage(message)
      setTimeout(() => setPhotoMessage(null), 3000)
    }
  }

  const forceRefreshPhoto = async () => {
    setPhotoMessage('Memuat ulang foto...')
    updatePhotoVersion()
    await refetch()
    setTimeout(() => setPhotoMessage(null), 2000)
  }

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  return {
    fileInputRef,
    avatarSrc,
    avatarError,
    photoMessage,
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
    handleSelectFile,
    handleFileChange,
    handleDeletePhoto,
    forceRefreshPhoto,
    setAvatarError,
  }
}

// ============ SIGNATURE UTILITIES (untuk digunakan di komponen) ============
/**
 * Get signature image URL from signature query data
 * 
 * @param {Object} signatureData - Data dari useSignature()
 * @returns {string|null} URL gambar signature atau null jika tidak ada
 */
export const getSignatureUrl = (signatureData) => {
  const signature = extractSignatureData(signatureData)
  if (!signature) return null
  if (signature.signature_url) return signature.signature_url
  if (signature.url) return signature.url
  if (signature.download_url) return signature.download_url
  if (!signature.stored_path) return null
  return buildStorageUrl(signature.stored_path)
}

/**
 * Check if user has signature
 * 
 * @param {Object} signatureData - Data dari useSignature()
 * @returns {boolean} True jika user memiliki signature
 */
export const hasSignature = (signatureData) => {
  const signature = extractSignatureData(signatureData)
  return Boolean(
    signature?.id &&
    (signature?.stored_path || signature?.signature_url || signature?.url || signature?.download_url)
  )
}

/**
 * Get signature metadata (filename, size, etc)
 * 
 * @param {Object} signatureData - Data dari useSignature()
 * @returns {Object|null} Metadata signature atau null
 */
export const getSignatureMetadata = (signatureData) => {
  const signature = extractSignatureData(signatureData)
  if (!signature) return null
  return {
    id: signature.id,
    original_filename: signature.original_filename,
    mime_type: signature.mime_type,
    size_bytes: signature.size_bytes,
    created_at: signature.created_at,
    updated_at: signature.updated_at,
  }
}

export default {
  useProfile,
  useUpdateProfile,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
  useChangePassword,
  useSessions,
  useLoginHistory,
  useRevokeSession,
  useRevokeAllSessions,
  useSignature,
  useUploadSignature,
  useDeleteSignature,
  useDownloadSignature,
  useProfilePhoto,
  useUpdateEmployment,
  // Signature utilities
  getSignatureUrl,
  hasSignature,
  getSignatureMetadata,
}