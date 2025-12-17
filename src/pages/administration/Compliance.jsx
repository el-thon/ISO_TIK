import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Lock, Clock } from 'lucide-react'

const dualControls = [
  {
    title: 'Hapus Permanen Topik',
    desc: 'Memerlukan persetujuan dari dua pengguna berwenang sebelum penghapusan permanen',
    badge: 'Diperlukan Persetujuan Ganda',
    meta: '3 Pengguna Berwenang',
    color: 'red',
  },
  {
    title: 'Tutup Topik L3',
    desc: 'Topik kritis memerlukan persetujuan ganda untuk ditutup',
    badge: 'Diperlukan Persetujuan Ganda',
    color: 'yellow',
  },
]

const retention = [
  { title: 'Log Audit', desc: 'Simpan untuk kepatuhan', badge: '7 tahun' },
  { title: 'Topik Ditutup', desc: 'Arsip setelah ditutup', badge: '3 tahun' },
  { title: 'Draft Topik', desc: 'Hapus otomatis draft tidak aktif', badge: '90 hari' },
]

export default function Compliance() {
  return (
    <div className="max-w-full mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-heading-2 font-semibold">Kepatuhan</h1>
        <p className="text-body-md text-muted-foreground">Atur aturan kontrol ganda, retensi data, dan jadwal pembekuan untuk kepatuhan</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Aturan Kontrol Ganda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dualControls.map((d) => {
                const outerClass = d.color === 'red' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'
                const badgeClass = d.color === 'red' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                return (
                  <div key={d.title} className={`rounded-md border p-4 ${outerClass}`}>
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {d.color === 'red' ? <AlertTriangle className="size-5 text-rose-600" /> : <Lock className="size-5 text-amber-600" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{d.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{d.desc}</div>

                        <div className="mt-3 flex items-center gap-3">
                          <span className={`text-xs px-3 py-1 rounded-full ${badgeClass}`}>{d.badge}</span>
                          {d.meta && <span className="text-xs px-3 py-1 rounded-full bg-slate-50 text-slate-700">{d.meta}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kebijakan Retensi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {retention.map((r) => (
                <div key={r.title} className="rounded-md border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{r.desc}</div>
                  </div>
                  <div>
                    <span className="inline-block text-xs px-3 py-1 rounded-full bg-sky-50 text-sky-700">{r.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jendela Pembekuan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Tentukan periode saat beberapa tindakan dibatasi untuk kepatuhan</div>
              </div>
              <div>
                <Button size="sm" className="bg-blue-600 text-white">Konfigurasikan Jendela Pembekuan</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
