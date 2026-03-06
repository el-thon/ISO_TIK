import React, { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateProfile } from '@/services/profileHooks'

const InfoPair = ({ label, value }) => (
  <div className="mt-4 first:mt-0">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium text-sm text-foreground wrap-break-word">{value || '-'}</div>
  </div>
)

const toDefaultValues = (profileData) => {
  const profile = profileData?.profile ?? {}
  const contact = profileData?.contact ?? {}
  const address = profileData?.address ?? {}

  return {
    full_name: profile.full_name || profileData?.username || '',
    phone_number: contact.phone_number || '',
    email_personal: contact.email_personal || '',
    address_line1: address.address_line1 || '',
    address_line2: address.address_line2 || '',
    city: address.city || '',
    province: address.province || '',
    postal_code: address.postal_code || '',
    country: address.country || '',
  }
}

const cleanPayload = (obj = {}) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

const buildPayload = (values) => {
  const profile = cleanPayload({
    full_name: values.full_name,
  })

  const contact = cleanPayload({
    phone_number: values.phone_number,
    email_personal: values.email_personal,
  })

  const address = cleanPayload({
    address_line1: values.address_line1,
    address_line2: values.address_line2,
    city: values.city,
    province: values.province,
    postal_code: values.postal_code,
    country: values.country,
  })

  const payload = {}
  if (Object.keys(profile).length) payload.profile = profile
  if (Object.keys(contact).length) payload.contact = contact
  if (Object.keys(address).length) payload.address = address

  return payload
}

export default function Overview({ profileData }) {
  const profile = profileData?.profile ?? {}
  const contact = profileData?.contact ?? {}
  const address = profileData?.address ?? {}
  const employment = profileData?.employment ?? {}

  const [editing, setEditing] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const defaultValues = useMemo(() => toDefaultValues(profileData), [profileData])
  const form = useForm({
    defaultValues,
  })

  useEffect(() => {
    form.reset(toDefaultValues(profileData))
  }, [profileData, form])

  const updateProfile = useUpdateProfile({
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Data berhasil diperbarui' })
      setEditing(false)
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal memperbarui data'
      setStatusMessage({ type: 'error', text: message })
    },
  })

  const onSubmit = async (values) => {
    setStatusMessage(null)
    const payload = buildPayload(values)
    if (!Object.keys(payload).length) {
      setStatusMessage({ type: 'info', text: 'Tidak ada perubahan untuk disimpan' })
      return
    }
    try {
      await updateProfile.mutateAsync(payload)
    } catch (error) {
      // handled by onError
    }
  }

  const messageColor = statusMessage?.type === 'success'
    ? 'text-emerald-600'
    : statusMessage?.type === 'error'
      ? 'text-red-600'
      : 'text-muted-foreground'

  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Overview</h3>
              <p className="text-xs text-muted-foreground">Ringkasan data profil kamu</p>
            </div>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusMessage(null)
                  setEditing(true)
                }}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    form.reset(toDefaultValues(profileData))
                    setStatusMessage(null)
                    setEditing(false)
                  }}
                  disabled={updateProfile.isPending}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  disabled={updateProfile.isPending || !form.formState.isDirty}
                >
                  {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            )}
          </div>

          {!editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <InfoPair label="Nama Lengkap" value={profile.full_name || profileData?.username} />
              <InfoPair label="Email Institusi" value={profileData?.email} />
              <InfoPair label="Nomor Telepon" value={contact.phone_number} />
              <InfoPair label="Fakultas" value={employment.faculty} />
              <InfoPair label="Departemen" value={employment.department} />
            </div>
            <div>
              <InfoPair label="Username" value={profileData?.username} />
              <InfoPair label="Email Pribadi" value={contact.email_personal} />
              <InfoPair label="Kota / Provinsi" value={[address.city, address.province].filter(Boolean).join(', ')} />
              <InfoPair label="Alamat" value={[address.address_line1, address.address_line2].filter(Boolean).join(', ')} />
              <InfoPair label="Negara" value={address.country} />
            </div>
          </div>
          )}

          {editing && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Nama Lengkap</div>
                  <Input className="mt-1" {...form.register('full_name')} placeholder="Nama lengkap" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email Institusi (read-only)</div>
                  <div className="mt-1 text-sm text-foreground font-medium">{profileData?.email || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Nomor Telepon</div>
                  <Input className="mt-1" {...form.register('phone_number')} placeholder="Contoh: +6281xxxx" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Fakultas (read-only)</div>
                  <div className="mt-1 text-sm text-foreground font-medium">{employment.faculty || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Departemen (read-only)</div>
                  <div className="mt-1 text-sm text-foreground font-medium">{employment.department || '-'}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-xs text-muted-foreground">Username (read-only)</div>
                  <div className="mt-1 text-sm text-foreground font-medium">{profileData?.username || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email Pribadi</div>
                  <Input className="mt-1" {...form.register('email_personal')} placeholder="nama@gmail.com" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Kota</div>
                    <Input className="mt-1" {...form.register('city')} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Provinsi</div>
                    <Input className="mt-1" {...form.register('province')} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Alamat Baris 1</div>
                  <Input className="mt-1" {...form.register('address_line1')} placeholder="Nama jalan" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Alamat Baris 2</div>
                  <Input className="mt-1" {...form.register('address_line2')} placeholder="RT / RW / Unit" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Kode Pos</div>
                    <Input className="mt-1" {...form.register('postal_code')} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Negara</div>
                    <Input className="mt-1" {...form.register('country')} />
                  </div>
                </div>
              </div>
            </form>
          )}

          {statusMessage && (
            <p className={`text-sm mt-4 ${messageColor}`}>{statusMessage.text}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
