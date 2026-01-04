import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

const InfoPair = ({ label, value }) => (
  <div className="mt-4 first:mt-0">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="font-medium text-sm text-foreground wrap-break-word">{value || '-'}</div>
  </div>
)

export default function Overview({ profileData }) {
  const profile = profileData?.profile ?? {}
  const contact = profileData?.contact ?? {}
  const address = profileData?.address ?? {}
  const employment = profileData?.employment ?? {}

  return (
    <div>
      <Card>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
