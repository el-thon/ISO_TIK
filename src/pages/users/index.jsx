import React, { useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { sampleUsers } from './mocks/data'
import { useNavigate, Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Trash2, Edit2 } from 'lucide-react'

function loadUsers() {
  try {
    const raw = localStorage.getItem('users')
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return sampleUsers
}

export default function UsersPage() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState(() => loadUsers())
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'Viewer', status: 'Active', department: '' })
  const [editingUser, setEditingUser] = useState(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const q = query.toLowerCase()
    return users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q))
  }, [query, users])

  function saveUsers(next) {
    setUsers(next)
    try { localStorage.setItem('users', JSON.stringify(next)) } catch (e) {}
  }

  function handleCreate(e) {
    e.preventDefault()
    const id = 'u-' + Date.now()
    const next = [{ id, ...form, createdAt: new Date().toLocaleDateString() }, ...users]
    saveUsers(next)
    setOpen(false)
    setForm({ name: '', email: '', role: 'Viewer', status: 'Active', department: '' })
    navigate(`/users/${id}`)
  }

  function handleEditOpen(user, e) {
    if (e) e.stopPropagation()
    setEditingUser(user)
    setEditOpen(true)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    const next = users.map((u) => (u.id === editingUser.id ? { ...editingUser } : u))
    saveUsers(next)
    setEditOpen(false)
  }

  function handleDeleteOpen(user, e) {
    if (e) e.stopPropagation()
    setDeleteTarget(user)
    setDeleteOpen(true)
  }

  function handleDeleteConfirm() {
    const next = users.filter((u) => u.id !== deleteTarget.id)
    saveUsers(next)
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  return (
    <MainLayout>
      <div className="w-full mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-heading-2 font-semibold">Manajemen Pengguna</h2>
            <p className="text-body-md text-muted-foreground">Buat dan kelola pengguna sistem</p>
          </div>

          <div className="w-full md:w-1/2 flex items-center gap-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari pengguna..." className="w-full" />
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white">+ Tambah Pengguna</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Pengguna Baru</DialogTitle>
                  <DialogDescription>Isi informasi pengguna untuk membuat akun baru.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="grid gap-3 mt-2">
                  <Input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <select className="border rounded p-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                      <option>Admin</option>
                      <option>Editor</option>
                      <option>Viewer</option>
                    </select>
                    <select className="border rounded p-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                  <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit" className="bg-blue-600 text-white">Create</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} onClick={() => navigate(`/users/${u.id}`)} className="cursor-pointer h-16">
                    <TableCell className="p-4 align-middle">{u.name}</TableCell>
                    <TableCell className="p-4 align-middle">{u.email}</TableCell>
                    <TableCell className="p-4 align-middle">{u.role}</TableCell>
                    <TableCell className="p-4 align-middle">{u.status}</TableCell>
                    <TableCell className="p-4 align-middle">
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => handleEditOpen(u, e)} className="inline-flex items-center gap-2 px-2 py-1 border rounded text-sm" title="Edit" type="button">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={(e) => handleDeleteOpen(u, e)} className="inline-flex items-center gap-2 px-2 py-1 border rounded text-sm text-red-600" title="Delete" type="button">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                        <Link to={`/users/${u.id}`} className="text-blue-600 ml-2">Detail</Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>Edit informasi pengguna.</DialogDescription>
            </DialogHeader>
            {editingUser && (
              <form onSubmit={handleEditSubmit} className="grid gap-3 mt-2">
                <Input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
                <Input value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <select className="border rounded p-2" value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}>
                    <option>Admin</option>
                    <option>Editor</option>
                    <option>Viewer</option>
                  </select>
                  <select className="border rounded p-2" value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
                <Input value={editingUser.department} onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })} />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-blue-600 text-white">Save</Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete confirm dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Pengguna</DialogTitle>
              <DialogDescription>Verifikasi: apakah anda yakin ingin menghapus pengguna ini?</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="mb-4">{deleteTarget?.name}</div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button className="bg-red-600 text-white" onClick={handleDeleteConfirm}>Delete</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
