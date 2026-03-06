import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useUpdateProfile } from '@/services/profileHooks'

const toDefaultValues = (profileData) => {
  const profile = profileData?.profile ?? {}
  const contact = profileData?.contact ?? {}
  const address = profileData?.address ?? {}
  const emergency = profileData?.emergency_contact ?? {}

  return {
    full_name: profile.full_name || '',
    phone_number: contact.phone_number || '',
    email_personal: contact.email_personal || '',
    address_line1: address.address_line1 || '',
    address_line2: address.address_line2 || '',
    city: address.city || '',
    province: address.province || '',
    postal_code: address.postal_code || '',
    country: address.country || '',
    emergency_name: emergency.name || '',
    emergency_phone: emergency.phone || '',
    emergency_relationship: emergency.relationship || '',
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

  const emergency = cleanPayload({
    name: values.emergency_name,
    phone: values.emergency_phone,
    relationship: values.emergency_relationship,
  })

  const payload = {}
  if (Object.keys(profile).length) payload.profile = profile
  if (Object.keys(contact).length) payload.contact = contact
  if (Object.keys(address).length) payload.address = address
  if (Object.keys(emergency).length) payload.emergency_contact = emergency

  return payload
}

export default function PersonalData({ profileData }) {
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
      setStatusMessage({ type: 'success', text: 'Data pribadi diperbarui' })
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
      // handled via onError callback
    }
  }

  const messageColor = statusMessage?.type === 'success' ? 'text-emerald-600' : statusMessage?.type === 'error' ? 'text-red-600' : 'text-muted-foreground'

  const renderValue = (value) => (
    <div className="mt-1 text-sm text-foreground font-medium">{value || '-'}</div>
  )

  const readView = (
    <div className="space-y-6">
      <div>
        <h4 className="font-medium mb-2">Profil</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Nama Lengkap</div>
            {renderValue(defaultValues.full_name)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Kontak</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Nomor Telepon</div>
            {renderValue(defaultValues.phone_number)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email Pribadi</div>
            {renderValue(defaultValues.email_personal)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Alamat</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Alamat Baris 1</div>
            {renderValue(defaultValues.address_line1)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Alamat Baris 2</div>
            {renderValue(defaultValues.address_line2)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Kota</div>
            {renderValue(defaultValues.city)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Provinsi</div>
            {renderValue(defaultValues.province)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Kode Pos</div>
            {renderValue(defaultValues.postal_code)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Negara</div>
            {renderValue(defaultValues.country)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-2">Kontak Darurat</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">Nama</div>
            {renderValue(defaultValues.emergency_name)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Hubungan</div>
            {renderValue(defaultValues.emergency_relationship)}
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Nomor Telepon</div>
            {renderValue(defaultValues.emergency_phone)}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Data Pribadi</h3>
              <p className="text-xs text-muted-foreground">Perbarui identitas, kontak, dan alamat kamu</p>
            </div>
            {!editing ? (
              <Button
                type="button"
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
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.reset(toDefaultValues(profileData))
                    setStatusMessage(null)
                    setEditing(false)
                  }}
                  disabled={updateProfile.isPending}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={updateProfile.isPending || !form.formState.isDirty}>
                  {updateProfile.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            )}
          </div>

          {!editing && readView}

          {editing && (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h4 className="font-medium mb-2">Profil</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Nama Lengkap</div>
                  <Input className="mt-1" {...form.register('full_name')} placeholder="Nama lengkap" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Kontak</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Nomor Telepon</div>
                  <Input className="mt-1" {...form.register('phone_number')} placeholder="Contoh: +6281xxxx" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Email Pribadi</div>
                  <Input className="mt-1" {...form.register('email_personal')} placeholder="nama@gmail.com" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Alamat</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Alamat Baris 1</div>
                  <Input className="mt-1" {...form.register('address_line1')} placeholder="Nama jalan" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Alamat Baris 2</div>
                  <Input className="mt-1" {...form.register('address_line2')} placeholder="RT / RW / Unit" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Kota</div>
                  <Input className="mt-1" {...form.register('city')} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Provinsi</div>
                  <Input className="mt-1" {...form.register('province')} />
                </div>
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

            <div>
              <h4 className="font-medium mb-2">Kontak Darurat</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Nama</div>
                  <Input className="mt-1" {...form.register('emergency_name')} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Hubungan</div>
                  <Input className="mt-1" {...form.register('emergency_relationship')} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Nomor Telepon</div>
                  <Input className="mt-1" {...form.register('emergency_phone')} />
                </div>
              </div>
            </div>

              {statusMessage && (
                <p className={`text-sm ${messageColor}`}>{statusMessage.text}</p>
              )}
            </form>
          )}

          {!editing && statusMessage && (
            <p className={`text-sm ${messageColor} mt-4`}>{statusMessage.text}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
