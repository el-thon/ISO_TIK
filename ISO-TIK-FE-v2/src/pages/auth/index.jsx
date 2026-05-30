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
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import AuthLayout from './AuthLayout'
import { useLogin, useResendLoginOtp } from '@/hooks/useAuth'

function Login() {
  const REMEMBER_KEY = import.meta.env.VITE_REMEMBER_KEY || 'iso_tik_remember_me'
  const REMEMBER_USERNAME_KEY = import.meta.env.VITE_REMEMBER_USERNAME_KEY || 'iso_tik_remember_username'
  const LOGIN_ONCE_KEY = 'iso_tik_has_logged_in_once'

  const [remember, setRemember] = useState(() => localStorage.getItem(REMEMBER_KEY) === 'true')
  const [username, setUsername] = useState(() => localStorage.getItem(REMEMBER_USERNAME_KEY) || '')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [otpStep, setOtpStep] = useState(false)
  const [otpDelivery, setOtpDelivery] = useState(null)
  const [otpError, setOtpError] = useState('')
  const [otpInfo, setOtpInfo] = useState('')
  const [otpAttemptsRemaining, setOtpAttemptsRemaining] = useState(null)
  const [otpMaxAttempts, setOtpMaxAttempts] = useState(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const otpInputRef = useRef(null)
  const navigate = useNavigate()

  const { mutate: loginMutate, isLoading: isLoginLoading, error: loginError } = useLogin({
    onSuccess: (data) => {
      if (data?.otp_required) {
        setOtpStep(true)
        setOtpDelivery(data?.otp_sent_to || data?.otp_delivery || data?.email || null)
        setOtp('')
        setOtpError('')
        setOtpInfo('')
        setOtpAttemptsRemaining(data?.otp_attempts_remaining ?? null)
        setOtpMaxAttempts(data?.otp_max_attempts ?? null)
        return
      }

      const userName =
        data?.user?.name ||
        data?.user?.full_name ||
        data?.user?.username ||
        username ||
        'Pengguna'

      const hasLoggedInBefore = localStorage.getItem(LOGIN_ONCE_KEY) === 'true'
      const welcomeMessage = hasLoggedInBefore
        ? `Selamat datang kembali ${userName}`
        : `Selamat datang ${userName}`

      sessionStorage.setItem('iso_tik_login_welcome_message', welcomeMessage)
      localStorage.setItem(LOGIN_ONCE_KEY, 'true')

      navigate('/beranda', {
        replace: true,
        state: { fromLogin: true },
      })
    }
  })

  const { mutate: resendOtp, isLoading: isResendLoading } = useResendLoginOtp({
    onSuccess: (data) => {
      if (data?.otp_required) {
        setOtpDelivery(data?.otp_sent_to || data?.otp_delivery || data?.email || null)
      }
      setOtpAttemptsRemaining(data?.otp_attempts_remaining ?? otpAttemptsRemaining)
      setOtpMaxAttempts(data?.otp_max_attempts ?? otpMaxAttempts)
      setOtpInfo('OTP baru sudah dikirim ke email Anda.')
      setResendCooldown(60)
    },
    onError: (error) => {
      const message = error?.response?.data?.message || error?.message || 'Gagal mengirim ulang OTP. Coba lagi nanti.'
      toast({ variant: 'destructive', title: 'Gagal Kirim Ulang OTP', description: message })
    },
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
  }, [remember, REMEMBER_KEY, REMEMBER_USERNAME_KEY])

  useEffect(() => {
    if (loginError) {
      const rawMessage = loginError?.response?.data?.message || loginError?.message || 'Gagal masuk. Periksa kembali username dan password Anda.'
      const lowerRawMessage = String(rawMessage).toLowerCase()
      const message =
        lowerRawMessage.includes('invalid credentials') ||
        lowerRawMessage.includes('invalid credential')
          ? 'Kredensial tidak sesuai.'
          : rawMessage
      toast({ variant: 'destructive', title: 'Autentikasi Gagal', description: message })
    }
  }, [loginError])

  useEffect(() => {
    if (!resendCooldown) return
    const timer = setInterval(() => {
      setResendCooldown((value) => (value > 1 ? value - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const onSubmitCredentials = (e) => {
    e.preventDefault()

    if (otpStep) {
      const normalizedOtp = otp.replace(/\D/g, '').slice(0, 6)
      if (normalizedOtp.length !== 6) {
        setOtpError('Kode OTP harus 6 digit.')
        return
      }
      setOtp(normalizedOtp)
    }

    setOtpInfo('')

    if (remember) {
      localStorage.setItem(REMEMBER_KEY, 'true')
      localStorage.setItem(REMEMBER_USERNAME_KEY, username)
    } else {
      localStorage.setItem(REMEMBER_KEY, 'false')
      localStorage.removeItem(REMEMBER_USERNAME_KEY)
    }

    loginMutate({ login: username, username, password, otp: otpStep ? otp : undefined })
  }

  return (
    <AuthLayout title="Sistem Internal TIK" subtitle="Universitas">
      <Card className="w-full">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-heading-3 font-semibold">
            {otpStep ? 'Verifikasi OTP' : 'Masuk'}
          </CardTitle>
          <CardDescription className="text-body-md text-muted-foreground">
            {otpStep
              ? 'Masukkan kode OTP 6 digit yang dikirim ke email Anda.'
              : 'Masuk menggunakan username dan kata sandi Anda.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <form onSubmit={onSubmitCredentials} className="flex flex-col gap-4 border border-border rounded-lg p-4">
            {!otpStep && (
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
            )}

            {!otpStep && (
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
            )}

            {otpStep && (
              <div className="flex flex-col items-center gap-4">
                <div className="text-center">
                  <Label htmlFor="otp" className="text-small text-foreground">Kode OTP (6 digit)</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Kode dikirim ke email {otpDelivery || 'terdaftar'}.
                  </p>
                </div>
                <div className="relative">
                  <input
                    ref={otpInputRef}
                    id="otp"
                    name="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtp(value)
                      if (otpError) setOtpError('')
                    }}
                    autoComplete="one-time-code"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    className="absolute inset-0 h-full w-full opacity-0"
                    aria-label="Kode OTP"
                  />
                  <button
                    type="button"
                    onClick={() => otpInputRef.current?.focus()}
                    className="grid grid-cols-6 gap-2"
                  >
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div
                        key={index}
                        className={`flex h-12 w-12 items-center justify-center rounded-md border text-lg font-semibold transition-colors ${
                          otp[index]
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-muted/30 text-foreground'
                        }`}
                      >
                        {otp[index] || ''}
                      </div>
                    ))}
                  </button>
                </div>
                {otpAttemptsRemaining !== null && otpMaxAttempts !== null && (
                  <p className="text-xs text-muted-foreground">
                    Sisa percobaan OTP: {otpAttemptsRemaining} dari {otpMaxAttempts}.
                  </p>
                )}
                {otpInfo && (
                  <p className="text-xs text-emerald-600">{otpInfo}</p>
                )}
                {otpError && (
                  <p className="text-xs text-destructive">{otpError}</p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setOtpStep(false)
                    setOtp('')
                    setOtpError('')
                    setOtpInfo('')
                    setOtpAttemptsRemaining(null)
                    setOtpMaxAttempts(null)
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Kembali ke Login
                </Button>
                <div className="flex flex-col items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => resendOtp({ login: username, username, password })}
                    disabled={isResendLoading || resendCooldown > 0}
                    className="text-primary hover:underline disabled:opacity-60"
                  >
                    {isResendLoading
                      ? 'Mengirim ulang...'
                      : resendCooldown > 0
                        ? `Kirim ulang OTP (${resendCooldown}s)`
                        : 'Kirim ulang OTP'}
                  </button>
                  <span className="text-muted-foreground">Periksa folder spam jika belum masuk.</span>
                </div>
              </div>
            )}

            {!otpStep && (
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
            )}

            {/* Errors are shown via toasts (toast system). Inline OTP validation messages remain above. */}

            <Button
              type="submit"
              disabled={isLoginLoading}
              className="w-full text-body-md bg-black hover:opacity-80 text-white hover:bg-navy-hover"
            >
              {isLoginLoading
                ? 'Memproses...'
                : otpStep
                  ? 'Verifikasi OTP'
                  : 'Masuk'}
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