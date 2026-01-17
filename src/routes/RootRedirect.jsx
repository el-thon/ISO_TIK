import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAccessToken, getRefreshToken } from '@/services/api'
import Login from '@/pages/auth/index'

/**
 * RootRedirect component
 * Handles automatic redirect logic for root path (/)
 * - If user has valid tokens -> redirect to /dashboard
 * - If user has no tokens -> show Login page
 */
export default function RootRedirect() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const accessToken = getAccessToken()
    const refreshToken = getRefreshToken()

    // If user has tokens, redirect to dashboard
    if (accessToken || refreshToken) {
      navigate('/dashboard', { replace: true })
    } else {
      // No tokens, allow login page to render
      setIsChecking(false)
    }
  }, [navigate])

  // While checking tokens, show nothing (or a loader if you want)
  if (isChecking) {
    return null // or return <LoadingSpinner />
  }

  // If no tokens, render the Login page
  return <Login />
}
