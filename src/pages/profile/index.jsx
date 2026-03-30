import React, { useState, useEffect, useMemo, useRef } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { User, Briefcase, Shield, FileText, Upload, Trash2, RefreshCcw } from 'lucide-react'
import Overview from './Overview'
import PersonalData from './PersonalData'
import Employment from './Employment'
import Security from './Security'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDeleteProfilePhoto, useProfile, useUploadProfilePhoto } from '@/services/profileHooks'

// ============ CONFIGURATION ============
const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''

const STORAGE_BASE = (explicitStorageBase || apiOrigin || proxyTarget || (import.meta.env.DEV ? 'http://localhost:8000' : runtimeFallback)).replace(/\/$/, '')

const PHOTO_OVERRIDE_KEY = 'iso_tik_profile_photo_override'
const PHOTO_VERSION_KEY = 'iso_tik_photo_version'

/**
 * Convert stored path to full URL
 * Handles various path formats:
 * - Full URL: http://localhost:8000/storage/...
 * - Absolute server path: /mnt/windows/.../public/storage/...
 * - Relative path: profile-photos/xxx/xxx.jpg
 */
const resolvePhotoUrl = (path, bypassCache = false) => {
  if (!path) return null
  
  // Get timestamp for cache busting
  let timestamp = Date.now()
  if (!bypassCache) {
    try {
      const storedVersion = localStorage.getItem(PHOTO_VERSION_KEY)
      if (storedVersion) {
        timestamp = storedVersion
      }
    } catch {
      // ignore
    }
  }
  
  // Case 1: Already a full URL (http:// or https://)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return `${path}${path.includes('?') ? '&' : '?'}_t=${timestamp}`
  }
  
  // Case 2: Absolute server path (Linux/macOS/Windows)
  const isAbsolutePath = path.startsWith('/mnt/') || 
                         path.startsWith('/home/') || 
                         path.startsWith('C:/') || 
                         path.startsWith('D:/') ||
                         path.startsWith('/Users/')
  
  if (isAbsolutePath) {
    // Extract relative path after 'public/storage/'
    const storageIndex = path.indexOf('public/storage/')
    if (storageIndex !== -1) {
      const relativePath = path.substring(storageIndex + 'public/storage/'.length)
      const base = STORAGE_BASE
      const fullUrl = `${base}/storage/${relativePath}`
      return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${timestamp}`
    }
    // Fallback: try to extract filename from absolute path
    const parts = path.split('/')
    const filename = parts[parts.length - 1]
    const folder = parts[parts.length - 2]
    if (filename && folder) {
      const fullUrl = `${STORAGE_BASE}/storage/profile-photos/${folder}/${filename}`
      return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${timestamp}`
    }
  }
  
  // Case 3: Relative path (profile-photos/xxx/xxx.jpg)
  // Remove leading slash if exists
  const cleanPath = path.startsWith('/') ? path.substring(1) : path
  
  // Build full URL
  let fullUrl
  if (cleanPath.startsWith('storage/')) {
    fullUrl = `${STORAGE_BASE}/${cleanPath}`
  } else if (cleanPath.startsWith('profile-photos/')) {
    fullUrl = `${STORAGE_BASE}/storage/${cleanPath}`
  } else {
    fullUrl = `${STORAGE_BASE}/storage/${cleanPath}`
  }
  
  // Add cache busting
  return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${timestamp}`
}

/**
 * Extract photo path from API response
 * Handles different response structures
 */
const extractPhotoPath = (payload) => {
  if (!payload) return null
  
  // Try different possible locations of photo_url
  if (payload.photo_url) return payload.photo_url
  if (payload.profile?.photo_url) return payload.profile.photo_url
  if (payload.data?.photo_url) return payload.data.photo_url
  if (payload.data?.profile?.photo_url) return payload.data.profile.photo_url
  if (payload.user?.photo_url) return payload.user.photo_url
  
  return null
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || '??'
}

export default function ProfilePage() {
  const [tab, setTab] = useState('overview')
  const location = useLocation()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const previewUrlRef = useRef(null)
  const [photoMessage, setPhotoMessage] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [photoOverride, setPhotoOverride] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [photoVersion, setPhotoVersion] = useState(() => {
    try {
      return localStorage.getItem(PHOTO_VERSION_KEY) || Date.now().toString()
    } catch {
      return Date.now().toString()
    }
  })

  const { data: profileData, isLoading, isError, refetch } = useProfile()
  
  const updatePhotoVersion = () => {
    const newVersion = Date.now().toString()
    setPhotoVersion(newVersion)
    try {
      localStorage.setItem(PHOTO_VERSION_KEY, newVersion)
    } catch {
      // ignore
    }
  }
  
  const uploadPhotoMutation = useUploadProfilePhoto({
    onSuccess: (data) => {
      const uploadedPath = data?.photo_url || data?.data?.photo_url
      
      if (uploadedPath) {
        setPhotoOverride(uploadedPath)
        updatePhotoVersion()
        try {
          localStorage.setItem(PHOTO_OVERRIDE_KEY, uploadedPath)
        } catch {
          // ignore
        }
      }
      setPhotoMessage('Foto profil berhasil diperbarui')
      
      setTimeout(() => {
        setPhotoMessage(null)
      }, 3000)
      
      setTimeout(() => {
        refetch()
        setTimeout(() => {
          resetPreview()
        }, 500)
      }, 1000)
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal mengunggah foto'
      setPhotoMessage(message)
      setIsUploading(false)
      resetPreview()
      
      setTimeout(() => {
        setPhotoMessage(null)
      }, 3000)
    },
  })
  
  const deletePhotoMutation = useDeleteProfilePhoto({
    onSuccess: () => {
      setPhotoMessage('Foto profil dihapus')
      setPhotoOverride(null)
      updatePhotoVersion()
      try {
        localStorage.removeItem(PHOTO_OVERRIDE_KEY)
      } catch {
        // ignore
      }
      refetch()
      resetPreview()
      
      setTimeout(() => {
        setPhotoMessage(null)
      }, 3000)
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal menghapus foto'
      setPhotoMessage(message)
      
      setTimeout(() => {
        setPhotoMessage(null)
      }, 3000)
    },
  })

  // Sync tab with ?tab= query param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('tab')
    if (q && ['overview', 'personal', 'employment', 'security'].includes(q)) {
      setTab(q)
    } else {
      setTab('overview')
      if (!params.get('tab')) {
        params.set('tab', 'overview')
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
      }
    }
  }, [location.pathname, location.search, navigate])

  // Extract photo path from profile data
  const currentPhotoPath = useMemo(() => {
    if (!profileData) return null
    return extractPhotoPath(profileData)
  }, [profileData])
  
  // Build avatar source with proper priority
  const avatarSrc = useMemo(() => {
    // 1. Preview lokal (saat upload)
    if (avatarPreview) return avatarPreview
    
    // 2. Photo override (setelah upload sukses)
    if (photoOverride) return resolvePhotoUrl(photoOverride, true)
    
    // 3. Photo dari server
    if (currentPhotoPath) return resolvePhotoUrl(currentPhotoPath, false)
    
    return null
  }, [avatarPreview, photoOverride, currentPhotoPath, photoVersion])

  // Compute display name
  const displayName = useMemo(() => {
    return (
      profileData?.profile?.full_name ||
      profileData?.name ||
      profileData?.username ||
      'Pengguna'
    )
  }, [profileData])

  // Compute faculty
  const faculty = useMemo(() => {
    return (
      profileData?.employment?.faculty ||
      profileData?.employment?.department ||
      profileData?.profile?.department ||
      'Unknown unit'
    )
  }, [profileData])

  // Load photo override from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PHOTO_OVERRIDE_KEY)
      const storedVersion = localStorage.getItem(PHOTO_VERSION_KEY)
      if (stored) {
        setPhotoOverride(stored)
      }
      if (storedVersion) {
        setPhotoVersion(storedVersion)
      }
    } catch {
      // ignore
    }
  }, [])

  // Reset error when source changes
  useEffect(() => {
    if (avatarSrc) {
      setAvatarError(false)
    }
  }, [avatarSrc])

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
        previewUrlRef.current = null
      }
    }
  }, [])

  const resetPreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setAvatarPreview(null)
    setAvatarError(false)
  }

  const forceRefreshPhoto = async () => {
    setPhotoMessage('Memuat ulang foto...')
    updatePhotoVersion()
    await refetch()
    setTimeout(() => {
      setPhotoMessage(null)
    }, 2000)
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
    setIsUploading(true)
    
    const objectUrl = URL.createObjectURL(file)
    
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    
    previewUrlRef.current = objectUrl
    setAvatarPreview(objectUrl)
    setAvatarError(false)
    
    try {
      await uploadPhotoMutation.mutateAsync(file)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!currentPhotoPath && !photoOverride) return
    
    setPhotoMessage(null)
    
    try {
      await deletePhotoMutation.mutateAsync()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  const navItemClass = (key) =>
    `flex items-center gap-3 px-3 py-2 rounded-md ${tab === key ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-slate-50'}`

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-sm text-muted-foreground">Memuat data profil...</div>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-600">Gagal memuat profil. Coba muat ulang.</p>
          <Button variant="outline" onClick={() => refetch()} className="w-fit flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" /> Muat ulang
          </Button>
        </div>
      )
    }

    return (
      <div>
        {tab === 'overview' && <Overview profileData={profileData} />}
        {tab === 'personal' && <PersonalData profileData={profileData} />}
        {tab === 'employment' && <Employment userId={profileData?.id} employment={profileData?.employment} />}
        {tab === 'security' && <Security preferences={profileData?.preferences} />}
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Left column */}
          <div className="w-72">
            <Card>
              <CardContent>
                <div className="flex flex-col items-center text-center gap-2">
                  <Avatar className="w-20 h-20">
                    {avatarSrc && !avatarError ? (
                      <AvatarImage
                        key={`avatar-${photoVersion}-${avatarSrc}`}
                        src={avatarSrc}
                        alt={displayName}
                        onError={() => setAvatarError(true)}
                        onLoad={() => setAvatarError(false)}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-100 text-slate-600">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-lg font-medium text-center line-clamp-2">{displayName}</div>
                  <div className="text-sm text-muted-foreground text-center">{faculty}</div>
                  <div className="mt-2">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full capitalize">
                      {profileData?.status || 'active'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isUploading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 justify-center"
                      onClick={handleSelectFile}
                      disabled={isUploading}
                    >
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Mengunggah...' : 'Ganti foto'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 justify-center text-red-600 hover:text-red-700"
                      onClick={handleDeletePhoto}
                      disabled={(!currentPhotoPath && !photoOverride) || deletePhotoMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletePhotoMutation.isPending ? 'Menghapus...' : 'Hapus foto'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 justify-center"
                      onClick={forceRefreshPhoto}
                    >
                      <RefreshCcw className="w-4 h-4" />
                      Refresh foto
                    </Button>
                    {photoMessage && (
                      <p className={`text-xs ${photoMessage.includes('berhasil') || photoMessage.includes('Memuat') ? 'text-green-600' : 'text-red-600'}`}>
                        {photoMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <nav className="flex flex-col gap-2">
                    <Link to="/profil?tab=overview" className={navItemClass('overview')}>
                      <User className="w-4 h-4" /> Overview
                    </Link>
                    <Link to="/profil?tab=personal" className={navItemClass('personal')}>
                      <FileText className="w-4 h-4" /> Personal Data
                    </Link>
                    <Link to="/profil?tab=employment" className={navItemClass('employment')}>
                      <Briefcase className="w-4 h-4" /> Employment
                    </Link>
                    <Link to="/profil?tab=security" className={navItemClass('security')}>
                      <Shield className="w-4 h-4" /> Security & Privacy
                    </Link>
                  </nav>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading-2 font-semibold">Profile</h2>
                <p className="text-body-md text-muted-foreground">Kelola informasi pribadi dan preferensi akun</p>
              </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}