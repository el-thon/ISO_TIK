import React, { useMemo, useState } from 'react'
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
import {
  Check,
  ClipboardCheck,
  DoorOpen,
  Eye,
  FolderPlus,
  Layers,
  ListChecks,
  MessageSquare,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  UserPlus,
  Users2,
} from 'lucide-react'

const PERMISSIONS = [
  { key: 'all', label: 'All Permissions', description: 'Grant every capability below in one go', icon: ShieldCheck },
  { key: 'can_manage_groups', label: 'Manage Group', description: 'Update, archive, dan restore grup', icon: Layers },
  { key: 'can_create_groups', label: 'Create Group', description: 'Buat grup baru dan tetapkan owner', icon: FolderPlus },
  { key: 'can_create_rooms', label: 'Create Room', description: 'Generate ruang diskusi untuk tiap grup', icon: DoorOpen },
  { key: 'can_manage_users', label: 'Manage Members', description: 'Kelola anggota serta hak aksesnya', icon: Users2 },
  { key: 'can_approve_topics', label: 'Approve Topics', description: 'Sahkan topik siap publish', icon: ClipboardCheck },
  { key: 'can_invite_users', label: 'Assign Users', description: 'Undang atau tetapkan reviewer', icon: UserPlus },
  { key: 'can_review_topics', label: 'Review Topics', description: 'Tinjau dan validasi konten topik', icon: ListChecks },
  { key: 'can_create_topics', label: 'Create Topics', description: 'Buat draft topik baru', icon: PencilLine },
  { key: 'can_comment', label: 'Comment', description: 'Berikan komentar di setiap tahap', icon: MessageSquare },
  { key: 'can_request_changes', label: 'Request Changes', description: 'Kembalikan topik untuk revisi', icon: RefreshCw },
  { key: 'can_view_assignments', label: 'View Assigned', description: 'Lihat seluruh tugas/penugasan', icon: Eye },
]

const CAPABILITY_KEYS = PERMISSIONS.filter((perm) => perm.key !== 'all').map((perm) => perm.key)

const PERMISSION_LOOKUP = PERMISSIONS.reduce((acc, perm) => {
  acc[perm.key] = perm
  return acc
}, {})

const sanitizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) return []
  return Array.from(new Set(permissions.filter((perm) => CAPABILITY_KEYS.includes(perm))))
}

const initialRoles = [
  { id: 1, name: 'Admin', description: 'Full control untuk seluruh modul', permissions: [...CAPABILITY_KEYS] },
  { id: 2, name: 'Pemilik Grup', description: 'Kelola grup dan undang anggota', permissions: sanitizePermissions(['can_manage_groups', 'can_create_groups', 'can_create_rooms', 'can_manage_users', 'can_invite_users', 'can_view_assignments']) },
  { id: 3, name: 'Penanggung Jawab Ruang', description: 'Urus aktivitas ruang & validasi topik', permissions: sanitizePermissions(['can_create_rooms', 'can_manage_users', 'can_approve_topics', 'can_review_topics', 'can_comment', 'can_view_assignments']) },
  { id: 4, name: 'Reviewer', description: 'Fokus meninjau dan memberi masukan', permissions: sanitizePermissions(['can_review_topics', 'can_comment', 'can_request_changes', 'can_view_assignments']) },
  { id: 5, name: 'Partisipan', description: 'Menyusun dan memantau topik sendiri', permissions: sanitizePermissions(['can_create_topics', 'can_comment', 'can_view_assignments']) },
]

const DEFAULT_ROLE_FORM = { name: '', permissions: [] }

const isFullAccess = (permissions = []) => CAPABILITY_KEYS.every((key) => permissions.includes(key))

const stepUp = [
  { title: 'Setujui Topik (L2+)', desc: 'Memerlukan autentikasi ulang', badge: 'Diperlukan', color: 'yellow' },
  { title: 'Tutup Topik', desc: 'Memerlukan autentikasi ulang', badge: 'Diperlukan', color: 'yellow' },
  { title: 'Hapus Topik (Permanen)', desc: 'Memerlukan persetujuan ganda', badge: 'Kontrol Ganda', color: 'red' },
]

