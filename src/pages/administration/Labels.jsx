import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const labels = [
  { name: 'Urgent', color: 'bg-rose-500', pillColor: 'bg-rose-50 text-rose-600' },
  { name: 'Bug', color: 'bg-amber-500', pillColor: 'bg-amber-50 text-amber-700' },
  { name: 'Enhancement', color: 'bg-emerald-500', pillColor: 'bg-emerald-50 text-emerald-700' },
  { name: 'Documentation', color: 'bg-sky-500', pillColor: 'bg-sky-50 text-sky-700' },
  { name: 'Security', color: 'bg-violet-500', pillColor: 'bg-violet-50 text-violet-700' },
  { name: 'Infrastructure', color: 'bg-purple-500', pillColor: 'bg-purple-50 text-purple-700' },
]

export default function Labels() {
  return (
    <div className="max-w-full mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-heading-2 font-semibold">Label Sistem</h1>
        <p className="text-body-md text-muted-foreground">Kelola label sistem yang digunakan di topik dan tugas</p>
      </div>

      <Card>
        <CardHeader className="flex items-start justify-between">
          <CardTitle>Label Sistem</CardTitle>
          <div>
            <Button size="sm" className="bg-blue-600 text-white">Tambah Label</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {labels.map((l) => (
              <div key={l.name} className="rounded-md border p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-5 rounded-md ${l.color}`} />
                    <div className="font-medium">{l.name}</div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="hover:underline">Ubah</button>
                    <button className="hover:underline">Hapus</button>
                  </div>
                </div>

                <div className="mt-4">
                  <span className={`inline-block text-xs px-3 py-1 rounded-full ${l.pillColor}`}>{l.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
