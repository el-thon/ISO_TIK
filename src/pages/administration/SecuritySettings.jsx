import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ShieldCheck } from 'lucide-react'

const dlpItems = [
  { title: 'Pindai file yang diunggah', desc: 'Pindai secara otomatis malware dan data sensitif', checked: true },
  { title: 'Beri watermark pada file (L2+)', desc: 'Terapkan watermark pada dokumen rahasia', checked: true },
  { title: 'Batasi konten email', desc: 'Mencegah penyalinan konten L3 ke email', checked: true },
  { title: 'Karantina perubahan (L3)', desc: 'Memerlukan persetujuan sebelum menerbitkan perubahan kritis', checked: true },
]

function DefaultField({ label }) {
  return (
    <div className="rounded-md border p-3 relative">
      <div className="mb-2 text-sm font-medium">{label}</div>

      <div className="relative">
        <Input className="rounded-md border px-6 text-center" placeholder="Ubah" readOnly />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-2 bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full border border-blue-100">
          <ShieldCheck className="size-4" /> <span>Internal L0</span>
        </span>
      </div>
    </div>
  )
}

export default function SecuritySettings() {
  return (
    <div className="max-w-full mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-heading-2 font-semibold">Pengaturan Keamanan</h1>
        <p className="text-body-md text-muted-foreground">Konfigurasi level keamanan default dan aturan pencegahan kehilangan data</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Level Keamanan Default</CardTitle>
            <CardDescription />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DefaultField label="Default Grup Baru" />
              <DefaultField label="Default Ruang Baru" />
            </div>

            <div className="mt-4">
              <DefaultField label="Default Topik Baru" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pencegahan Kehilangan Data (DLP)</CardTitle>
            <CardDescription />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dlpItems.map((it) => (
                <div key={it.title} className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <div className="font-medium">{it.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{it.desc}</div>
                  </div>

                  <div>
                    <Checkbox defaultChecked={it.checked} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button variant="outline" className="mr-2">Batal</Button>
          <Button>Simpan perubahan</Button>
        </div>
      </div>
    </div>
  )
}
