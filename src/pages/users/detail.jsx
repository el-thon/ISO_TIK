import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { useParams, useNavigate } from 'react-router-dom'
import { sampleUsers } from './mocks/data'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useState } from 'react'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  function loadUser() {
    let user = sampleUsers.find((u) => u.id === id) || null
    try {
      const raw = localStorage.getItem('users')
      if (raw) {
        const users = JSON.parse(raw)
        user = users.find((u) => u.id === id) || user
      }
    } catch (e) {}
    if (!user) user = sampleUsers[0]
    return user
  }

  const [user, setUser] = useState(() => loadUser())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '', role: '', status: '', department: '' })

  function handleDeleteConfirm() {
    try {
      const raw = localStorage.getItem('users')
      if (raw) {
        const users = JSON.parse(raw).filter((u) => u.id !== id)
        localStorage.setItem('users', JSON.stringify(users))
      }
    } catch (e) {}
    setDeleteOpen(false)
    navigate('/users')
  }

  function handleEditOpen() {
    setEditForm({ name: user.name, email: user.email, role: user.role, status: user.status, department: user.department || '' })
    setEditOpen(true)
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    try {
      const raw = localStorage.getItem('users')
      let users = []
      if (raw) users = JSON.parse(raw)
      // if user exists in storage, update; otherwise push
      const exists = users.some((u) => u.id === id)
      if (exists) {
        users = users.map((u) => (u.id === id ? { ...u, ...editForm } : u))
      } else {
        users = [{ id, ...editForm, createdAt: user.createdAt || new Date().toLocaleDateString() }, ...users]
      }
      localStorage.setItem('users', JSON.stringify(users))
      // refresh local user state
      const updated = users.find((u) => u.id === id) || { id, ...editForm }
      setUser(updated)
    } catch (e) {}
    setEditOpen(false)
  }

  return (
    <MainLayout>
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-heading-2 font-semibold">{user.name}</h2>
            <p className="text-body-md text-muted-foreground">Detail dan informasi akun</p>
          </div>

            <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            <Button className="bg-amber-500 text-white" onClick={handleEditOpen}>Edit</Button>
            <Button variant="outline" onClick={() => setDeleteOpen(true)} className="text-red-600">Delete</Button>
          </div>
        </div>

        <Card>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="mt-1 font-medium">{user.email}</div>

                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Department</div>
                  <div className="mt-1">{user.department || '-'}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div className="mt-1"><span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{user.role}</span></div>

                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1"><span className={`text-xs px-2 py-0.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{user.status}</span></div>
                </div>

                <div className="mt-4">
                  <div className="text-sm text-muted-foreground">Created</div>
                  <div className="mt-1">{user.createdAt}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>Edit informasi pengguna.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="grid gap-3 mt-2">
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <select className="border rounded p-2" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                  <option>Admin</option>
                  <option>Editor</option>
                  <option>Viewer</option>
                </select>
                <select className="border rounded p-2" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <Input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white">Save</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Pengguna</DialogTitle>
              <DialogDescription>Verifikasi: apakah anda yakin ingin menghapus pengguna ini?</DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <div className="mb-4">{user.name}</div>
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
