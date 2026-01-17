import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useBootstrapSession, useMe } from '@/services/authHooks'
import { clearTokens, getAccessToken, getRefreshToken } from '@/services/api'

export default function ProtectedRoute({ children }) {
  const location = useLocation()
  const bootstrap = useBootstrapSession()
  const hasToken = !!getAccessToken()
  const refreshToken = getRefreshToken()
  const { data, isLoading, isError, error, refetch } = useMe({ enabled: hasToken })

  if (!hasToken) {
    if (bootstrap.isRefreshing && refreshToken) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground">
          Memperpanjang sesi pengguna...
        </div>
      )
    }

    if (bootstrap.isError) {
      clearTokens()
      return <Navigate to="/login" replace state={{ from: location }} />
    }

    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground">
        Memeriksa sesi pengguna...
      </div>
    )
  }

  if (isError) {
    if (error?.response?.status === 401) {
      clearTokens()
      return <Navigate to="/login" replace state={{ from: location }} />
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6">
        <p className="text-sm text-muted-foreground">Gagal memuat sesi pengguna. Silakan coba lagi.</p>
        <Button onClick={() => refetch()} variant="default">Coba Lagi</Button>
      </div>
    )
  }

  const user = data?.data?.user
  if (!user) {
    clearTokens()
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}
