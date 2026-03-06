import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  useChangePassword,
  useLoginHistory,
  useRevokeAllSessions,
  useRevokeSession,
  useSecuritySettings,
  useSessions,
  useUpdatePreferences,
  useSignature,
  useUploadSignature,
  useDeleteSignature,
  useDownloadSignature,
} from '@/services/profileHooks'
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react'

// ==================== UTILS ====================
const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const getStorageBaseUrl = () => {
  const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
  const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
  const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
  const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
  const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''
  
  return (explicitStorageBase || apiOrigin || proxyTarget || runtimeFallback).replace(/\/$/, '')
}

const STORAGE_BASE = getStorageBaseUrl()

// Perbaikan fungsi resolveSignatureUrl
const resolveSignatureUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path

  // Handle berbagai format path dari backend
  let normalized = path
  
  // Case 1: Path dengan pattern storage/app/public/
  const storagePatterns = [
    '/storage/app/public/',
    'storage/app/public/',
    '/storage/',
    'storage/'
  ]
  
  for (const pattern of storagePatterns) {
    if (normalized.includes(pattern)) {
      const index = normalized.indexOf(pattern)
      normalized = normalized.substring(index + pattern.length)
      break
    }
  }
  
  // Pastikan path memiliki prefix /storage/
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }
  
  if (!normalized.startsWith('/storage/')) {
    normalized = `/storage${normalized.startsWith('/') ? '' : '/'}${normalized}`
  }
  
  // Build final URL
  const base = STORAGE_BASE
  if (!base) return normalized
  
  // Handle double slash
  return `${base}${normalized}`.replace(/([^:]\/)\/+/g, '$1')
}

