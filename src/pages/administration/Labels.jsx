import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const initialLabels = [
  { id: 1, name: 'Urgent', description: '', color: '#ef4444', pillColor: 'bg-rose-50 text-rose-600' },
  { id: 2, name: 'Bug', description: '', color: '#f59e0b', pillColor: 'bg-amber-50 text-amber-700' },
  { id: 3, name: 'Enhancement', description: '', color: '#10b981', pillColor: 'bg-emerald-50 text-emerald-700' },
  { id: 4, name: 'Documentation', description: '', color: '#0ea5e9', pillColor: 'bg-sky-50 text-sky-700' },
  { id: 5, name: 'Security', description: '', color: '#7c3aed', pillColor: 'bg-violet-50 text-violet-700' },
  { id: 6, name: 'Infrastructure', description: '', color: '#8b5cf6', pillColor: 'bg-purple-50 text-purple-700' },
]

const palette = ['#ef4444','#f97316','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#a3e635','#fb923c','#6366f1']

export default function Labels() {
  const [items, setItems] = useState(initialLabels)
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const [form, setForm] = useState({ name: '', description: '', color: palette[0] })

  function openCreateModal() {
    setForm({ name: '', description: '', color: palette[0] })
    setEditing(null)
    setOpenCreate(true)
  }

  function openEditModal(item) {
    setForm({ name: item.name, description: item.description || '', color: item.color || palette[0] })
    setEditing(item)
    setOpenCreate(true)
  }

  function handleSave() {
    if (!form.name.trim()) return
    if (editing) {
      setItems((s) => s.map((it) => (it.id === editing.id ? { ...it, name: form.name, description: form.description, color: form.color } : it)))
    } else {
      const id = Math.max(0, ...items.map((i) => i.id)) + 1
      setItems((s) => [{ id, name: form.name, description: form.description, color: form.color }, ...s])
    }
    setOpenCreate(false)
  }

  function confirmDelete(item) {
    setToDelete(item)
    setOpenDelete(true)
  }

  function handleDelete() {
    if (toDelete) setItems((s) => s.filter((i) => i.id !== toDelete.id))
    setOpenDelete(false)
    setToDelete(null)
  }

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
            <Button size="sm" className="bg-blue-600 text-white" onClick={openCreateModal}>Tambah Label</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((l) => (
              <div key={l.id} className="rounded-md border p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-5 rounded-md" style={{ width: 20, height: 20, backgroundColor: l.color }} />
                    <div className="font-medium">{l.name}</div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button className="hover:underline" onClick={() => openEditModal(l)}>Ubah</button>
                    <button className="hover:underline" onClick={() => confirmDelete(l)}>Hapus</button>
                  </div>
                </div>

                <div className="mt-4">
                  <span className="inline-block text-xs px-3 py-1 rounded-full" style={{ backgroundColor: `${l.color}20`, color: '#000' }}>{l.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Label' : 'Tambah Label Baru'}</DialogTitle>
            <DialogDescription>{editing ? 'Perbarui informasi label' : 'Isi data untuk membuat label baru'}</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground block mb-2">Nama Label</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Urgent, Bug Fix, Feature" />
          </div>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground block mb-2">Deskripsi (Opsional)</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full border border-slate-200 rounded-md p-3 text-sm" placeholder="Deskripsi singkat label" />
          </div>

          <div className="mt-4">
            <label className="text-sm text-muted-foreground block mb-2">Warna</label>
            <div className="flex items-center gap-2 flex-wrap">
              {palette.map((c) => (
                <button key={c} type="button" onClick={() => setForm((f) => ({ ...f, color: c }))} className={`w-8 h-8 rounded-md border ${form.color === c ? 'ring-2 ring-offset-2' : ''}`} style={{ backgroundColor: c }} />
              ))}
              <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} className="w-36" />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleSave}>{editing ? 'Simpan Perubahan' : 'Tambah Label'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Label</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus label ini?</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="text-sm">{toDelete?.name}</div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button className="bg-rose-600 text-white" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
