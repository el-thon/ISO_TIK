// routes/ProtectedRoute.jsx
import React, { useEffect, useMemo, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/hooks/useAuth'
import { getAccessToken } from '@/services/api'
import { getUserData } from '@/utils/auth'
import { toast } from '@/components/ui/use-toast'

const isUserAdmin = (userData) => {
  if (!userData) return false

  const roles = userData?.roles ||
    userData?.data?.roles ||
    userData?.data?.user?.roles ||
    []

  return roles.includes('admin') ||
    roles.includes('administrator') ||
    userData?.role === 'admin' ||
    userData?.is_admin === true ||
    userData?.data?.is_admin === true
}

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const location = useLocation()
  const hasShownExpiredToast = useRef(false)

  // Derive auth state synchronously from localStorage.
  // This avoids calling setState inside an effect (react-hooks/set-state-in-effect).
  const authState = useMemo(() => {
    let token = getAccessToken()

    if (!token) {
      token = localStorage.getItem('iso_tik_access_token')
    }

    const storedUser = getUserData()
    const isAuthorized = Boolean(token && storedUser)
    const isAdmin = isAuthorized ? isUserAdmin(storedUser) : false

    return {
      token,
      storedUser,
      isAuthorized,
      isAdmin,
    }
  }, [location.pathname])
  
  // Gunakan useMe untuk validasi server-side (opsional)
  const { isLoading, isError } = useMe({
    enabled: authState.isAuthorized, // Hanya jalankan jika sudah authorized dari localStorage
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 10, // 10 menit
  })

  useEffect(() => {
    if (!isError) return
    const token = localStorage.getItem('iso_tik_access_token')
    const userData = localStorage.getItem('user_data')
    if (!token || !userData) {
      if (!hasShownExpiredToast.current) {
        toast({
          variant: 'destructive',
          title: 'Sesi berakhir',
          description: 'Access token sudah kedaluwarsa. Silakan login kembali.',
        })
        hasShownExpiredToast.current = true
      }
    }
  }, [isError])
  
  // Kasus 2: Tidak authorized berdasarkan localStorage
  if (!authState.isAuthorized) {
    // Redirect ke halaman root, bukan langsung ke login
    return <Navigate to="/" replace state={{ from: location }} />
  }

  if (requireAdmin && !authState.isAdmin) {
    return <Navigate to="/beranda" replace state={{ from: location }} />
  }
  
  // Kasus 3: Authorized, tapi sedang fetch user (opsional)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Memuat data pengguna...</p>
        </div>
      </div>
    )
  }
  
  // Kasus 4: Error di useMe - tapi kita sudah punya data dari localStorage
  // Ini bisa terjadi karena token expired atau masalah network
  if (isError) {
    console.log('[ProtectedRoute] Error fetching user, checking token validity...')
    
    // Cek ulang token di localStorage
    const token = localStorage.getItem('iso_tik_access_token')
    const userData = localStorage.getItem('user_data')
    
    // Jika token masih ada, mungkin hanya error network, tetap lanjutkan
    if (token && userData) {
      console.log('[ProtectedRoute] Token still exists, proceeding with cached data')
      if (requireAdmin) {
        let cachedUser = null
        try {
          cachedUser = JSON.parse(userData)
        } catch {
          cachedUser = null
        }
        if (!isUserAdmin(cachedUser)) {
          return <Navigate to="/beranda" replace state={{ from: location }} />
        }
      }
      return children
    }
    
    // Jika token hilang, redirect ke root
    console.log('[ProtectedRoute] Token missing, redirecting to root')
    return <Navigate to="/" replace state={{ from: location }} />
  }
  
  // Kasus 5: Sukses - tampilkan halaman
  return children
}