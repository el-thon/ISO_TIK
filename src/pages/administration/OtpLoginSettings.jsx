import React, { useEffect, useMemo, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/components/ui/use-toast'
import { useAdminSystemSettings, useUpdateAdminSystemSettings } from '@/hooks/useAdminSystem'

const OTP_SETTING_KEY = 'security.login_otp.enabled'

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

export default function OtpLoginSettings() {
  const { data, isLoading, isError, error, refetch } = useAdminSystemSettings()
  const settings = data?.settings ?? []

  const otpSetting = useMemo(
    () => settings.find((item) => item?.key === OTP_SETTING_KEY) ?? null,
    [settings]
  )

  const remoteEnabled = normalizeBoolean(otpSetting?.value, true)

  const [enabled, setEnabled] = useState(remoteEnabled)

  useEffect(() => {
    setEnabled(remoteEnabled)
  }, [remoteEnabled])

  const updateMutation = useUpdateAdminSystemSettings({
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Pengaturan OTP login berhasil diperbarui.',
      })
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal memperbarui pengaturan OTP login.'

      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: message,
      })
    },
  })

  const hasChanges = enabled !== remoteEnabled

  const handleSave = () => {
    const nextSettings = settings.filter((item) => item?.key !== OTP_SETTING_KEY)
    nextSettings.push({
      key: OTP_SETTING_KEY,
      value: enabled,
      value_type: 'boolean',
      category: 'security',
      is_public: false,
      description: 'Global OTP requirement for login flow',
    })

    updateMutation.mutate(nextSettings)
  }

  const handleReset = () => {
    setEnabled(remoteEnabled)
  }

  const loadingState = isLoading && settings.length === 0
  const errorMessage = error?.response?.data?.message || error?.message || 'Gagal memuat pengaturan sistem.'

  return (
    <div className="w-full max-w-full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-600" />
            OTP Login
          </CardTitle>
          <CardDescription>
            Atur apakah proses login pengguna wajib melalui verifikasi OTP.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {loadingState && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-40" />
            </div>
          )}

          {!loadingState && isError && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

          {!loadingState && !isError && (
            <>
              <div className="rounded-md border p-4 w-full">
                <div className="flex w-full items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Label htmlFor="otp-login-toggle" className="text-sm font-medium">
                      Wajib OTP saat login
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jika dinonaktifkan, user dapat login langsung tanpa verifikasi OTP.
                    </p>
                  </div>

                  <Switch
                    id="otp-login-toggle"
                    checked={enabled}
                    onCheckedChange={setEnabled}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={!hasChanges || updateMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Menyimpan...' : 'Simpan perubahan'}
                </Button>
              </div>
            </>
          )}

          {!loadingState && (
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading}>
                Refresh
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
