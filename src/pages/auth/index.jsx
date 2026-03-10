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
import React, { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Label } from '@/components/ui/label'
import AuthLayout from './AuthLayout'
import { useLogin } from '@/services/authHooks'

function Login() {
  const REMEMBER_KEY = import.meta.env.VITE_REMEMBER_KEY || 'iso_tik_remember_me'
  const REMEMBER_USERNAME_KEY = import.meta.env.VITE_REMEMBER_USERNAME_KEY || 'iso_tik_remember_username'

  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) === 'true')
  const [username, setUsername] = useState(() => localStorage.getItem(REMEMBER_USERNAME_KEY) || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const { mutate: loginMutate, isLoading: isLoginLoading, error: loginError } = useLogin({
    onSuccess: (data) => {
      
      // Verifikasi data tersimpan di localStorage
      const token = localStorage.getItem('iso_tik_access_token')
      const userData = localStorage.getItem('user_data')

      // Gunakan setTimeout untuk memastikan semua state ter-update
      setTimeout(() => {
        navigate('/beranda', { 
          replace: true,
          state: { fromLogin: true }
        })
      }, 100) // Delay kecil untuk keamanan
    }
  })

  // Cek apakah sudah login, redirect otomatis
  useEffect(() => {
    const token = localStorage.getItem('iso_tik_access_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      navigate('/beranda', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    if (!remember) {
      localStorage.removeItem(REMEMBER_USERNAME_KEY)
      localStorage.setItem(REMEMBER_KEY, 'false')
    }
  }, [remember])

  const onSubmitCredentials = (e) => {
    e.preventDefault()


    if (remember) {
      localStorage.setItem(REMEMBER_KEY, 'true')
      localStorage.setItem(REMEMBER_USERNAME_KEY, username)
    } else {
      localStorage.setItem(REMEMBER_KEY, 'false')
      localStorage.removeItem(REMEMBER_USERNAME_KEY)
    }

    loginMutate({ username, password })
  }

  return (
    <AuthLayout title="Sistem Internal TIK" subtitle="Universitas">
      <Card className="w-full">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-heading-3 font-semibold">Masuk</CardTitle>
          <CardDescription className="text-body-md text-muted-foreground">
            Masuk menggunakan username dan kata sandi Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={onSubmitCredentials} className="flex flex-col gap-4 border border-border rounded-lg p-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="username" className="text-small text-foreground">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="contoh: alice"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="text-body-md"
                required
                autoComplete="username"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-small text-foreground">Kata Sandi</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="masukkan kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-body-md pr-10"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(value) => setRemember(Boolean(value))}
                />
                <Label htmlFor="remember" className="text-small text-muted-foreground">
                  Ingat Saya
                </Label>
              </div>
              <Link to="/auth/lupa-password" className="text-sm text-primary hover:underline">
                Lupa kata sandi?
              </Link>
            </div>

            {loginError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {loginError?.response?.data?.message || 
                 loginError?.message || 
                 'Gagal masuk. Periksa kembali username dan password Anda.'}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isLoginLoading} 
              className="w-full text-body-md bg-black hover:opacity-80 text-white hover:bg-navy-hover"
            >
              {isLoginLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <div>UPA TIK Universitas Lampung</div>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}

export default Login