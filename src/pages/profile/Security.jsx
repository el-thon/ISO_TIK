import React, { useMemo, useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useChangePassword,
  useLoginHistory,
  useRevokeAllSessions,
  useRevokeSession,
  useSessions,
  useSignature,
  useUploadSignature,
  useDeleteSignature,
  useDownloadSignature,
  getSignatureUrl,
  hasSignature,
} from '@/services/profileHooks'
import { Loader2, ImageIcon, Download, Trash2, Upload } from 'lucide-react'

// ==================== UTILS ====================
const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

// ==================== SIGNATURE SECTION WITH PREVIEW ====================
const SignatureSection = ({ 
  signatureUrl,
  hasSig,
  onUpload,
  onDownload,
  onDelete,
  isUploading,
  isDownloading,
  isDeleting,
  status 
}) => {
  const fileInputRef = useRef(null)
  const [previewError, setPreviewError] = useState(false)
  
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
  }
  
  const handleSelectClick = () => {
    fileInputRef.current?.click()
  }
  
  return (
    <Card key={signatureUrl || 'no-signature'}>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-medium">Tanda Tangan Digital</h4>
            <p className="text-xs text-muted-foreground">Kelola unggahan tanda tangan Anda</p>
          </div>
        </div>

        {!hasSig && (
          <div className="mb-3 text-xs text-amber-600 bg-amber-50 p-2 rounded-md">
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
          {/* PREVIEW AREA - Menampilkan gambar signature */}
          <div className="md:col-span-2 border rounded-lg bg-white min-h-40 flex flex-col items-center justify-center p-4">
            {hasSig && signatureUrl && !previewError ? (
              <div className="w-full">
                <img
                  src={signatureUrl}
                  alt="Tanda Tangan"
                  className="max-h-32 max-w-full object-contain mx-auto border border-slate-200 rounded-md p-2 bg-white"
                  onError={() => setPreviewError(true)}
                />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Tanda tangan aktif
                </p>
              </div>
            ) : hasSig && previewError ? (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Gambar tidak dapat dimuat
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-xs mt-1"
                  onClick={onDownload}
                >
                  Coba unduh
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Belum ada tanda tangan
                </p>
              </div>
            )}
          </div>
          
          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-2 justify-start">
            <Button 
              variant="outline" 
              onClick={handleSelectClick} 
              disabled={isUploading}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Mengunggah...' : 'Unggah Tanda Tangan'}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onDownload} 
              disabled={isDownloading || !hasSig}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? 'Mengunduh...' : 'Unduh'}
            </Button>
            
            <Button 
              variant="ghost" 
              className="text-red-600 hover:text-red-700 flex items-center gap-2" 
              onClick={onDelete} 
              disabled={isDeleting || !hasSig}
            >
              <Trash2 className="w-4 h-4" />
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
            
            {status && (
              <p className={`text-xs ${status.type === 'success' ? 'text-emerald-600' : 'text-red-600'} text-center mt-2`}>
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
export default function Security() {
  // Pagination states
  const [sessionsPage, setSessionsPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)
  
  // Queries
  const sessionsQuery = useSessions({ page: sessionsPage, per_page: 5 })
  const historyQuery = useLoginHistory({ page: historyPage, per_page: 5 })
  const signatureQuery = useSignature()
  
  // Signature state
  const [signatureStatus, setSignatureStatus] = useState(null)
  // Local signature URL state - derived directly from backend payload to
  // ensure the UI uses the canonical file path (no client cache) after a
  // full page refresh. This avoids reliance on ephemeral object URLs.
  const [localSignatureUrl, setLocalSignatureUrl] = useState(null)
  
  // Forms
  const changePasswordForm = useForm({
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  })

  // Mutations
  const changePassword = useChangePassword()
  const revokeSession = useRevokeSession()
  const revokeAllSessions = useRevokeAllSessions()
  const uploadSignature = useUploadSignature()
  const deleteSignature = useDeleteSignature()
  const downloadSignature = useDownloadSignature()

  // UI States
  const [passwordStatus, setPasswordStatus] = useState(null)
  const [revokeStatus, setRevokeStatus] = useState(null)

  // ========== SIGNATURE HANDLING (Menggunakan utilities dari profileHooks) ==========
  const signatureData = signatureQuery.data || {}

  // Derive signature URL and presence from backend data. We also mirror the
  // computed URL into a local state so that a full page reload will immediately
  // display the backend-provided path (no cache/override required).
  const computedSignatureUrl = useMemo(() => getSignatureUrl(signatureData), [signatureData])
  const hasSig = useMemo(() => hasSignature(signatureData), [signatureData])

  useEffect(() => {
    setLocalSignatureUrl(computedSignatureUrl)
  }, [computedSignatureUrl])

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
        text: 'Hanya file gambar (PNG/JPG) yang diperbolehkan' 
      })
      return
    }

    try {
      const res = await uploadSignature.mutateAsync(file)
      setSignatureStatus({ 
        type: 'success', 
        text: 'Tanda tangan berhasil diunggah' 
      })
      
      // Refetch untuk mendapatkan data terbaru
      await signatureQuery.refetch()
      // If backend returned a canonical URL, prefer that immediately
  const returnedSig = res?.signature || res?.data?.signature || res
  // Ensure getSignatureUrl can extract the signature object by wrapping it
  const immediateUrl = returnedSig ? getSignatureUrl({ signature: returnedSig }) : null
      if (immediateUrl) setLocalSignatureUrl(immediateUrl)
      
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal mengunggah tanda tangan'
      setSignatureStatus({ type: 'error', text: message })
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
        
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
        
        setSignatureStatus({ 
          type: 'success', 
          text: 'Tanda tangan berhasil diunduh' 
        })
      } else {
        throw new Error('No blob data received')
      }
    } catch (error) {
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
      
      setSignatureStatus({ 
        type: 'success', 
        text: 'Tanda tangan berhasil dihapus' 
      })
      
      await signatureQuery.refetch()
      // Clear local URL so UI updates immediately
      setLocalSignatureUrl(null)
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal menghapus tanda tangan'
      setSignatureStatus({ type: 'error', text: message })
    }
  }

  // ========== PASSWORD HANDLER ==========
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

  // ========== REVOKE ALL SESSIONS HANDLER ==========
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
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal mencabut sesi'
      setRevokeStatus({ type: 'error', text: message })
    }
  }

  // ========== REVOKE SINGLE SESSION HANDLER ==========
  const handleRevokeSession = async (sessionId) => {
    try {
      await revokeSession.mutateAsync({ sessionId })
      sessionsQuery.refetch()
      setRevokeStatus({ 
        type: 'success', 
        text: 'Sesi berhasil dicabut' 
      })
      setTimeout(() => setRevokeStatus(null), 3000)
    } catch (error) {
      setRevokeStatus({ 
        type: 'error', 
        text: error?.response?.data?.message || 'Gagal mencabut sesi' 
      })
      setTimeout(() => setRevokeStatus(null), 3000)
    }
  }

  // Pagination data
  const sessions = sessionsQuery.data?.items ?? []
  const sessionPagination = sessionsQuery.data?.pagination
  const loginHistory = historyQuery.data?.items ?? []
  const historyPagination = historyQuery.data?.pagination

  return (
    <div className="space-y-6">
      {/* Security Status Card */}
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium">Security & Privacy</h3>
              <p className="text-sm text-muted-foreground">
                Kelola password dan sesi akun
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {/* Change Password Form */}
            <form 
              onSubmit={changePasswordForm.handleSubmit(handlePasswordSubmit)} 
              className="border rounded-lg p-4 space-y-3 w-full"
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

      {/* Signature Section WITH PREVIEW */}
      <SignatureSection
        signatureUrl={localSignatureUrl}
        hasSig={hasSig}
        onUpload={handleUploadSignature}
        onDownload={handleDownloadSignature}
        onDelete={handleDeleteSignature}
        isUploading={uploadSignature.isPending}
        isDownloading={downloadSignature.isPending}
        isDeleting={deleteSignature.isPending}
        status={signatureStatus}
      />

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
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Cabut
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Session Pagination */}
          {sessionPagination && sessionPagination.lastPage > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Halaman {sessionPagination.currentPage} / {sessionPagination.lastPage}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionsPage((prev) => Math.max(1, prev - 1))}
                  disabled={sessionPagination.currentPage === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSessionsPage((prev) => 
                    Math.min(sessionPagination.lastPage, prev + 1)
                  )}
                  disabled={sessionPagination.currentPage === sessionPagination.lastPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}

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
          {historyPagination && historyPagination.lastPage > 1 && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Halaman {historyPagination.currentPage} / {historyPagination.lastPage}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
                  disabled={historyPagination.currentPage === 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryPage((prev) => 
                    Math.min(historyPagination.lastPage, prev + 1)
                  )}
                  disabled={historyPagination.currentPage === historyPagination.lastPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}