export default function RBAC() {
  const [roles, setRoles] = useState(initialRoles)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(DEFAULT_ROLE_FORM)
  const [error, setError] = useState('')
  const [openDelete, setOpenDelete] = useState(false)
  const [toDelete, setToDelete] = useState(null)

  const selectedSet = useMemo(() => new Set(form.permissions), [form.permissions])
  const allSelected = CAPABILITY_KEYS.every((key) => selectedSet.has(key))
  const selectedCount = selectedSet.size

  function resetForm() {
    setForm(DEFAULT_ROLE_FORM)
    setEditing(null)
    setError('')
  }

  function openCreate() {
    resetForm()
    setOpen(true)
  }

  function openEdit(role) {
    setEditing(role)
    setForm({
      name: role?.name || '',
      permissions: sanitizePermissions(role?.permissions || []),
    })
    setError('')
    setOpen(true)
  }

  function togglePerm(key) {
    setForm((prev) => {
      const current = new Set(prev.permissions)
      if (key === 'all') {
        const hasAll = CAPABILITY_KEYS.every((permKey) => current.has(permKey))
        if (hasAll) {
          return { ...prev, permissions: [] }
        }
        CAPABILITY_KEYS.forEach((permKey) => current.add(permKey))
        return { ...prev, permissions: Array.from(current) }
      }

      if (current.has(key)) current.delete(key)
      else current.add(key)

      return { ...prev, permissions: Array.from(current) }
    })
    setError('')
  }

  function handleSave() {
    const trimmedName = form.name.trim()
    const selected = sanitizePermissions(form.permissions)

    if (!trimmedName) {
      setError('Nama role wajib diisi')
      return
    }

    if (selected.length === 0) {
      setError('Pilih minimal satu permission')
      return
    }

    if (editing) {
      setRoles((prev) => prev.map((role) => (role.id === editing.id ? { ...role, name: trimmedName, permissions: selected } : role)))
    } else {
      setRoles((prev) => {
        const nextId = Math.max(0, ...prev.map((r) => Number(r.id) || 0)) + 1
        return [{ id: nextId, name: trimmedName, permissions: selected }, ...prev]
      })
    }

    setOpen(false)
    resetForm()
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
              {roles.map((role) => {
                const sanitized = sanitizePermissions(role.permissions)
                const roleHasFullAccess = isFullAccess(sanitized)
                const displayKeys = roleHasFullAccess ? ['all'] : sanitized
                return (
                  <div key={role.id} className="p-4 rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{role.name}</div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <button type="button" className="hover:text-blue-600" onClick={() => openEdit(role)}>Ubah</button>
                        <span aria-hidden="true">•</span>
                        <button type="button" className="hover:text-rose-600" onClick={() => openDeleteConfirm(role)}>Hapus</button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {displayKeys.length > 0 ? (
                        displayKeys.map((key) => {
                          const perm = PERMISSION_LOOKUP[key]
                          const Icon = perm?.icon
                          const highlighted = key === 'all'
                          return (
                            <span key={`${role.id}-${key}`} className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${highlighted ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              {Icon && <Icon className={`w-3.5 h-3.5 ${highlighted ? 'text-white' : 'text-slate-500'}`} />}
                              {perm?.label || key}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-sm text-muted-foreground">Belum ada permission</span>
                      )}
                    </div>
                  </div>
                )
              })}
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
      <Dialog open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) resetForm() }}>
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
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
              <span>Permissions</span>
              <span>{allSelected ? 'Semua izin dipilih' : `${selectedCount}/${CAPABILITY_KEYS.length} izin dipilih`}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {PERMISSIONS.map((permission) => (
                <PermissionTile
                  key={permission.key}
                  permission={permission}
                  selected={permission.key === 'all' ? allSelected : selectedSet.has(permission.key)}
                  onToggle={togglePerm}
                />
              ))}
            </div>
            {error && <div className="text-sm text-rose-600 mt-2">{error}</div>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={resetForm}>Batal</Button>
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

function PermissionTile({ permission, selected, onToggle }) {
  const Icon = permission.icon
  return (
    <button
      type="button"
      onClick={() => onToggle(permission.key)}
      className={`rounded-xl border p-3 text-left transition ${selected ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300'}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 flex h-5 w-5 items-center justify-center rounded-md border ${selected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-slate-400'}`}>
          {selected && <Check className="w-3 h-3" />}
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            {Icon && <Icon className={`w-4 h-4 ${selected ? 'text-blue-600' : 'text-slate-500'}`} />}
            {permission.label}
          </div>
          {permission.description && <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>}
        </div>
      </div>
    </button>
  )
}