// ==================== COMPONENTS ====================
const SignatureSection = ({ 
  signatureQuery, 
  previewUrl, 
  hasSignature,
  onSelectFile,
  onUpload,
  onDownload,
  onDelete,
  isUploading,
  isDownloading,
  isDeleting,
  status 
}) => {
  const fileInputRef = useRef(null)
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }
  
  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }
  
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-medium">Tanda Tangan Digital</h4>
            <p className="text-xs text-muted-foreground">Kelola unggahan tanda tangan Anda</p>
          </div>
          {signatureQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>

        {!hasSignature && !signatureQuery.isFetching && (
          <div className="mb-3 text-xs text-amber-600">
            Tanda tangan belum tersedia. Silakan unggah file (PNG/JPG, maks 2MB) untuk mengaktifkan tanda tangan Anda.
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 border rounded-lg p-4 flex items-center justify-center bg-slate-50 min-h-[160px]">
            {hasSignature && previewUrl ? (
              <img
                src={previewUrl}
                alt="Signature Preview"
                className="max-h-40 object-contain"
                onError={(e) => {
                  console.error('Preview image failed to load:', previewUrl)
                  e.currentTarget.style.display = 'none'
                  // Show fallback
                  e.currentTarget.parentElement.innerHTML = `
                    <div class="text-xs text-muted-foreground text-center">
                      Gagal memuat pratinjau.<br/>Silakan unduh untuk melihat.
                    </div>
                  `
                }}
              />
            ) : (
              <div className="text-xs text-muted-foreground text-center">
                {isUploading ? 'Mengunggah...' : 'Belum ada tanda tangan.'}<br />
                {!isUploading && 'Unggah terlebih dahulu untuk melihat pratinjau.'}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 justify-start">
            <Button 
              variant="outline" 
              onClick={handleSelectClick} 
              disabled={isUploading}
            >
              {isUploading ? 'Mengunggah...' : 'Unggah Tanda Tangan'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onDownload} 
              disabled={isDownloading || !hasSignature}
            >
              {isDownloading ? 'Mengunduh...' : 'Unduh'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-red-600 hover:text-red-700" 
              onClick={onDelete} 
              disabled={isDeleting || !hasSignature}
            >
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
            
            {status && (
              <p className={`text-xs ${status.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {status.text}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ==================== MAIN COMPONENT ====================
export default function Security({ preferences }) {
  // Queries
  const securityQuery = useSecuritySettings()
  const [sessionsPage, setSessionsPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  const sessionsQuery = useSessions({ page: sessionsPage, per_page: 5 })
  const historyQuery = useLoginHistory({ page: historyPage, per_page: 5 })
  const signatureQuery = useSignature()
  
  // Signature state
  const [previewUrl, setPreviewUrl] = useState(null)
  const [signatureStatus, setSignatureStatus] = useState(null)
  const previewObjectUrlRef = useRef(null)
  
  // Forms
  const changePasswordForm = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  })

  const preferencesDefaults = useMemo(
    () => ({
      theme: preferences?.theme || 'light',
      language: preferences?.language || 'id',
      notifications: Boolean(
        typeof preferences?.notifications === 'boolean' ? preferences.notifications : true
      ),
    }),
    [preferences]
  )

  const preferencesForm = useForm({
    defaultValues: preferencesDefaults,
  })

  // Mutations
  const changePassword = useChangePassword()
  const updatePreferences = useUpdatePreferences()
  const revokeSession = useRevokeSession()
  const revokeAllSessions = useRevokeAllSessions()
  const uploadSignature = useUploadSignature()
  const deleteSignature = useDeleteSignature()
  const downloadSignature = useDownloadSignature()

  // UI States
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [preferencesStatus, setPreferencesStatus] = useState(null)
  const [revokeStatus, setRevokeStatus] = useState(null)

  // ========== SIGNATURE HANDLING ==========
  const signatureData = signatureQuery.data || {}
  const signatureEmbedded = signatureData.signature || signatureData.data || {}

  // Extract signature URL dengan multiple fallback (dukungan nested payload)
  const signaturePath = useMemo(() => {
    const candidates = [signatureData, signatureEmbedded]
    for (const candidate of candidates) {
      if (!candidate) continue
      const pathValue =
        candidate.stored_path ||
        candidate.signature_url ||
        candidate.url ||
        candidate.path ||
        candidate.download_url ||
        null
      if (pathValue) return pathValue
    }
    return null
  }, [signatureData, signatureEmbedded])
  
  const hasSignature = useMemo(() => {
    const candidates = [signatureData, signatureEmbedded]
    return candidates.some((c) => {
      if (!c) return false
      return Boolean(c.id || c.signature_id || c.signatureId || signaturePath)
    })
  }, [signatureData, signatureEmbedded, signaturePath])

  // Effect untuk handle preview URL
  useEffect(() => {
    // Cleanup function
    const cleanup = () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
    }

    cleanup() // Cleanup sebelum set new URL

    if (!hasSignature) {
      setPreviewUrl(null)
      return cleanup
    }

    // Priority 1: Use resolved URL if available
    if (signaturePath) {
      const resolvedUrl = resolveSignatureUrl(signaturePath)
      console.log('Resolved signature URL:', resolvedUrl) // Debug
      setPreviewUrl(resolvedUrl)
      return cleanup
    }

    // Priority 2: Download blob as fallback
    const loadSignatureBlob = async () => {
      try {
        console.log('Fetching signature blob...')
        const result = await downloadSignature.mutateAsync()
        
        if (result instanceof Blob) {
          const url = URL.createObjectURL(result)
          previewObjectUrlRef.current = url
          setPreviewUrl(url)
        } else if (result?.data instanceof Blob) {
          const url = URL.createObjectURL(result.data)
          previewObjectUrlRef.current = url
          setPreviewUrl(url)
        } else {
          console.warn('Unexpected download result:', result)
          setPreviewUrl(null)
        }
      } catch (error) {
        console.error('Failed to load signature blob:', error)
        setPreviewUrl(null)
      }
    }

    loadSignatureBlob()

    return cleanup
  }, [hasSignature, signaturePath, downloadSignature])

  // Upload handler
  const handleUploadSignature = async (file) => {
    if (!file) return
    
    setSignatureStatus(null)

    // Validate file
    if (file.size > 2 * 1024 * 1024) {
      setSignatureStatus({ 
        type: 'error', 
        text: 'Ukuran file maksimal 2MB' 
      })
      return
    }

    if (!file.type.startsWith('image/')) {
      setSignatureStatus({ 
        type: 'error', 
        text: 'Hanya file gambar yang diperbolehkan' 
      })
      return
    }

    // Show local preview
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current)
      previewObjectUrlRef.current = null
    }
    
    const localUrl = URL.createObjectURL(file)
    previewObjectUrlRef.current = localUrl
    setPreviewUrl(localUrl)

    try {
      await uploadSignature.mutateAsync(file)
      setSignatureStatus({ 
        type: 'success', 
        text: 'Tanda tangan berhasil diunggah' 
      })
      // Refresh data
      await signatureQuery.refetch()
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal mengunggah tanda tangan'
      setSignatureStatus({ type: 'error', text: message })
      // Revert preview on error
      setPreviewUrl(null)
    }
  }

  // Download handler
  const handleDownloadSignature = async () => {
    setSignatureStatus(null)
    
    try {
      const result = await downloadSignature.mutateAsync()
      
      let blob = null
      if (result instanceof Blob) {
        blob = result
      } else if (result?.data instanceof Blob) {
        blob = result.data
      } else if (result?.url) {
        // If API returns URL, fetch it
        const response = await fetch(result.url)
        blob = await response.blob()
      }

      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `signature_${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
        
        setSignatureStatus({ 
          type: 'success', 
          text: 'Tanda tangan berhasil diunduh' 
        })
      } else {
        throw new Error('No blob data received')
      }
    } catch (error) {
      console.error('Download error:', error)
      const message = error?.response?.data?.message || 'Gagal mengunduh tanda tangan'
      setSignatureStatus({ type: 'error', text: message })
    }
  }

  // Delete handler
  const handleDeleteSignature = async () => {
    setSignatureStatus(null)
    
    if (!confirm('Apakah Anda yakin ingin menghapus tanda tangan?')) {
      return
    }

    try {
      await deleteSignature.mutateAsync()
      
      // Cleanup preview
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current)
        previewObjectUrlRef.current = null
      }
      setPreviewUrl(null)
      
      setSignatureStatus({ 
        type: 'success', 
        text: 'Tanda tangan berhasil dihapus' 
      })
      
      // Refresh data
      await signatureQuery.refetch()
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal menghapus tanda tangan'
      setSignatureStatus({ type: 'error', text: message })
    }
  }

  // ========== FORM HANDLERS ==========
  const handlePasswordSubmit = async (values) => {
    setPasswordStatus(null)
    try {
      await changePassword.mutateAsync(values)
      setPasswordStatus({ type: 'success', text: 'Password berhasil diperbarui' })
      changePasswordForm.reset()
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal memperbarui password'
      setPasswordStatus({ type: 'error', text: message })
    }
  }

  const handlePreferencesSubmit = async (values) => {
    setPreferencesStatus(null)
    try {
      await updatePreferences.mutateAsync(values)
      setPreferencesStatus({ type: 'success', text: 'Preferensi tersimpan' })
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal menyimpan preferensi'
      setPreferencesStatus({ type: 'error', text: message })
    }
  }

  const handleRevokeAll = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const password = formData.get('revoke_password')
    
    if (!password) {
      setRevokeStatus({ 
        type: 'error', 
        text: 'Password dibutuhkan untuk mencabut sesi' 
      })
      return
    }
    
    setRevokeStatus(null)
    
    try {
      await revokeAllSessions.mutateAsync({ password })
      setRevokeStatus({ 
        type: 'success', 
        text: 'Semua sesi lain berhasil dicabut' 
      })
      event.currentTarget.reset()
      sessionsQuery.refetch()
      securityQuery.refetch()
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal mencabut sesi'
      setRevokeStatus({ type: 'error', text: message })
    }
  }

  // Pagination data
  const sessions = sessionsQuery.data?.items ?? []
  const sessionPagination = sessionsQuery.data?.pagination
  const loginHistory = historyQuery.data?.items ?? []
  const historyPagination = historyQuery.data?.pagination

  // Reset form when preferences change
  useEffect(() => {
    preferencesForm.reset(preferencesDefaults)
  }, [preferencesDefaults, preferencesForm])

  return (
    <div className="space-y-6">
      {/* Security Status Card */}
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium">Security & Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Kelola password, MFA, dan preferensi akun
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MFA Status */}
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2">
                {securityQuery.data?.mfa_enabled ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <p className="text-sm font-medium">Multi Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">
                    {securityQuery.isLoading
                      ? 'Memuat...'
                      : securityQuery.data?.mfa_enabled
                        ? 'Akun anda dilindungi MFA'
                        : 'Aktifkan MFA untuk keamanan ekstra'}
                  </p>
                </div>
              </div>
              <Button 
                variant={securityQuery.data?.mfa_enabled ? 'outline' : 'default'} 
                size="sm" 
                className="mt-4" 
                disabled
              >
                {securityQuery.data?.mfa_enabled ? 'Kelola MFA' : 'Aktifkan (coming soon)'}
              </Button>
            </div>

            {/* Change Password Form */}
            <form 
              onSubmit={changePasswordForm.handleSubmit(handlePasswordSubmit)} 
              className="border rounded-lg p-4 space-y-3"
            >
              <p className="text-sm font-medium">Ubah Password</p>
              <Input
                type="password"
                placeholder="Password saat ini"
                {...changePasswordForm.register('current_password')}
              />
              <Input
                type="password"
                placeholder="Password baru"
                {...changePasswordForm.register('new_password')}
              />
              <Input
                type="password"
                placeholder="Konfirmasi password baru"
                {...changePasswordForm.register('new_password_confirmation')}
              />
              {passwordStatus && (
                <p className={`text-xs ${passwordStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {passwordStatus.text}
                </p>
              )}
              <Button 
                type="submit" 
                disabled={changePassword.isPending}
              >
                {changePassword.isPending ? 'Menyimpan...' : 'Simpan Password'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Signature Section */}
      <SignatureSection
        signatureQuery={signatureQuery}
        previewUrl={previewUrl}
        hasSignature={hasSignature}
        onUpload={handleUploadSignature}
        onDownload={handleDownloadSignature}
        onDelete={handleDeleteSignature}
        isUploading={uploadSignature.isPending}
        isDownloading={downloadSignature.isPending}
        isDeleting={deleteSignature.isPending}
        status={signatureStatus}
      />

      {/* Preferences Form */}
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="font-medium">Preferensi Notifikasi & Tampilan</h4>
              <p className="text-xs text-muted-foreground">
                Sesuaikan bahasa, tema, dan notifikasi email
              </p>
            </div>
          </div>

          <form 
            onSubmit={preferencesForm.handleSubmit(handlePreferencesSubmit)} 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <div className="text-xs text-muted-foreground">Tema</div>
              <Select 
                value={preferencesForm.watch('theme')} 
                onValueChange={(value) => preferencesForm.setValue('theme', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Terang</SelectItem>
                  <SelectItem value="dark">Gelap</SelectItem>
                  <SelectItem value="auto">Otomatis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <div className="text-xs text-muted-foreground">Bahasa</div>
              <Select 
                value={preferencesForm.watch('language')} 
                onValueChange={(value) => preferencesForm.setValue('language', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col justify-end">
              <label className="inline-flex items-center gap-2 text-sm">
                <Checkbox
                  checked={preferencesForm.watch('notifications')}
                  onCheckedChange={(checked) => 
                    preferencesForm.setValue('notifications', Boolean(checked))
                  }
                />
                Email notifikasi aktivitas penting
              </label>
            </div>
            
            {preferencesStatus && (
              <p className={`text-xs ${preferencesStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {preferencesStatus.text}
              </p>
            )}
            
            <div className="md:col-span-3 flex justify-end">
              <Button 
                type="submit" 
                disabled={updatePreferences.isPending}
              >
                {updatePreferences.isPending ? 'Menyimpan...' : 'Simpan Preferensi'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Sesi Aktif</h4>
              <p className="text-xs text-muted-foreground">
                Kelola perangkat yang sedang login
              </p>
            </div>
            {sessionsQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Device</th>
                  <th className="py-2">IP</th>
                  <th className="py-2">Login</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Tidak ada sesi aktif
                    </td>
                  </tr>
                )}
                {sessions.map((session) => (
                  <tr key={session.id} className="border-t">
                    <td className="py-2">
                      <div className="font-medium text-xs wrap-break-word">
                        {session.user_agent || 'Unknown device'}
                      </div>
                    </td>
                    <td className="py-2">{session.ip_address || '-'}</td>
                    <td className="py-2">{formatDate(session.created_at)}</td>
                    <td className="py-2">
                      {session.is_current ? (
                        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          Current
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={session.is_current || revokeSession.isPending}
                        onClick={async () => {
                          try {
                            await revokeSession.mutateAsync({ sessionId: session.id })
                            sessionsQuery.refetch()
                          } catch (error) {
                            setRevokeStatus({ 
                              type: 'error', 
                              text: error?.response?.data?.message || 'Gagal mencabut sesi' 
                            })
                          }
                        }}
                      >
                        Cabut
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Halaman {sessionPagination?.currentPage || 1} / {sessionPagination?.lastPage || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionsPage((prev) => Math.max(1, prev - 1))}
                disabled={(sessionPagination?.currentPage || 1) === 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSessionsPage((prev) => 
                  sessionPagination?.lastPage 
                    ? Math.min(sessionPagination.lastPage, prev + 1) 
                    : prev + 1
                )}
                disabled={!sessionPagination || sessionPagination.currentPage >= sessionPagination.lastPage}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Revoke All Form */}
          <form onSubmit={handleRevokeAll} className="flex flex-col gap-3 md:flex-row md:items-center border rounded-lg p-3">
            <Input 
              type="password" 
              name="revoke_password" 
              placeholder="Masukkan password untuk mencabut semua sesi" 
              className="flex-1" 
            />
            <Button 
              type="submit" 
              variant="destructive" 
              disabled={revokeAllSessions.isPending}
            >
              {revokeAllSessions.isPending ? 'Memproses...' : 'Cabut semua sesi lain'}
            </Button>
          </form>
          
          {revokeStatus && (
            <p className={`text-xs ${revokeStatus.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
              {revokeStatus.text}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Riwayat Login</h4>
              <p className="text-xs text-muted-foreground">
                Jejak login 30 hari terakhir
              </p>
            </div>
            {historyQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr>
                  <th className="py-2">Login</th>
                  <th className="py-2">Logout</th>
                  <th className="py-2">IP</th>
                  <th className="py-2">Metode</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loginHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-muted-foreground">
                      Belum ada data
                    </td>
                  </tr>
                )}
                {loginHistory.map((history, index) => (
                  <tr key={`${history.login_at}-${history.ip_address}-${index}`} className="border-t">
                    <td className="py-2">{formatDate(history.login_at)}</td>
                    <td className="py-2">{formatDate(history.logout_at)}</td>
                    <td className="py-2">{history.ip_address || '-'}</td>
                    <td className="py-2 capitalize">{history.login_method || '-'}</td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        history.status === 'success' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {history.status || 'unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* History Pagination */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Halaman {historyPagination?.currentPage || 1} / {historyPagination?.lastPage || 1}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                disabled={(historyPagination?.currentPage || 1) === 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryPage((prev) => 
                  historyPagination?.lastPage 
                    ? Math.min(historyPagination.lastPage, prev + 1) 
                    : prev + 1
                )}
                disabled={!historyPagination || historyPagination.currentPage >= historyPagination.lastPage}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}