import React, { useState, useEffect, useMemo, useRef } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Edit3, User, Briefcase, Shield, FileText, Upload, Trash2, RefreshCcw } from 'lucide-react'
import Overview from './Overview'
import PersonalData from './PersonalData'
import Employment from './Employment'
import Security from './Security'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDeleteProfilePhoto, useProfile, useUploadProfilePhoto } from '@/services/profileHooks'

const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
const apiOrigin = rawApiBase ? rawApiBase.replace(/\/api\/?.*$/, '') : ''
const proxyTarget = (import.meta.env.VITE_PROXY_TARGET || '').trim()
const explicitStorageBase = (import.meta.env.VITE_STORAGE_BASE_URL || '').trim()
const runtimeFallback = typeof window !== 'undefined' ? window.location.origin : ''

const STORAGE_BASE = (explicitStorageBase || apiOrigin || proxyTarget || (import.meta.env.DEV ? 'http://localhost:8000' : runtimeFallback)).replace(/\/$/, '')

const PHOTO_OVERRIDE_KEY = 'iso_tik_profile_photo_override'

const resolvePhotoUrl = (path) => {
  if (!path) return null
  
  if (path.startsWith('http')) {
    // Cache busting untuk mencegah browser menggunakan cached image
    return `${path}${path.includes('?') ? '&' : '?'}_=${Date.now()}`
  }
  
  const base = STORAGE_BASE
  if (!base) {
    return path.startsWith('/') ? `${path}?_=${Date.now()}` : `/${path}?_=${Date.now()}`
  }
  
  // Tambahkan timestamp untuk cache busting
  const separator = path.includes('?') ? '&' : '?'
  return `${base}${path.startsWith('/') ? path : `/${path}`}${separator}_=${Date.now()}`
}

const extractPhotoPath = (payload) => {
  if (!payload) return null
  if (payload.photo_url) return payload.photo_url
  if (payload.profile && payload.profile.photo_url) return payload.profile.photo_url
  if (payload.data?.photo_url) return payload.data.photo_url
  if (payload.data?.profile?.photo_url) return payload.data.profile.photo_url
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
  const pendingServerPhotoRef = useRef(null)
  const [photoMessage, setPhotoMessage] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [photoOverride, setPhotoOverride] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const { data: profileData, isLoading, isError, refetch } = useProfile()
  const uploadPhotoMutation = useUploadProfilePhoto({
    onSuccess: (data) => {
      const uploadedPath = extractPhotoPath(data)
      if (uploadedPath) {
        setPhotoOverride(uploadedPath)
        try {
          localStorage.setItem(PHOTO_OVERRIDE_KEY, uploadedPath)
        } catch {
          // ignore storage errors
        }
      }
      setPhotoMessage('Foto profil berhasil diperbarui')
      // Set timeout untuk memberi waktu server memproses file
      setTimeout(() => {
        refetch()
      }, 1000)
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal mengunggah foto'
      setPhotoMessage(message)
      setIsUploading(false)
    },
  })
  
  const deletePhotoMutation = useDeleteProfilePhoto({
    onSuccess: () => {
      setPhotoMessage('Foto profil dihapus')
      setPhotoOverride(null)
      try {
        localStorage.removeItem(PHOTO_OVERRIDE_KEY)
      } catch {
        // ignore storage errors
      }
      refetch()
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal menghapus foto'
      setPhotoMessage(message)
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

  const currentPhotoPath = extractPhotoPath(profileData)
  const resolvedPhoto = resolvePhotoUrl(currentPhotoPath)
  const resolvedOverride = resolvePhotoUrl(photoOverride)
  
  // Urutan prioritas: avatarPreview > photoOverride (local) > resolvedPhoto (API)
  const avatarSrc = avatarPreview || resolvedOverride || resolvedPhoto

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PHOTO_OVERRIDE_KEY)
      if (stored) {
        setPhotoOverride(stored)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    if (!currentPhotoPath) return
    setPhotoOverride(null)
    try {
      localStorage.removeItem(PHOTO_OVERRIDE_KEY)
    } catch {
      // ignore storage errors
    }
  }, [currentPhotoPath])

  const displayName = useMemo(() => {
    return (
      profileData?.profile?.full_name ||
      profileData?.name ||
      profileData?.username ||
      'Pengguna'
    )
  }, [profileData])

  const faculty =
    profileData?.employment?.faculty ||
    profileData?.employment?.department ||
    profileData?.profile?.department ||
    'Unknown unit'

  // Reset error ketika source berubah
  useEffect(() => {
    if (avatarSrc) {
      setAvatarError(false)
    }
  }, [avatarSrc])

  // Cleanup object URL
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
    setPhotoOverride(null)
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
    
    // 1. Buat preview dari file lokal
    const objectUrl = URL.createObjectURL(file)
    
    // Cleanup preview sebelumnya
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }
    
    previewUrlRef.current = objectUrl
    setAvatarPreview(objectUrl)
    setAvatarError(false)
    setPhotoOverride(null)
    
    try {
      // 2. Upload ke server
      await uploadPhotoMutation.mutateAsync(file)
      
      // 3. Setelah upload sukses, pertahankan preview lokal
      // Biarkan user tetap melihat preview sampai mereka navigate
      
    } catch {
      // Jika error, tetap pertahankan preview agar user bisa melihat
      // Hanya tampilkan pesan error
    } finally {
      setIsUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!extractPhotoPath(profileData)) return
    
    setPhotoMessage(null)
    
    try {
      await deletePhotoMutation.mutateAsync()
      resetPreview()
      pendingServerPhotoRef.current = null
    } catch {
      // ignore delete error
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
                        src={avatarSrc}
                        alt={displayName}
                        onError={(e) => {
                          setAvatarError(true)
                          // Fallback ke initials jika gambar gagal load
                          e.target.style.display = 'none'
                        }}
                        onLoad={() => {
                          setAvatarError(false)
                        }}
                        className="object-cover"
                      />
                    ) : null}
                    <AvatarFallback className="bg-slate-100">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-lg font-medium text-center line-clamp-2">{displayName}</div>
                  <div className="text-sm text-muted-foreground text-center">{faculty}</div>
                  <div className="mt-2">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full capitalize">{profileData?.status || 'active'}</span>
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
                      className="flex items-center gap-2 justify-center text-red-600"
                      onClick={handleDeletePhoto}
                      disabled={!extractPhotoPath(profileData) || deletePhotoMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletePhotoMutation.isPending ? 'Menghapus...' : 'Hapus foto'}
                    </Button>
                    {photoMessage && (
                      <p className={`text-xs ${photoMessage.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
                        {photoMessage}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <nav className="flex flex-col gap-2">
                    <Link to="/profile?tab=overview" className={navItemClass('overview')}>
                      <User className="w-4 h-4" /> Overview
                    </Link>
                    <Link to="/profile?tab=personal" className={navItemClass('personal')}>
                      <FileText className="w-4 h-4" /> Personal Data
                    </Link>
                    <Link to="/profile?tab=employment" className={navItemClass('employment')}>
                      <Briefcase className="w-4 h-4" /> Employment
                    </Link>
                    <Link to="/profile?tab=security" className={navItemClass('security')}>
                      <Shield className="w-4 h-4" /> Security & Privacy
                    </Link>
                  </nav>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading-2 font-semibold">Profile</h2>
                <p className="text-body-md text-muted-foreground">Kelola informasi pribadi dan preferensi akun</p>
              </div>
              <div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit
                </Button>
              </div>
            </div>

            {renderContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}