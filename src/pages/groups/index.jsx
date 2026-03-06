import React, { useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Archive, RefreshCcw, Plus, AlertCircle, DoorOpen, LogIn } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useCreateGroup, useGroups, useJoinGroup } from '@/services/groupHooks'
const INITIAL_JOIN_FORM = { code: '' }

import { useMe } from '@/services/authHooks'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  per_page: 15,
  total: 0,
}

const INITIAL_FORM = { 
  name: '', 
  description: '' 
}

const getInitials = (name = '') => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || '??'
}

const toGroupCard = (group, currentUserId) => ({
  id: group.id,
  title: group.name,
  desc: group.description,
  members: group.stats?.member_count ?? group.member_count ?? group.members_count ?? 0,
  rooms: group.stats?.room_count ?? group.room_count ?? 0,
  owner: group.owner?.profile?.full_name || group.owner?.username || 'Unknown',
  initials: getInitials(group.owner?.profile?.full_name || group.owner?.username || group.name),
  is_active: group.is_active ?? true,
  created_at: group.created_at_formatted || '—',
})

export default function GroupsPage() {
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [unauthorizedOpen, setUnauthorizedOpen] = useState(false)
  const [unauthorizedGroup, setUnauthorizedGroup] = useState(null)
  const [unauthorizedMessage, setUnauthorizedMessage] = useState(null)
  const [joinOpen, setJoinOpen] = useState(false)
  const [joinForm, setJoinForm] = useState(INITIAL_JOIN_FORM)
  const [joinError, setJoinError] = useState(null)
  const [joinSuccess, setJoinSuccess] = useState(null)
  const joinGroupMutation = useJoinGroup({
    onSuccess: (data) => {
      setJoinSuccess('Berhasil bergabung ke grup!')
      setJoinError(null)
      setJoinForm(INITIAL_JOIN_FORM)
      setTimeout(() => {
        setJoinOpen(false)
        setJoinSuccess(null)
      }, 1200)
      refetch()
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal join grup. Pastikan kode benar dan Anda belum menjadi anggota.'
      setJoinError(message)
      setJoinSuccess(null)
    },
  })
  const handleJoinSubmit = (event) => {
    event?.preventDefault()
    setJoinError(null)
    setJoinSuccess(null)
    if (!joinForm.code.trim()) {
      setJoinError('Kode join wajib diisi')
      return
    }
    joinGroupMutation.mutate({ code: joinForm.code.trim() })
  }
  const navigate = useNavigate()
  const { data: meData } = useMe()

  const perPage = 9
  const queryParams = useMemo(() => ({ page, per_page: perPage }), [page, perPage])
  
  const { data, isLoading, isError, refetch } = useGroups(queryParams)
  
  const currentUserId = meData?.data?.user?.id || meData?.user?.id || meData?.id
  const groups = useMemo(() => {
    if (!Array.isArray(data?.groups)) return []
    return data.groups.map((group) => toGroupCard(group, currentUserId))
  }, [data, currentUserId])

  const filteredGroups = useMemo(() => {
    if (activeTab === 'all') return groups
    if (activeTab === 'active') return groups.filter(g => g.is_active)
    if (activeTab === 'archived') return groups.filter(g => !g.is_active)
    return groups
  }, [groups, activeTab])

  const totalRooms = useMemo(() => {
    return groups.reduce((sum, group) => sum + group.rooms, 0)
  }, [groups])

  const totalMembers = useMemo(() => {
    return groups.reduce((sum, group) => sum + group.members, 0)
  }, [groups])

  const pagination = data?.pagination ?? DEFAULT_PAGINATION
  const canPrev = pagination.current_page > 1
  const canNext = pagination.current_page < pagination.last_page

  const createGroupMutation = useCreateGroup({
    onSuccess: () => {
      setCreateOpen(false)
      setForm(INITIAL_FORM)
      setFormError(null)
      refetch()
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal membuat grup'
      setFormError(message)
    },
  })

  const handleSubmit = (event) => {
    event?.preventDefault()
    setFormError(null)
    
    if (!form.name.trim()) {
      setFormError('Nama grup wajib diisi')
      return
    }
    
    createGroupMutation.mutate({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
    })
  }

  const handleOpenGroup = (group) => {
    if (!group?.id) return
    navigate(`/groups/${group.id}`)
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} className="animate-pulse">
              <div className="h-32 bg-slate-100" />
            </Card>
          ))}
        </section>
      )
    }

    if (isError) {
      return (
        <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4" /> Gagal memuat data grup
          </div>
          <p className="text-muted-foreground">Periksa koneksi atau coba muat ulang.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Coba lagi
          </Button>
        </div>
      )
    }

    if (filteredGroups.length === 0) {
      return (
        <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
          <p className="text-sm">
            {activeTab === 'all' 
              ? 'Belum ada grup. Buat grup pertama Anda untuk memulai kolaborasi.'
              : activeTab === 'active'
              ? 'Tidak ada grup aktif.'
              : 'Tidak ada grup yang diarsipkan.'}
          </p>
        </div>
      )
    }

    return (
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => handleOpenGroup(g)}
            className="text-left no-underline"
          >
            <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-transform duration-150">
              <div className="px-6 pt-6">
                <div className="flex items-start justify-between w-full">
                  <div>
                    <CardTitle className="text-lg font-semibold capitalize line-clamp-1">
                      {g.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm line-clamp-2">
                      {g.desc || 'Tidak ada deskripsi'}
                    </CardDescription>
                  </div>
                  
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    g.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {g.is_active ? 'Aktif' : 'Arsip'}
                  </span>
                </div>
              </div>

              <CardContent className="pt-0">
                <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2" title="Jumlah anggota">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{g.members}</span>
                    </div>
                    <div className="flex items-center gap-2" title="Jumlah ruangan">
                      <DoorOpen className="w-4 h-4" />
                      <span className="font-medium">{g.rooms}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t pt-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                    <div className="text-sm font-medium mt-1 line-clamp-1">{g.owner}</div>
                    <div className="text-xs text-muted-foreground mt-1">Dibuat {g.created_at}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{g.initials}</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </section>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className="text-heading-2 font-semibold">Grup</h2>
            <p className="text-body-md text-muted-foreground">
              Kelola grup kolaborasi Anda • {groups.length} grup, {totalRooms} ruangan, {totalMembers} anggota
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1" title="Total Grup">
                <Users className="w-4 h-4" />
                <span className="font-medium">{groups.length}</span>
              </div>
              <div className="flex items-center gap-1" title="Total Ruangan">
                <DoorOpen className="w-4 h-4" />
                <span className="font-medium">{totalRooms}</span>
              </div>
              <div className="flex items-center gap-1" title="Total Anggota">
                <Archive className="w-4 h-4" />
                <span className="font-medium">{totalMembers}</span>
              </div>
            </div>
            
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Buat Grup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat Grup</DialogTitle>
                  <DialogDescription>
                    Atur ruang kolaborasi baru untuk tim Anda.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="group-name">Nama Grup *</Label>
                    <Input
                      id="group-name"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Contoh: Tim Infrastruktur"
                      disabled={createGroupMutation.isPending}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="group-desc">Deskripsi (opsional)</Label>
                    <textarea
                      id="group-desc"
                      className="min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="Jelaskan tujuan grup"
                      disabled={createGroupMutation.isPending}
                    />
                  </div>
                  {formError && (
                    <p className="text-sm text-red-600">{formError}</p>
                  )}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                      disabled={createGroupMutation.isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={createGroupMutation.isPending}>
                      {createGroupMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" /> Gabung Grup
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gabung Grup dengan Kode</DialogTitle>
                  <DialogDescription>
                    Masukkan kode join yang diberikan oleh owner/manager grup.
                  </DialogDescription>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleJoinSubmit}>
                  <div className="grid gap-2">
                    <Label htmlFor="join-code">Kode Join *</Label>
                    <Input
                      id="join-code"
                      value={joinForm.code}
                      onChange={(e) => setJoinForm((prev) => ({ ...prev, code: e.target.value }))}
                      placeholder="Masukkan kode join"
                      disabled={joinGroupMutation.isPending}
                    />
                  </div>
                  {joinError && <p className="text-sm text-red-600">{joinError}</p>}
                  {joinSuccess && <p className="text-sm text-green-600">{joinSuccess}</p>}
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setJoinOpen(false)}
                      disabled={joinGroupMutation.isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={joinGroupMutation.isPending}>
                      {joinGroupMutation.isPending ? 'Memproses...' : 'Gabung'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                Semua Grup
                <span className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                  {groups.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                Aktif
                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">
                  {groups.filter(g => g.is_active).length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="archived" className="flex items-center gap-2">
                Arsip
                <span className="text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                  {groups.filter(g => !g.is_active).length}
                </span>
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <DoorOpen className="w-4 h-4" />
                <span>Total Ruangan: </span>
                <span className="font-medium ml-1">
                  {filteredGroups.reduce((sum, g) => sum + g.rooms, 0)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>Total Anggota: </span>
                <span className="font-medium ml-1">
                  {filteredGroups.reduce((sum, g) => sum + g.members, 0)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Archive className="w-4 h-4" />
                <span>Grup: </span>
                <span className="font-medium ml-1">{filteredGroups.length}</span>
              </div>
            </div>
          </Tabs>
        </div>

        {renderContent()}

        {!isLoading && !isError && filteredGroups.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 text-sm text-muted-foreground gap-4">
            <span>
              Halaman {pagination.current_page} dari {pagination.last_page} • 
              Total {pagination.total} grup • {totalRooms} ruangan
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canPrev}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canNext}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={unauthorizedOpen} onOpenChange={setUnauthorizedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Akses ditolak</DialogTitle>
            <DialogDescription>
              {unauthorizedMessage || 'Anda tidak memiliki otorisasi untuk membuka grup ini.'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm text-muted-foreground">
            {unauthorizedGroup?.title ? `Grup: ${unauthorizedGroup.title}` : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnauthorizedOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}