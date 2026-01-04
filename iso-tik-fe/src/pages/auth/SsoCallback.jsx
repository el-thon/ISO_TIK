import React, { useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AuthLayout from './AuthLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useSsoLogin } from '@/services/authHooks'

function SsoCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const auth_code = searchParams.get('code') || searchParams.get('auth_code')
  const state = searchParams.get('state')
  const code_verifier = searchParams.get('code_verifier') || undefined
  const provider = searchParams.get('provider') || 'campus_sso'

  const { mutate, isLoading, error, data, isSuccess } = useSsoLogin({
    onSuccess: () => {
      navigate('/dashboard')
    },
  })

  const missingParams = useMemo(() => !auth_code || !state, [auth_code, state])

  useEffect(() => {
    if (missingParams) return
    mutate({ auth_code, state, code_verifier, provider })
  }, [auth_code, state, code_verifier, provider, missingParams, mutate])

  return (
    <AuthLayout title="Sistem Internal TIK" subtitle="Universitas">
      <Card className="w-full">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-heading-4 font-semibold">Memproses SSO</CardTitle>
          <CardDescription>Mohon tunggu, kami sedang memverifikasi login SSO Anda.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {missingParams && (
            <div className="text-sm text-destructive text-center">
              Parameter SSO tidak lengkap. Pastikan redirect menyertakan <code>code</code> dan <code>state</code>.
            </div>
          )}

          {!missingParams && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className={`h-5 w-5 animate-spin ${isSuccess ? 'hidden' : ''}`} />
              <span>{isLoading ? 'Menghubungkan ke SSO...' : isSuccess ? 'Berhasil, mengarahkan...' : 'Menyiapkan sesi...'}</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive text-center">
              {error?.response?.data?.message || error?.message || 'Gagal memproses login SSO'}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/login')}>
              Kembali ke Login
            </Button>
            {missingParams && (
              <Button onClick={() => mutate({ auth_code: auth_code || '', state: state || '', code_verifier, provider })} disabled={!auth_code || !state}>
                Coba Lagi
              </Button>
            )}
          </div>

          {data?.user && (
            <div className="text-xs text-muted-foreground text-center">
              Masuk sebagai <span className="font-semibold text-foreground">{data.user.username || data.user.full_name || data.user.email}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default SsoCallback
