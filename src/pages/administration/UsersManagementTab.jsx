import React, { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Trash2, Edit2, KeyRound, UserPlus, ShieldCheck, Users, RefreshCcw, Search, Mail, UserRound } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/hooks/useAuth'
import {
  useActivateAdminUser,
  useAdminRoles,
  useAdminUser,
  useAdminUserStatistics,
  useAdminUsersList,
  useAssignRole,
  useCreateAdminUser,
  useDeactivateAdminUser,
  useDeleteAdminUser,
  useResetUserPassword,
  useUpdateAdminUser,
} from '@/hooks/useAdminUsers'
import { getUserData, isProductOwnerUser } from '@/utils/auth'

const DEFAULT_CREATE = { username: '', email: '', password: '', status: 'active', full_name: '', roleId: '' }
const DEFAULT_EDIT = { username: '', email: '', status: 'active', full_name: '' }
const DEFAULT_PASSWORD = { new_password: '', confirm_password: '', reason: '' }
const DEFAULT_ROLE = { roleId: '', reason: '' }
const DEFAULT_DELETE = { userId: null, reason: '' }
const DEFAULT_BULK = { status: 'inactive', reason: '' }
const roleLabel = (role, fallback) => {
  const name = role?.name || fallback
  const display = role?.display_name
  if (!display || display === name) return name || fallback
  return `${display} (${name})`
}

