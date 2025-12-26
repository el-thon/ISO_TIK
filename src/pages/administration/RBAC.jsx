import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const initialRoles = [
  { id: 1, name: 'Admin', tags: ['semua'] },
  { id: 2, name: 'Pemilik Grup', tags: ['kelola grup','buat ruang','kelola anggota'] },
  { id: 3, name: 'Penanggung Jawab Ruang', tags: ['kelola ruang','setujui topik','tugaskan pengguna'] },
  { id: 4, name: 'Reviewer', tags: ['tinjau topik','komentar','minta perubahan'] },
  { id: 5, name: 'Partisipan', tags: ['buat topik','komentar','lihat tugas'] },
]

const PERMISSIONS = [
  { key: 'all', label: 'Semua Izin' },
  { key: 'manage_group', label: 'Kelola Grup' },
  { key: 'create_room', label: 'Buat Ruang' },
  { key: 'manage_room', label: 'Kelola Ruang' },
  { key: 'manage_members', label: 'Kelola Anggota' },
  { key: 'approve_topics', label: 'Setujui Topik' },
  { key: 'assign_users', label: 'Tugaskan Pengguna' },
  { key: 'review_topics', label: 'Tinjau Topik' },
  { key: 'create_topics', label: 'Buat Topik' },
  { key: 'comment', label: 'Komentar' },
  { key: 'request_changes', label: 'Minta Perubahan' },
  { key: 'view_assigned', label: 'Lihat Ters assigned' },
]

const stepUp = [
  { title: 'Setujui Topik (L2+)', desc: 'Memerlukan autentikasi ulang', badge: 'Diperlukan', color: 'yellow' },
  { title: 'Tutup Topik', desc: 'Memerlukan autentikasi ulang', badge: 'Diperlukan', color: 'yellow' },
  { title: 'Hapus Topik (Permanen)', desc: 'Memerlukan persetujuan ganda', badge: 'Kontrol Ganda', color: 'red' },
]

export default function RBAC() {
  const [roles, setRoles] = useState(initialRoles)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', permissions: {} })
  const [error, setError] = useState('')
  const [openDelete, setOpenDelete] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  function openCreate() {
    setEditing(null)
    setForm({ name: '', permissions: {} })
    setError('')
    setOpen(true)
  }

  function openEdit(role) {
    try {
      const perms = {}
      // map tags into permission keys when possible (best effort)
      const tags = Array.isArray(role?.tags) ? role.tags : []
      tags.forEach((t) => {
        if (!t || typeof t !== 'string') return
        const lower = t.toLowerCase()
        const match = PERMISSIONS.find((p) => {
          if (!p || !p.label || typeof p.label !== 'string') return false
          const lab = p.label.toLowerCase()
          return lab.includes(lower) || lab === lower
        })
        if (match) perms[match.key] = true
      })
      console.log('openEdit called for role:', role)
      setEditing(role)
      setForm({ name: role?.name || '', permissions: perms })
      setError('')
      setOpen(true)
    } catch (err) {
      console.error('Error mapping role tags to permissions:', err)
      // fallback: open editor with minimal info
      setEditing(role)
      setForm({ name: role?.name || '', permissions: {} })
      setError('')
      setOpen(true)
    }
  }

  function togglePerm(key) {
    setForm((f) => ({ ...f, permissions: { ...f.permissions, [key]: !f.permissions[key] } }))
  }

  function handleSave() {
    const selected = Object.keys(form.permissions).filter((k) => form.permissions[k])
    if (selected.length === 0) {
      setError('Pilih minimal satu permission')
      return
    }
    if (editing) {
      setRoles((r) => r.map((it) => (it.id === editing.id ? { ...it, name: form.name, tags: selected } : it)))
    } else {
      const id = Math.max(0, ...roles.map((r) => r.id)) + 1
      setRoles((r) => [{ id, name: form.name, tags: selected }, ...r])
    }
    setOpen(false)
  }

  function openDeleteConfirm(role) {
    setToDelete(role)
    setOpenDelete(true)
  }

  function handleDelete() {
    if (toDelete) setRoles((r) => r.filter((it) => it.id !== toDelete.id))
    setOpenDelete(false)
    setToDelete(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Peran & Izin</h3>
          <Button className="bg-blue-600 text-white" onClick={openCreate}>Tambah Peran</Button>
        </div>

        <Card>
          <CardContent>
            <div className="space-y-4">
              {roles.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-4 rounded-md border">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {r.tags.map((t) => (
                        <span key={t} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <button type="button" className="hover:underline" onClick={() => openEdit(r)}>Ubah</button>
                    <button type="button" className="hover:underline" onClick={() => openDeleteConfirm(r)}>Hapus</button>
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

      {/* Create / Edit Role Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Ubah Peran' : 'Tambah Peran'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Perbarui nama peran dan pilih permission yang sesuai' : 'Buat peran baru dan pilih minimal satu permission'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <label className="text-sm block mb-2">Role Name</label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g., Project Manager" />
          </div>

          <div className="mt-6">
            <Label className="text-sm block mb-3">Permissions</Label>
            <div className="grid grid-cols-2 gap-3">
              {PERMISSIONS.map((p) => (
                <label key={p.key} className="flex items-center gap-3 p-3 border rounded-md">
                  <Checkbox checked={!!form.permissions[p.key]} onCheckedChange={() => togglePerm(p.key)} />
                  <div className="text-sm">{p.label}</div>
                </label>
              ))}
            </div>
            {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleSave}>{editing ? 'Simpan Perubahan' : 'Tambah Peran'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Peran</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus peran ini?</DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            <div className="font-medium">{toDelete?.name}</div>
            <div className="text-sm text-muted-foreground mt-2">Tindakan ini tidak dapat dibatalkan.</div>
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
