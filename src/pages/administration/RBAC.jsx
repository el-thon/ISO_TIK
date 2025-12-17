import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const roles = [
  { name: 'Admin', tags: ['semua'] },
  { name: 'Pemilik Grup', tags: ['kelola grup','buat ruang','kelola anggota'] },
  { name: 'Penanggung Jawab Ruang', tags: ['kelola ruang','setujui topik','tugaskan pengguna'] },
  { name: 'Reviewer', tags: ['tinjau topik','komentar','minta perubahan'] },
  { name: 'Partisipan', tags: ['buat topik','komentar','lihat tugas'] },
]

const stepUp = [
  { title: 'Setujui Topik (L2+)', desc: 'Memerlukan autentikasi ulang', badge: 'Diperlukan', color: 'yellow' },
  { title: 'Tutup Topik', desc: 'Memerlukan autentikasi ulang', badge: 'Diperlukan', color: 'yellow' },
  { title: 'Hapus Topik (Permanen)', desc: 'Memerlukan persetujuan ganda', badge: 'Kontrol Ganda', color: 'red' },
]

export default function RBAC() {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Peran & Izin</h3>
          <Button className="bg-blue-600 text-white">Tambah Peran</Button>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4">
              {roles.map((r) => (
                <div key={r.name} className="flex items-center justify-between p-4 rounded-md border">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {r.tags.map((t) => (
                        <span key={t} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="hover:underline">Ubah</button>
                    <button className="hover:underline">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-3">Aturan Autentikasi Tambahan (Step-Up)</h3>
        <div className="space-y-3">
          {stepUp.map((s) => {
            const outerClass = s.color === 'red' ? 'bg-rose-50' : 'bg-amber-50'
            const badgeClass = s.color === 'red' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
            return (
              <div key={s.title} className={`rounded-md border p-4 ${outerClass}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{s.title}</div>
                    <div className="text-sm text-muted-foreground">{s.desc}</div>
                  </div>
                  <div>
                    <span className={`text-xs px-2 py-1 rounded-full ${badgeClass}`}>{s.badge}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
