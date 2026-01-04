import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Loader2, Trash2, Edit2, KeyRound, UserPlus, ShieldCheck, Users, RefreshCcw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  useAdminUsersList,
  useAdminUserStatistics,
  useAdminRoles,
  useCreateAdminUser,
  useUpdateAdminUser,
  useDeleteAdminUser,
  useBulkStatusUpdate,
  useAssignRole,
  useActivateAdminUser,
  useDeactivateAdminUser,
  useResetUserPassword,
  useAdminUser,
} from '@/services/adminUsersHooks'

const DEFAULT_CREATE = { username: '', email: '', password: '', status: 'active', full_name: '' }
const DEFAULT_EDIT = { username: '', email: '', status: 'active', full_name: '' }
const DEFAULT_PASSWORD = { new_password: '', confirm_password: '', reason: '' }
const DEFAULT_ROLE = { roleId: '', reason: '' }
const DEFAULT_DELETE = { userId: null, reason: '' }
const DEFAULT_BULK = { status: 'inactive', reason: '' }

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE)
  const [editForm, setEditForm] = useState(DEFAULT_EDIT)
  const [passwordForm, setPasswordForm] = useState(DEFAULT_PASSWORD)
  const [roleForm, setRoleForm] = useState(DEFAULT_ROLE)
  const [deleteForm, setDeleteForm] = useState(DEFAULT_DELETE)
  const [bulkForm, setBulkForm] = useState(DEFAULT_BULK)
  const [editingId, setEditingId] = useState(null)
  const [roleUserId, setRoleUserId] = useState(null)
  const [passwordUserId, setPasswordUserId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const perPage = 10
  const listParams = useMemo(() => ({ page, per_page: perPage }), [page, perPage])
  const { data: listData, isLoading, isFetching, error } = useAdminUsersList(listParams)
  const { data: stats } = useAdminUserStatistics()
  const {
    data: roles,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useAdminRoles({ enabled: roleOpen })
  const roleOptions = roles ?? []

  useEffect(() => {
    if (roleOpen) {
      refetchRoles()
    }
  }, [roleOpen, refetchRoles])
  const { data: editingUserData } = useAdminUser(editingId, { enabled: !!editingId && editOpen })

  const createMutation = useCreateAdminUser({
    onSuccess: () => {
      setCreateOpen(false)
      setCreateForm(DEFAULT_CREATE)
    },
  })

  const updateMutation = useUpdateAdminUser({
    onSuccess: () => {
      setEditOpen(false)
      setEditingId(null)
      setEditForm(DEFAULT_EDIT)
    },
  })

  const deleteMutation = useDeleteAdminUser({
    onSuccess: () => {
      setDeleteOpen(false)
      setDeleteForm(DEFAULT_DELETE)
    },
  })

  const bulkMutation = useBulkStatusUpdate({
    onSuccess: () => {
      setBulkOpen(false)
      setBulkForm(DEFAULT_BULK)
      setSelectedIds(new Set())
    },
  })

  const assignRoleMutation = useAssignRole({
    onSuccess: () => {
      setRoleOpen(false)
      setRoleForm(DEFAULT_ROLE)
      setRoleUserId(null)
    },
  })

  const activateMutation = useActivateAdminUser()
  const deactivateMutation = useDeactivateAdminUser()
  const passwordMutation = useResetUserPassword({
    onSuccess: () => {
      setPasswordOpen(false)
      setPasswordForm(DEFAULT_PASSWORD)
      setPasswordUserId(null)
    },
  })

  // Helper to patch all admin-users list caches for instant UI updates
  const patchAdminUserLists = (updater) => {
    const queries = queryClient.getQueriesData({ predicate: (query) => query.queryKey?.[0] === 'admin-users' })
    queries.forEach(([key, value]) => {
      if (!value || !Array.isArray(value.users)) return
      const next = updater(value)
      if (next) queryClient.setQueryData(key, next)
    })
  }

  useEffect(() => {
    if (editingUserData) {
      setEditForm({
        username: editingUserData.username || '',
        email: editingUserData.email || '',
        status: editingUserData.status || 'active',
        full_name: editingUserData?.profile?.full_name || '',
      })
    }
  }, [editingUserData])

  const users = listData?.users ?? []
  const pagination = listData?.pagination ?? { currentPage: page, lastPage: page, total: users.length }

  const filtered = useMemo(() => {
    if (!query.trim()) return users
    const value = query.toLowerCase()
    return users.filter((u) => u.username?.toLowerCase().includes(value) || u.status?.toLowerCase().includes(value))
  }, [users, query])

  useEffect(() => {
    setSelectedIds(new Set())
  }, [page])

  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIds.has(u.id))

  function toggleSelect(userId) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) {
        next.delete(userId)
      } else {
        next.add(userId)
      }
      return next
    })
  }

  function toggleSelectAll(checked) {
    if (checked) {
      setSelectedIds(new Set(filtered.map((u) => u.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  function handleCreateSubmit(e) {
    e.preventDefault()
    createMutation.mutate({
      username: createForm.username,
      password: createForm.password,
      email: createForm.email || undefined,
      status: createForm.status,
      profile: { full_name: createForm.full_name },
    })
  }

  function handleEditSubmit(e) {
    e.preventDefault()
    if (!editingId) return
    const payload = {
      username: editForm.username,
      email: editForm.email,
      status: editForm.status,
      profile: { full_name: editForm.full_name },
    }
    updateMutation.mutate({ userId: editingId, payload })
  }

  function handleDelete() {
    if (!deleteForm.userId) return
    // Optimistic remove
    patchAdminUserLists((old) => {
      const users = (old.users || []).filter((u) => u.id !== deleteForm.userId)
      const pagination = old.pagination
        ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? users.length) - 1) }
        : undefined
      return { ...old, users, pagination }
    })
    deleteMutation.mutate({ userId: deleteForm.userId, reason: deleteForm.reason || 'Administrative cleanup' })
  }

  function handleBulkSubmit(e) {
    e.preventDefault()
    if (!selectedIds.size) return
    const ids = new Set(selectedIds)
    patchAdminUserLists((old) => ({
      ...old,
      users: (old.users || []).map((u) => (ids.has(u.id) ? { ...u, status: bulkForm.status } : u)),
    }))
    bulkMutation.mutate({
      user_ids: Array.from(selectedIds),
      status: bulkForm.status,
      reason: bulkForm.reason || null,
    })
  }

  function handleAssignRole(e) {
    e.preventDefault()
    if (!roleUserId || !roleForm.roleId) return
    const normalizedRoleId = /^\d+$/.test(roleForm.roleId) ? Number(roleForm.roleId) : roleForm.roleId
    assignRoleMutation.mutate({ userId: roleUserId, roleId: normalizedRoleId, reason: roleForm.reason || null })
  }

  function handlePasswordSubmit(e) {
    e.preventDefault()
    if (!passwordUserId) return
    passwordMutation.mutate({
      userId: passwordUserId,
      payload: passwordForm,
    })
  }

  function handleStatusToggle(user) {
    if (user.status === 'active') {
      patchAdminUserLists((old) => ({
        ...old,
        users: (old.users || []).map((u) => (u.id === user.id ? { ...u, status: 'inactive' } : u)),
      }))
      deactivateMutation.mutate({ userId: user.id, reason: 'Deactivated via UI toggle' })
    } else {
      patchAdminUserLists((old) => ({
        ...old,
        users: (old.users || []).map((u) => (u.id === user.id ? { ...u, status: 'active' } : u)),
      }))
      activateMutation.mutate(user.id)
    }
  }

  const statsCards = [
    { label: 'Total Pengguna', value: stats?.total_users ?? 0, icon: Users, tone: 'bg-slate-50 text-slate-900' },
    { label: 'Aktif', value: stats?.active_users ?? 0, icon: ShieldCheck, tone: 'bg-emerald-50 text-emerald-900' },
    { label: 'Nonaktif', value: stats?.inactive_users ?? 0, icon: RefreshCcw, tone: 'bg-amber-50 text-amber-900' },
  ]

  return (
    <MainLayout>
      <div className="w-full mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-heading-2 font-semibold">Manajemen Pengguna</h2>
              <p className="text-body-md text-muted-foreground">Integrasi penuh dengan Admin User Management API.</p>
            </div>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari username / status" className="w-full md:w-60" />
              <div className="flex gap-2">
                <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" disabled={!selectedIds.size}>Ubah Status Massal</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ubah Status Massal</DialogTitle>
                      <DialogDescription>{selectedIds.size} pengguna dipilih</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleBulkSubmit} className="grid gap-3">
                      <Select value={bulkForm.status} onValueChange={(status) => setBulkForm((prev) => ({ ...prev, status }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <textarea className="border rounded-md p-2 text-sm" rows={3} placeholder="Alasan (opsional)" value={bulkForm.reason} onChange={(e) => setBulkForm((prev) => ({ ...prev, reason: e.target.value }))} />
                      <DialogFooter>
                        <Button type="submit" disabled={bulkMutation.isLoading}>
                          {bulkMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 text-white"><UserPlus className="w-4 h-4 mr-2" />Tambah Pengguna</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Pengguna Baru</DialogTitle>
                      <DialogDescription>Lengkapi data minimum sesuai API.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateSubmit} className="grid gap-3">
                      <Input required placeholder="Username" value={createForm.username} onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))} />
                      <Input type="email" placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} />
                      <Input required type="password" placeholder="Password" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} />
                      <Input required placeholder="Nama Lengkap" value={createForm.full_name} onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                      <Select value={createForm.status} onValueChange={(status) => setCreateForm((prev) => ({ ...prev, status }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <DialogFooter>
                        <Button type="submit" disabled={createMutation.isLoading}>
                          {createMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statsCards.map(({ label, value, icon: Icon, tone }) => (
              <Card key={label} className={tone}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{label}</CardTitle>
                  <Icon className="w-5 h-5" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Gagal memuat pengguna. {error.message}
          </div>
        )}

        <Card>
          <CardContent>
            <div className="flex items-center justify-between py-4 text-sm text-muted-foreground">
              <div>
                {isFetching ? 'Memuat data...' : `${pagination.total ?? users.length} pengguna`} · {selectedIds.size} dipilih
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Sebelumnya</Button>
                <div>Halaman {pagination.currentPage} / {pagination.lastPage}</div>
                <Button variant="outline" size="sm" disabled={pagination.currentPage >= pagination.lastPage} onClick={() => setPage((p) => p + 1)}>Berikutnya</Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleSelectAll(!!checked)} aria-label="Pilih semua" />
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleSelect(user.id)} aria-label="Pilih pengguna" />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground">ID: {user.id}</div>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {user.status || 'unknown'}
                        </span>
                      </TableCell>
                      <TableCell>{user.created_at ? new Date(user.created_at).toLocaleString() : '–'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/users/${user.id}`} className="text-blue-600 text-sm">Detail</Link>
                          <Button variant="outline" size="sm" onClick={() => { setEditingId(user.id); setEditOpen(true) }}>
                            <Edit2 className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStatusToggle(user)} disabled={activateMutation.isLoading || deactivateMutation.isLoading}>
                            {user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setRoleUserId(user.id); setRoleOpen(true) }}>
                            Role
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { setPasswordUserId(user.id); setPasswordOpen(true) }}>
                            <KeyRound className="w-4 h-4 mr-1" /> Password
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setDeleteForm({ userId: user.id, reason: '' }); setDeleteOpen(true) }}>
                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && !filtered.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Tidak ada data.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit */}
        <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingId(null); setEditForm(DEFAULT_EDIT) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Pengguna</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="grid gap-3">
              <Input required placeholder="Username" value={editForm.username} onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))} />
              <Input type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
              <Input placeholder="Nama Lengkap" value={editForm.full_name} onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))} />
              <Select value={editForm.status} onValueChange={(status) => setEditForm((prev) => ({ ...prev, status }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isLoading}>
                  {updateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete */}
        <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteForm(DEFAULT_DELETE) }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Pengguna</DialogTitle>
              <DialogDescription>Penghapusan mengikuti kebijakan audit & akan mencatat alasan.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <textarea className="border rounded-md p-2 text-sm" rows={3} placeholder="Alasan penghapusan" value={deleteForm.reason} onChange={(e) => setDeleteForm((prev) => ({ ...prev, reason: e.target.value }))} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
                <Button className="bg-red-600 text-white" onClick={handleDelete} disabled={deleteMutation.isLoading}>
                  {deleteMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Role */}
        <Dialog open={roleOpen} onOpenChange={(open) => { setRoleOpen(open); if (!open) { setRoleForm(DEFAULT_ROLE); setRoleUserId(null) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Atur Role</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignRole} className="grid gap-3">
              <Select
                value={roleForm.roleId}
                onValueChange={(roleId) => setRoleForm((prev) => ({ ...prev, roleId }))}
                disabled={isRolesLoading || isRolesError || !roleOptions.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isRolesLoading ? 'Memuat role...' : 'Pilih Role'} />
                </SelectTrigger>
                <SelectContent>
                  {isRolesLoading && <SelectItem disabled value="__loading">Memuat daftar role...</SelectItem>}
                  {!isRolesLoading &&
                    roleOptions.map((role) => {
                      const value = String(role.id ?? role.name)
                      return (
                        <SelectItem key={value} value={value}>
                          {role.display_name || role.name || value}
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
              {isRolesError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2 flex items-center justify-between gap-2">
                  <span>{rolesError?.response?.data?.message || 'Gagal memuat role.'}</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-rose-600" onClick={() => refetchRoles()}>
                    Coba lagi
                  </Button>
                </div>
              )}
              {!isRolesLoading && !isRolesError && !roleOptions.length && (
                <div className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-2">
                  Belum ada role yang tersedia. Tambahkan role baru melalui modul administrasi terlebih dahulu.
                </div>
              )}
              <textarea className="border rounded-md p-2 text-sm" rows={3} placeholder="Catatan (opsional)" value={roleForm.reason} onChange={(e) => setRoleForm((prev) => ({ ...prev, reason: e.target.value }))} />
              <DialogFooter>
                <Button type="submit" disabled={assignRoleMutation.isLoading}>
                  {assignRoleMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Reset Password */}
        <Dialog open={passwordOpen} onOpenChange={(open) => { setPasswordOpen(open); if (!open) { setPasswordForm(DEFAULT_PASSWORD); setPasswordUserId(null) } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit} className="grid gap-3">
              <Input required type="password" placeholder="Password baru" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} />
              <Input required type="password" placeholder="Konfirmasi password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))} />
              <textarea className="border rounded-md p-2 text-sm" rows={3} placeholder="Alasan (opsional)" value={passwordForm.reason} onChange={(e) => setPasswordForm((prev) => ({ ...prev, reason: e.target.value }))} />
              <DialogFooter>
                <Button type="submit" disabled={passwordMutation.isLoading}>
                  {passwordMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
