import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import React, { useMemo, useState } from 'react'
import { Label } from '@/components/ui/label'
import AuthLayout from './AuthLayout'
import { useLogin, useSsoLogin } from '@/services/authHooks'

function Login() {
  const [activeMode, setActiveMode] = useState(null) // 'sso' | 'credentials' | null
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [state, setState] = useState('')
  const [codeVerifier, setCodeVerifier] = useState('')
  const navigate = useNavigate()

  const { mutate: loginMutate, isLoading: isLoginLoading, error: loginError } = useLogin({
    onSuccess: () => {
      navigate('/dashboard')
    },
  })

  const { mutate: ssoMutate, isLoading: isSsoLoading, error: ssoError } = useSsoLogin({
    onSuccess: () => {
      navigate('/dashboard')
    },
  })

  const isBusy = useMemo(() => isLoginLoading || isSsoLoading, [isLoginLoading, isSsoLoading])

  const onSubmitCredentials = (e) => {
    e.preventDefault()
    loginMutate({ username, password })
  }

  const onSubmitSso = (e) => {
    e.preventDefault()
    ssoMutate({ auth_code: authCode, state, code_verifier: codeVerifier || undefined, provider: 'campus_sso' })
  }

  return (
    <AuthLayout title="Sistem Internal TIK" subtitle="Universitas">
      <Card className="w-full">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-heading-3 font-semibold">Sign In</CardTitle>
          <CardDescription className="text-body-md text-muted-foreground">Pilih metode autentikasi Anda</CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-col gap-3">
            <Button
              variant="default"
              className="w-full bg-black hover:bg-neutral-800 text-white"
              onClick={() => setActiveMode((prev) => (prev === 'sso' ? null : 'sso'))}
              disabled={isBusy}
            >
              <span className="text-body-md font-semibold">Sign in with Campus SSO</span>
            </Button>

            <div className="relative flex items-center justify-center text-xs text-muted-foreground">
              <span className="px-2 bg-white">or</span>
              <div className="absolute inset-x-0 h-px bg-border" />
            </div>

            <Button
              variant="outline"
              className="w-full text-body-md border-black text-black hover:bg-black hover:text-white"
              onClick={() => setActiveMode((prev) => (prev === 'credentials' ? null : 'credentials'))}
              disabled={isBusy}
            >
              Use Email &amp; Password
            </Button>
          </div>

          {activeMode === 'sso' && (
            <form onSubmit={onSubmitSso} className="flex flex-col gap-4 border border-border rounded-lg p-4 bg-slate-50/60">
              <div className="space-y-1">
                <Label htmlFor="auth_code" className="text-small text-foreground">Auth Code</Label>
                <Input
                  id="auth_code"
                  name="auth_code"
                  type="text"
                  placeholder="kode dari SSO"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  required
                  className="text-body-md"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="state" className="text-small text-foreground">State</Label>
                <Input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="state dari redirect"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  required
                  className="text-body-md"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="code_verifier" className="text-small text-foreground">Code Verifier (opsional)</Label>
                <Input
                  id="code_verifier"
                  name="code_verifier"
                  type="text"
                  placeholder="jika PKCE diperlukan"
                  value={codeVerifier}
                  onChange={(e) => setCodeVerifier(e.target.value)}
                  className="text-body-md"
                />
              </div>

              {ssoError && (
                <div className="text-sm text-destructive">{ssoError?.response?.data?.message || ssoError?.message || 'Gagal login SSO'}</div>
              )}

              <Button
                type="submit"
                disabled={isSsoLoading}
                className="w-full text-body-md bg-black hover:bg-neutral-800 text-white"
              >
                {isSsoLoading ? 'Memproses...' : 'Lanjutkan SSO'}
              </Button>
            </form>
          )}

          {activeMode === 'credentials' && (
            <form onSubmit={onSubmitCredentials} className="flex flex-col gap-4 border border-border rounded-lg p-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="username" className="text-small text-foreground">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="mis. alice"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-body-md"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-small text-foreground">Kata Sandi</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-body-md"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" disabled />
                  <Label htmlFor="remember" className="text-small text-muted-foreground">Ingat Saya</Label>
                </div>
                <Link to="/auth/forgot" className="text-sm text-primary hover:underline">Lupa kata sandi?</Link>
              </div>

              {loginError && (
                <div className="text-sm text-destructive">{loginError?.response?.data?.message || loginError?.message || 'Gagal masuk'}</div>
              )}

              <Button type="submit" disabled={isLoginLoading} className="w-full text-body-md bg-black hover:opacity-80 text-white hover:bg-navy-hover">
                {isLoginLoading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <div>Protected by enterprise-grade security</div>
          <div>© 2024 Universitas. All rights reserved.</div>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

export default Login