import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, RefreshCw } from 'lucide-react'

export default function Settings() {
  const [joinCode, setJoinCode] = useState('TIK2024XYZ')
  const [hidden, setHidden] = useState(false)
  const [discoverable, setDiscoverable] = useState(true)
  const [autoApprove, setAutoApprove] = useState(false)

  function regenerateCode() {
    // simple pseudo-random code for demo
    const rand = Math.floor(Math.random() * 9000) + 1000
    setJoinCode(`TIK${rand}XYZ`)
  }

  function copyCode() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(joinCode)
    }
  }

  function disableCode() {
    setJoinCode('')
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Pengaturan</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Join Code */}
          <div className="mb-6">
            <div className="mb-2 text-small font-medium">Kode Bergabung</div>
            <div className="text-small text-muted-foreground mb-3">Izinkan pengguna bergabung ke grup ini menggunakan kode keamanan.</div>

            <div className="p-4 border rounded-md bg-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-50 border rounded-md px-4 py-2 font-mono text-sm">
                    {joinCode ? (hidden ? '••••••••' : joinCode) : <span className="text-muted-foreground">Tidak aktif</span>}
                  </div>
                  <div className="text-small text-muted-foreground">{joinCode ? 'Active Join Code' : 'Tidak ada kode aktif'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => setHidden((s) => !s)} className="text-muted-foreground flex items-center gap-1 text-sm">
                    {hidden ? <Eye /> : <EyeOff />} {hidden ? 'Tampilkan' : 'Sembunyikan'}
                  </button>
                  <button onClick={copyCode} className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Copy /> Salin
                  </button>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <Button variant="outline" onClick={regenerateCode} className="flex items-center gap-2">
                  <RefreshCw /> Regenerate Code
                </Button>
                <Button className="bg-red-600 text-white" onClick={disableCode}>Nonaktifkan Kode Bergabung</Button>
              </div>
            </div>
          </div>

          {/* Visibility Settings */}
          <div className="mb-6">
            <div className="mb-2 text-small font-medium">Pengaturan Visibilitas</div>
            <div className="space-y-3">
              <div className="p-3 bg-gray-light rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">Buat grup dapat ditemukan</div>
                  <div className="text-small text-muted-foreground">Izinkan pengguna untuk menemukan dan mengajukan permintaan bergabung</div>
                </div>
                <div>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} />
                  </label>
                </div>
              </div>

              <div className="p-3 bg-gray-light rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium">Setujui permintaan bergabung otomatis</div>
                  <div className="text-small text-muted-foreground">Anggota baru akan bergabung secara otomatis</div>
                </div>
                <div>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={autoApprove} onChange={(e) => setAutoApprove(e.target.checked)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div>
            <div className="mb-2 text-small font-medium">Zona Berbahaya</div>
            <div className="p-4 bg-red-light rounded-md space-y-4">
              <div className="p-4 bg-white rounded-md">
                <div className="font-medium text-sm">Arsipkan Grup</div>
                <div className="text-small text-muted-foreground mt-1">Arsipkan grup ini beserta semua ruangannya. Dapat dipulihkan nanti.</div>
                <div className="mt-3">
                  <Button variant="outline">Arsipkan Grup</Button>
                </div>
              </div>

              <div className="p-4 bg-white rounded-md">
                <div className="font-medium text-sm">Hapus Grup</div>
                <div className="text-small text-muted-foreground mt-1">Hapus grup ini secara permanen. Tindakan ini tidak dapat dibatalkan.</div>
                <div className="mt-3">
                  <Button className="bg-red-600 text-white">Hapus Grup</Button>
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
