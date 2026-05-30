import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { getAccessToken, getRefreshToken } from '@/services/api'

/**
 * Komponen RootRedirect
 * Menangani logika pengalihan otomatis untuk jalur root (/)
 */
export default function RootRedirect() {
  const accessToken = getAccessToken()
  const refreshToken = getRefreshToken()

  // Log untuk debugging
  useEffect(() => {
    console.log('[RootRedirect]', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
    })
  }, [accessToken, refreshToken])

  // Jika punya token, langsung ke beranda
  if (accessToken || refreshToken) {
    console.log('[RootRedirect] Has token, redirecting to /beranda')
    return <Navigate to="/beranda" replace />
  }

  // Tidak punya token, langsung ke login
  console.log('[RootRedirect] No token, redirecting to /login')
  return <Navigate to="/login" replace />
}