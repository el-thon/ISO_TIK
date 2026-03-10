// routes/ProtectedRoute.jsx
import React, { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMe } from '@/services/authHooks'
import { getAccessToken } from '@/services/api'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const [isChecking, setIsChecking] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Cek token dari berbagai sumber
  const checkAuth = () => {
    // 1. Coba dari getAccessToken()
    let token = getAccessToken()
    
    // 2. Jika tidak ada, coba langsung dari localStorage
    if (!token) {
      token = localStorage.getItem('iso_tik_access_token')
      console.log('[ProtectedRoute] Token from direct localStorage:', !!token)
    }
    
    // 3. Cek user data di localStorage
    const userData = localStorage.getItem('user_data')
    let user = null
    try {
      user = userData ? JSON.parse(userData) : null
    } catch (e) {
      console.error('[ProtectedRoute] Error parsing user data:', e)
    }
    
    // Jika punya token DAN user data, anggap authorized
    if (token && user) {
      setIsAuthorized(true)
    } else {
      setIsAuthorized(false)
    }
    
    setIsChecking(false)
  }
  
  useEffect(() => {
    checkAuth()
  }, [location.pathname])
  
  // Gunakan useMe untuk validasi server-side (opsional)
  const { data: user, isLoading, isError } = useMe({ 
    enabled: isAuthorized, // Hanya jalankan jika sudah authorized dari localStorage
    retry: 1,
    staleTime: 1000 * 60 * 5, // 5 menit
    gcTime: 1000 * 60 * 10, // 10 menit
  })
  
  // Kasus 1: Masih checking awal (dari localStorage)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Memeriksa otorisasi...</p>
        </div>
      </div>
    )
  }
  
  // Kasus 2: Tidak authorized berdasarkan localStorage
  if (!isAuthorized) {
    // Redirect ke halaman root, bukan langsung ke login
    return <Navigate to="/" replace state={{ from: location }} />
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
      return children
    }
    
    // Jika token hilang, redirect ke root
    console.log('[ProtectedRoute] Token missing, redirecting to root')
    return <Navigate to="/" replace state={{ from: location }} />
  }
  
  // Kasus 5: Sukses - tampilkan halaman
  return children
}