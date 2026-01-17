import React, { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { useParams, useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useAdminUser, useDeleteAdminUser, useUpdateAdminUser } from '@/services/adminUsersHooks'

export default function UserDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { data: user, isLoading, isError, error, refetch } = useAdminUser(id)
  const updateMutation = useUpdateAdminUser({
    onSuccess: () => {
      setEditOpen(false)
      refetch()
    },
  })
  const deleteMutation = useDeleteAdminUser({
    onSuccess: () => {
      setDeleteOpen(false)
      navigate('/users')
    },
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', email: '', status: 'active', username: '' })

  useEffect(() => {
    if (user) {
      setEditForm({
        full_name: user?.profile?.full_name || user?.name || '',
        email: user?.email || '',
        status: user?.status || 'active',
        username: user?.username || '',
      })
    }
  }, [user])

  const displayName = useMemo(() => user?.profile?.full_name || user?.username || 'Pengguna', [user])
  const statusVariant = (user?.status || '').toLowerCase() === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'

  function handleEditSubmit(e) {
    e.preventDefault()
    if (!id) return
    updateMutation.mutate({
      userId: id,
      payload: {
        username: editForm.username || undefined,
        email: editForm.email || undefined,
        status: editForm.status,
        profile: { full_name: editForm.full_name || undefined },
      },
    })
  }

  function handleDeleteConfirm() {
    if (!id) return
    deleteMutation.mutate({ userId: id, reason: 'Deleted via UI' })
  }

  return (
    <MainLayout>
      <div className="w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-heading-2 font-semibold">{displayName}</h2>
            <p className="text-body-md text-muted-foreground">Detail dan informasi akun</p>
          </div>

            <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
            <Button className="bg-amber-500 text-white" onClick={() => setEditOpen(true)} disabled={isLoading || !user}>
              {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Edit'}
            </Button>
            <Button variant="outline" onClick={() => setDeleteOpen(true)} className="text-red-600" disabled={isLoading || deleteMutation.isPending || !user}>
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center gap-3 py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Memuat data pengguna...
              </div>
            ) : isError ? (
              <div className="text-red-600 py-4">Gagal memuat pengguna: {error?.message || 'Terjadi kesalahan'}</div>
            ) : !user ? (
              <div className="text-muted-foreground py-4">Pengguna tidak ditemukan.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="mt-1 font-medium">{user.username || '-'}</div>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="mt-1">{user.email || '-'}</div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">Nama Lengkap</div>
                    <div className="mt-1">{user?.profile?.full_name || '-'}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1"><span className={`text-xs px-2 py-0.5 rounded-full ${statusVariant}`}>{user.status || '-'}</span></div>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">Dibuat</div>
                    <div className="mt-1">{user.created_at || user.createdAt || '-'}</div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground">Diperbarui</div>
                    <div className="mt-1">{user.updated_at || user.updatedAt || '-'}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
              <DialogDescription>Edit informasi pengguna.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="grid gap-3 mt-2">
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Username"
              />
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Nama Lengkap"
              />
              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm text-muted-foreground">Status</label>
                  <select className="border rounded p-2" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-blue-600 text-white" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
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
              <div className="mb-4">{displayName}</div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button className="bg-red-600 text-white" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
                  {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