export default function UsersManagementTab() {
  const queryClient = useQueryClient()
  const { data: meData } = useMe({ staleTime: 60_000 })
  const isProductOwner = useMemo(() => {
    const serverUser = meData?.data?.user ?? meData ?? null
    const localUser = getUserData()
    return isProductOwnerUser(serverUser) || isProductOwnerUser(localUser)
  }, [meData])

  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [roleOpen, setRoleOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE)
  const [editForm, setEditForm] = useState(DEFAULT_EDIT)
  const [passwordForm, setPasswordForm] = useState(DEFAULT_PASSWORD)
  const [roleForm, setRoleForm] = useState(DEFAULT_ROLE)
  const [deleteForm, setDeleteForm] = useState(DEFAULT_DELETE)
  const [editingId, setEditingId] = useState(null)
  const [roleUserId, setRoleUserId] = useState(null)
  const [passwordUserId, setPasswordUserId] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())

  const perPage = 10
  const listParams = useMemo(() => {
    const params = { page, per_page: perPage }
    if (debouncedQuery.trim()) params.search = debouncedQuery.trim()
    if (statusFilter !== 'all') params.status = statusFilter
    return params
  }, [page, debouncedQuery, statusFilter])
  const { data: listData, isLoading, isFetching, error } = useAdminUsersList(listParams)
  const { data: stats } = useAdminUserStatistics()
  const {
    data: roles,
    isLoading: isRolesLoading,
    isError: isRolesError,
    error: rolesError,
    refetch: refetchRoles,
  } = useAdminRoles({ enabled: roleOpen || createOpen })
  const roleOptions = roles ?? []

  useEffect(() => {
    if (roleOpen || createOpen) refetchRoles()
  }, [roleOpen, createOpen, refetchRoles])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
      setPage(1)
      setSelectedIds(new Set())
    }, 5000)

    return () => window.clearTimeout(timeout)
  }, [query])

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

  const patchAdminUserLists = (updater) => {
    const queries = queryClient.getQueriesData({ predicate: (q) => q.queryKey?.[0] === 'admin-users' })
    queries.forEach(([key, value]) => {
      if (!value || !Array.isArray(value.users)) return
      const next = updater(value)
      if (next) queryClient.setQueryData(key, next)
    })
  }

  const derivedEditForm = useMemo(() => {
    return {
      username: editingUserData?.username || '',
      email: editingUserData?.email || '',
      status: editingUserData?.status || 'active',
      full_name: editingUserData?.profile?.full_name || '',
    }
  }, [editingUserData])

  useEffect(() => {
    if (editingUserData && editOpen) {
      const timeout = window.setTimeout(() => setEditForm(derivedEditForm), 0)
      return () => window.clearTimeout(timeout)
    }
  }, [editingUserData, derivedEditForm, editOpen])

  const users = listData?.users ?? []
  const pagination = listData?.pagination ?? { currentPage: page, lastPage: page, total: users.length }

  const filtered = users
  const isSearchPending = query.trim() !== debouncedQuery.trim()

  const selectedIdsForPage = useMemo(() => {
    return selectedIds
  }, [selectedIds, page])

  const allSelected = filtered.length > 0 && filtered.every((u) => selectedIdsForPage.has(u.id))

  const toggleSelect = (userId) => {
    if (isProductOwner) return
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
  }

  const toggleSelectAll = (checked) => {
    if (isProductOwner) return
    if (checked) setSelectedIds(new Set(filtered.map((u) => u.id)))
    else setSelectedIds(new Set())
  }

  const handlePageChange = (nextPage) => {
    setPage(nextPage)
    setSelectedIds(new Set())
  }

  const handleCreateSubmit = (e) => {
    e.preventDefault()
    if (isProductOwner) return
    createMutation.mutate({
      username: createForm.username,
      password: createForm.password,
      email: createForm.email || undefined,
      status: createForm.status,
      role_id: createForm.roleId || undefined,
      profile: { full_name: createForm.full_name },
    })
  }

  const handleEditSubmit = (e) => {
    e.preventDefault()
    if (isProductOwner || !editingId) return
    updateMutation.mutate({
      userId: editingId,
      payload: {
        username: editForm.username,
        email: editForm.email,
        status: editForm.status,
        profile: { full_name: editForm.full_name },
      },
    })
  }

  const handleDelete = () => {
    if (isProductOwner || !deleteForm.userId) return
    patchAdminUserLists((old) => {
      const nextUsers = (old.users || []).filter((u) => u.id !== deleteForm.userId)
      const nextPagination = old.pagination
        ? { ...old.pagination, total: Math.max(0, (old.pagination.total ?? nextUsers.length) - 1) }
        : undefined
      return { ...old, users: nextUsers, pagination: nextPagination }
    })
    deleteMutation.mutate({ userId: deleteForm.userId, reason: deleteForm.reason || 'Administrative cleanup' })
  }

  const handleAssignRole = (e) => {
    e.preventDefault()
    if (isProductOwner || !roleUserId || !roleForm.roleId) return
    const normalizedRoleId = /^\d+$/.test(roleForm.roleId) ? Number(roleForm.roleId) : roleForm.roleId
    assignRoleMutation.mutate({ userId: roleUserId, roleId: normalizedRoleId, reason: roleForm.reason || null })
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (isProductOwner || !passwordUserId) return
    passwordMutation.mutate({ userId: passwordUserId, payload: passwordForm })
  }

  const handleStatusToggle = (user) => {
    if (isProductOwner) return
    if (user.status === 'active') {
      patchAdminUserLists((old) => ({
        ...old,
        users: (old.users || []).map((u) => (u.id === user.id ? { ...u, status: 'inactive' } : u)),
      }))
      deactivateMutation.mutate({ userId: user.id, reason: 'Deactivated via UI toggle' })
      return
    }

    patchAdminUserLists((old) => ({
      ...old,
      users: (old.users || []).map((u) => (u.id === user.id ? { ...u, status: 'active' } : u)),
    }))
    activateMutation.mutate(user.id)
  }

  const normalizedStats = stats?.statistics ?? stats ?? {}
  const statsCards = [
    { label: 'Total Pengguna', value: normalizedStats.total ?? normalizedStats.total_users ?? 0, status: 'all', icon: Users, tone: 'border-slate-200 bg-slate-50 text-slate-900' },
    { label: 'Pengguna Aktif', value: normalizedStats.active ?? normalizedStats.active_users ?? 0, status: 'active', icon: ShieldCheck, tone: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
    { label: 'Pengguna Nonaktif', value: normalizedStats.inactive ?? normalizedStats.inactive_users ?? 0, status: 'inactive', icon: RefreshCcw, tone: 'border-amber-200 bg-amber-50 text-amber-900' },
  ]

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-heading-3 sm:text-heading-2 font-semibold">Manajemen Pengguna</h2>
            <p className="text-body-sm sm:text-body-md text-muted-foreground">Kelola akun pengguna dari panel administrasi.</p>
          </div>
          {!isProductOwner && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white w-full sm:w-auto"><UserPlus className="w-4 h-4 mr-2" />Tambah Pengguna</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Pengguna Baru</DialogTitle>
                  <DialogDescription>Lengkapi identitas akun dan pilih role awal pengguna.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateSubmit} className="grid gap-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="create-full-name">Nama lengkap</Label>
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="create-full-name" required placeholder="Nama pengguna" className="pl-9" value={createForm.full_name} onChange={(e) => setCreateForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-username">Username</Label>
                      <Input id="create-username" required placeholder="username" value={createForm.username} onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="create-email" required type="email" placeholder="nama@kampus.ac.id" className="pl-9" value={createForm.email} onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="create-password">Password</Label>
                      <Input id="create-password" required type="password" placeholder="Minimal 8 karakter" value={createForm.password} onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <Select value={createForm.status} onValueChange={(status) => setCreateForm((prev) => ({ ...prev, status }))}>
                        <SelectTrigger className="w-full"><SelectValue placeholder="Pilih status" /></SelectTrigger>
                        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Role</Label>
                      <Select value={createForm.roleId} onValueChange={(roleId) => setCreateForm((prev) => ({ ...prev, roleId }))} disabled={isRolesLoading || isRolesError || !roleOptions.length}>
                        <SelectTrigger className="w-full"><SelectValue placeholder={isRolesLoading ? 'Memuat role...' : 'Pilih role'} /></SelectTrigger>
                        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                          {isRolesLoading && <SelectItem disabled value="__loading">Memuat daftar role...</SelectItem>}
                          {!isRolesLoading && roleOptions.map((role) => {
                            const value = String(role.id ?? role.name)
                            return <SelectItem key={value} value={value}>{roleLabel(role, value)}</SelectItem>
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {isRolesError && (
                    <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {rolesError?.response?.data?.message || 'Gagal memuat daftar role.'}
                    </div>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Batal</Button>
                    <Button type="submit" disabled={createMutation.isLoading}>{createMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          </div>
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, username, email, NIP, departemen, atau unit"
                className="w-full pl-9 pr-28"
              />
              <Badge variant="outline" className="absolute right-2 top-1/2 -translate-y-1/2 bg-background">
                {isSearchPending ? 'Menunggu 5 detik' : 'Siap'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsCards.map((card) => (
            <Card
              key={card.label}
              role="button"
              tabIndex={0}
              className={`${card.tone} cursor-pointer transition hover:shadow-sm ${statusFilter === card.status ? 'ring-2 ring-ring ring-offset-2' : ''}`}
              onClick={() => {
                setStatusFilter(card.status)
                setPage(1)
                setSelectedIds(new Set())
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setStatusFilter(card.status)
                  setPage(1)
                  setSelectedIds(new Set())
                }
              }}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{card.label}</CardTitle>
                {React.createElement(card.icon, { className: 'size-4 opacity-70' })}
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{card.value}</div>
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
        <CardContent className="p-0 sm:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-0 py-4 text-sm text-muted-foreground">
            <div>{isFetching ? 'Memuat data...' : `${pagination.total ?? users.length} pengguna`} · {statusFilter === 'all' ? 'semua status' : statusFilter} · {selectedIds.size} dipilih</div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => handlePageChange(Math.max(1, page - 1))}>Sebelumnya</Button>
              <div>Halaman {pagination.currentPage} / {pagination.lastPage}</div>
              <Button variant="outline" size="sm" disabled={pagination.currentPage >= pagination.lastPage} onClick={() => handlePageChange(page + 1)}>Berikutnya</Button>
            </div>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox checked={allSelected} onCheckedChange={(checked) => toggleSelectAll(!!checked)} aria-label="Pilih semua" disabled={isProductOwner} />
                  </TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
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
                      <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleSelect(user.id)} aria-label="Pilih pengguna" disabled={isProductOwner} />
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
                      <div className="flex flex-wrap justify-end gap-2">
                        {!isProductOwner && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => { setEditingId(user.id); setEditOpen(true) }}><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
                            <Button variant="outline" size="sm" onClick={() => handleStatusToggle(user)} disabled={activateMutation.isLoading || deactivateMutation.isLoading}>
                              {user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => { setRoleUserId(user.id); setRoleOpen(true) }}>Role</Button>
                            <Button variant="outline" size="sm" onClick={() => { setPasswordUserId(user.id); setPasswordOpen(true) }}><KeyRound className="w-4 h-4 mr-1" /> Password</Button>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setDeleteForm({ userId: user.id, reason: '' }); setDeleteOpen(true) }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                          </>
                        )}
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

          <div className="lg:hidden space-y-3 px-4 sm:px-0 pb-4">
            {isLoading && (
              <div className="py-10 text-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              </div>
            )}

            {!isLoading && filtered.map((user) => (
              <div key={user.id} className="rounded-lg border border-slate-200 p-3 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{user.username}</div>
                    <div className="text-xs text-muted-foreground truncate">ID: {user.id}</div>
                    <div className="text-xs text-muted-foreground mt-1">Dibuat: {user.created_at ? new Date(user.created_at).toLocaleString() : '–'}</div>
                  </div>
                  <Checkbox checked={selectedIds.has(user.id)} onCheckedChange={() => toggleSelect(user.id)} aria-label="Pilih pengguna" disabled={isProductOwner} />
                </div>

                <div className="mt-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${user.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {user.status || 'unknown'}
                  </span>
                </div>

                {!isProductOwner && (
                  <div className="mt-3 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditingId(user.id); setEditOpen(true) }}><Edit2 className="w-4 h-4 mr-1" /> Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleStatusToggle(user)} disabled={activateMutation.isLoading || deactivateMutation.isLoading}>
                      {user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setRoleUserId(user.id); setRoleOpen(true) }}>Role</Button>
                    <Button variant="outline" size="sm" onClick={() => { setPasswordUserId(user.id); setPasswordOpen(true) }}><KeyRound className="w-4 h-4 mr-1" /> Password</Button>
                    <Button variant="outline" size="sm" className="text-red-600 col-span-2 sm:col-span-1" onClick={() => { setDeleteForm({ userId: user.id, reason: '' }); setDeleteOpen(true) }}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button>
                  </div>
                )}
              </div>
            ))}

            {!isLoading && !filtered.length && <div className="py-8 text-center text-muted-foreground">Tidak ada data.</div>}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!isProductOwner && editOpen} onOpenChange={(open) => { setEditOpen(open); if (!open) { setEditingId(null); setEditForm(DEFAULT_EDIT) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Pengguna</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="grid gap-3">
            <Input required placeholder="Username" value={editForm.username} onChange={(e) => setEditForm((prev) => ({ ...prev, username: e.target.value }))} />
            <Input type="email" placeholder="Email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} />
            <Input placeholder="Nama Lengkap" value={editForm.full_name} onChange={(e) => setEditForm((prev) => ({ ...prev, full_name: e.target.value }))} />
            <Select value={editForm.status} onValueChange={(status) => setEditForm((prev) => ({ ...prev, status }))}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <DialogFooter><Button type="submit" disabled={updateMutation.isLoading}>{updateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!isProductOwner && deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); if (!open) setDeleteForm(DEFAULT_DELETE) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>Penghapusan mengikuti kebijakan audit & akan mencatat alasan.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <textarea className="border rounded-md p-2 text-sm" rows={3} placeholder="Alasan penghapusan" value={deleteForm.reason} onChange={(e) => setDeleteForm((prev) => ({ ...prev, reason: e.target.value }))} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
              <Button className="bg-red-600 text-white" onClick={handleDelete} disabled={deleteMutation.isLoading}>{deleteMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!isProductOwner && roleOpen} onOpenChange={(open) => { setRoleOpen(open); if (!open) { setRoleForm(DEFAULT_ROLE); setRoleUserId(null) } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Atur Role</DialogTitle>
            <DialogDescription>Pilih role baru untuk pengguna yang dipilih.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAssignRole} className="grid gap-4">
            <div className="grid gap-2">
              <Label>Role pengguna</Label>
              <Select value={roleForm.roleId} onValueChange={(roleId) => setRoleForm((prev) => ({ ...prev, roleId }))} disabled={isRolesLoading || isRolesError || !roleOptions.length}>
                <SelectTrigger className="w-full"><SelectValue placeholder={isRolesLoading ? 'Memuat role...' : 'Pilih role'} /></SelectTrigger>
                <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
                {isRolesLoading && <SelectItem disabled value="__loading">Memuat daftar role...</SelectItem>}
                {!isRolesLoading && roleOptions.map((role) => {
                  const value = String(role.id ?? role.name)
                  return <SelectItem key={value} value={value}>{roleLabel(role, value)}</SelectItem>
                })}
                </SelectContent>
              </Select>
            </div>
            {isRolesError && (
              <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-md px-3 py-2 flex items-center justify-between gap-2">
                <span>{rolesError?.response?.data?.message || 'Gagal memuat role.'}</span>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-rose-600" onClick={() => refetchRoles()}>Coba lagi</Button>
              </div>
            )}
            {!isRolesLoading && !isRolesError && !roleOptions.length && (
              <div className="text-xs text-muted-foreground border border-dashed rounded-md px-3 py-2">Belum ada role yang tersedia.</div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="role-reason">Catatan</Label>
              <textarea id="role-reason" className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" rows={3} placeholder="Catatan opsional" value={roleForm.reason} onChange={(e) => setRoleForm((prev) => ({ ...prev, reason: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRoleOpen(false)}>Batal</Button>
              <Button type="submit" disabled={assignRoleMutation.isLoading || !roleForm.roleId}>{assignRoleMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!isProductOwner && passwordOpen} onOpenChange={(open) => { setPasswordOpen(open); if (!open) { setPasswordForm(DEFAULT_PASSWORD); setPasswordUserId(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="grid gap-3">
            <Input required type="password" placeholder="Password baru" value={passwordForm.new_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, new_password: e.target.value }))} />
            <Input required type="password" placeholder="Konfirmasi password" value={passwordForm.confirm_password} onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirm_password: e.target.value }))} />
            <textarea className="border rounded-md p-2 text-sm" rows={3} placeholder="Alasan (opsional)" value={passwordForm.reason} onChange={(e) => setPasswordForm((prev) => ({ ...prev, reason: e.target.value }))} />
            <DialogFooter><Button type="submit" disabled={passwordMutation.isLoading}>{passwordMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
