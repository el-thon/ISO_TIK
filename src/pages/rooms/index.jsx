import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import TabsBar from '@/components/mainComponents/tabsBar'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Loader2, ArrowLeft, LogIn, Users, Ticket, LayoutGrid } from 'lucide-react'
import {
  useForumPeriods,
  useForumPeriod,
  useCreateForumPeriod,
  useUpdateForumPeriod,
  useForumPeriodForums,
  useCreateForumPeriodForum,
  useJoinForumPeriod,
} from '@/services/forumPeriodHooks'

const createRoomSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
})

const createPeriodSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  period_type: z.enum(['monthly', 'quarterly', 'semesterly', 'yearly'], {
    required_error: 'Tipe periode wajib dipilih',
  }),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})

const updatePeriodSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').optional().or(z.literal('')),
  period_type: z.enum(['monthly', 'quarterly', 'semesterly', 'yearly']).optional(),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
})

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function RoomsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [editPeriodDialogOpen, setEditPeriodDialogOpen] = useState(false)
  const [joinPeriodDialogOpen, setJoinPeriodDialogOpen] = useState(false)
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false)
  const [accessDeniedName, setAccessDeniedName] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [periodDetailId, setPeriodDetailId] = useState('')
  const [childForumPage, setChildForumPage] = useState(1)
  const childForumsPerPage = 6

  const { data: periodsData, isLoading: periodsLoading } = useForumPeriods()
  const periods = periodsData?.periods ?? []
  const { data: periodDetail, isFetching: periodDetailLoading, isError: periodDetailError, error: periodDetailErr } = useForumPeriod(
    periodDetailId,
    { enabled: Boolean(periodDetailId) }
  )
  const isPeriodDeadlinePassed = Boolean(
    periodDetail?.period?.end_date && new Date(periodDetail.period.end_date) < new Date()
  )
  const canManageSelectedPeriod = !isPeriodDeadlinePassed

  const {
    data: childForumsData,
    isLoading: childForumsLoading,
    isError: childForumsError,
    error: childForumsErr,
    refetch: refetchChildForums,
  } = useForumPeriodForums(
    periodDetailId,
    { page: childForumPage, per_page: childForumsPerPage },
    { enabled: Boolean(periodDetailId) }
  )
  const childForums = childForumsData?.forums ?? []
  const childForumsPagination = childForumsData?.pagination
  const totalChildForumPages = Math.max(1, childForumsPagination?.last_page ?? 1)


  const emptyState = !periodsLoading && periods.length === 0

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-heading-2 font-semibold">Forum</h1>
            <p className="text-body-md text-muted-foreground">Kelola forum diskusi dan workspace</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!selectedPeriodId ? (
              <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-blue hover:bg-blue-light text-white flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Forum
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Buat Forum Period</DialogTitle>
                    <DialogDescription>Atur periode dan deadline (end date) untuk forum period.</DialogDescription>
                  </DialogHeader>
                  <CreatePeriodForm
                    onSuccess={() => {
                      setPeriodDialogOpen(false)
                    }}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="bg-blue hover:bg-blue-light text-white flex items-center gap-2 px-4 py-2"
                    disabled={!canManageSelectedPeriod}
                  >
                    <Plus className="w-4 h-4" /> Tambah Forum
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Buat Forum Child</DialogTitle>
                    <DialogDescription>Isi formulir berikut untuk membuat forum child di periode ini.</DialogDescription>
                  </DialogHeader>
                  <CreateRoomForm
                    selectedPeriodId={selectedPeriodId}
                    onSuccess={() => {
                      setDialogOpen(false)
                      refetchChildForums()
                    }}
                  />
                  {isPeriodDeadlinePassed && (
                    <p className="text-xs text-amber-600 mt-2">Deadline forum period sudah lewat. Forum child hanya bisa dibaca.</p>
                  )}
                </DialogContent>
              </Dialog>
            )}
            <Dialog open={joinPeriodDialogOpen} onOpenChange={setJoinPeriodDialogOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gabung Forum Period</DialogTitle>
                  <DialogDescription>Masukkan kode join untuk bergabung.</DialogDescription>
                </DialogHeader>
                <JoinPeriodForm onSuccess={() => setJoinPeriodDialogOpen(false)} />
              </DialogContent>
            </Dialog>
            <Dialog open={accessDeniedOpen} onOpenChange={setAccessDeniedOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Akses ditolak</DialogTitle>
                  <DialogDescription>
                    Anda belum menjadi anggota forum period
                    {accessDeniedName ? ` "${accessDeniedName}"` : ''}. Silakan join terlebih dahulu.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="px-4 py-2" onClick={() => setAccessDeniedOpen(false)}>
                    Tutup
                  </Button>
                  <Button className="px-4 py-2" onClick={() => {
                    setAccessDeniedOpen(false)
                    setJoinPeriodDialogOpen(true)
                  }}>
                    Join Period
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {periodDetailId && (
          <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Detail Forum Period</span>
            </div>
            {periodDetailLoading && <span>Memuat detail periode...</span>}
            {periodDetailError && (
              <span className="text-rose-600">
                {periodDetailErr?.response?.data?.message || 'Tidak dapat melihat detail periode ini.'}
              </span>
            )}
            {!periodDetailLoading && !periodDetailError && periodDetail?.period && (
              <div className="space-y-1">
                <div className="font-medium">{periodDetail.period.name}</div>
                <div className="text-xs text-muted-foreground">
                  Tipe: {periodDetail.period.period_type || '-'}
                  {' • '}Mulai: {formatDate(periodDetail.period.start_date)}
                  {' • '}Deadline: {formatDate(periodDetail.period.end_date)}
                </div>
                {periodDetail?.current_user_role === 'owner' && (
                  <div className="pt-2">
                    <Dialog open={editPeriodDialogOpen} onOpenChange={setEditPeriodDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="px-4 py-2">Ubah Periode</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Ubah Periode Forum</DialogTitle>
                          <DialogDescription>Perbarui nama, tipe, atau deadline periode.</DialogDescription>
                        </DialogHeader>
                        <UpdatePeriodForm
                          period={periodDetail.period}
                          onSuccess={() => setEditPeriodDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!periodDetailId && (
          periodsLoading ? (
            <RoomsSkeleton />
          ) : emptyState ? (
            <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
              Belum ada forum periode yang dapat ditampilkan. Tambahkan periode baru untuk memulai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {periods.map((period) => {
                const isDisabled = period?.is_related === false
                return (
                  <Card
                    key={period.id}
                    className="cursor-pointer"
                    onClick={() => {
                      if (isDisabled) {
                        setAccessDeniedName(period?.name || '')
                        setAccessDeniedOpen(true)
                        return
                      }
                      setSelectedPeriodId(String(period.id))
                      setPeriodDetailId(String(period.id))
                      setChildForumPage(1)
                    }}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-lg wrap-break-word">{period.name}</div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 whitespace-nowrap">
                              {period.member_count ?? 0} anggota
                            </span>
                            {isDisabled && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 whitespace-nowrap">
                                Belum bergabung
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            Tipe: {period.period_type || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-3">
                            Deadline: {formatDate(period.end_date)}
                          </div>
                        </div>
                        {isDisabled && (
                          <Button
                            size="xs"
                            className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700"
                            onClick={(event) => {
                              event.stopPropagation()
                              setJoinPeriodDialogOpen(true)
                            }}
                          >
                            <LogIn className="w-4 h-4 mr-1" /> Join
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )
        )}

        {periodDetailId && (
          <div className="mt-8">
            <Tabs defaultValue="forums">
              <TabsBar
                items={[
                  { label: 'Forum', value: 'forums', icon: <LayoutGrid className="w-4 h-4" /> },
                  { label: 'Invitation', value: 'invitation', icon: <Ticket className="w-4 h-4" /> },
                ]}
              />

              <TabsContent value="forums">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Forum</h2>
                      <p className="text-xs text-muted-foreground">Daftar forum dalam periode ini.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-4 py-2"
                      onClick={() => {
                        setSelectedPeriodId('')
                        setPeriodDetailId('')
                      }}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </Button>
                  </div>
                {childForumsError && (
                  <div className="p-4 mb-6 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between">
                    <span>{childForumsErr?.response?.data?.message || 'Gagal memuat forum child.'}</span>
                    <Button variant="outline" size="sm" className="px-3 py-1" onClick={() => refetchChildForums()}>
                      Coba lagi
                    </Button>
                  </div>
                )}
                  {childForumsLoading ? (
                    <RoomsSkeleton />
                  ) : childForums.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground bg-white">
                      Belum ada forum di periode ini.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {childForums.map((room) => (
                          <Card key={room.id} className={`transition-shadow hover:shadow-md ${room.is_archived ? 'opacity-80' : ''}`}>
                            <Link to={`/forum/${room.id}`} className="block no-underline text-inherit">
                              <CardContent className="pt-5">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="font-semibold text-lg text-slate-800">{room.name}</div>
                                      {room.is_locked && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Locked</span>
                                      )}
                                      {room.is_archived && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Archived</span>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-3 line-clamp-3">{room.description || 'Belum ada deskripsi'}</div>
                                    <div className="flex flex-wrap gap-2 mt-4 text-xs">
                                      <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                                        {room.participant_count ?? 0} peserta
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Link>
                          </Card>
                        ))}
                      </div>
                      {totalChildForumPages > 1 && (
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                          <Button
                            size="xs"
                            variant="outline"
                            className="px-3 py-1"
                            disabled={childForumPage <= 1}
                            onClick={() => setChildForumPage((prev) => Math.max(1, prev - 1))}
                          >
                            Sebelumnya
                          </Button>
                          <span>
                            {childForumPage} / {totalChildForumPages}
                          </span>
                          <Button
                            size="xs"
                            variant="outline"
                            className="px-3 py-1"
                            disabled={childForumPage >= totalChildForumPages}
                            onClick={() => setChildForumPage((prev) => Math.min(totalChildForumPages, prev + 1))}
                          >
                            Berikutnya
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="invitation">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Ticket className="w-4 h-4" />
                      <span className="font-medium">Kode Join Period</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Bagikan kode ini untuk mengundang user lain.</p>
                    <div className="mt-3 inline-flex items-center rounded-md bg-slate-100 px-3 py-2 font-mono text-sm">
                      {periodDetail?.period?.join_code || 'Belum ada kode'}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Anggota Forum Period</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Daftar anggota yang sudah bergabung.</p>
                    <div className="mt-3 space-y-2 max-h-64 overflow-auto pr-1">
                      {(periodDetail?.members ?? []).length === 0 ? (
                        <div className="text-xs text-muted-foreground">Belum ada anggota.</div>
                      ) : (
                        periodDetail.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-xs">
                            <div>
                              <div className="font-medium text-slate-700">
                                {member.user?.name || member.user?.username || 'User'}
                              </div>
                              <div className="text-muted-foreground">{member.user?.email || member.user?.username || ''}</div>
                            </div>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                              {member.role}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

      </div>
    </MainLayout>
  )
}

function RoomsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx}>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-16 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-32 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CreateRoomForm({ onSuccess, selectedPeriodId }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const resetToDefaults = useCallback(() => {
    reset({
      name: '',
      description: '',
    })
  }, [reset, selectedPeriodId])

  const createRoomMutation = useCreateForumPeriodForum(selectedPeriodId, {
    onSuccess: (data, variables, context) => {
      resetToDefaults()
      if (onSuccess) onSuccess(data, variables, context)
    },
  })

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      visibility: 'restricted',
    }
    
    // Only include description if it's not empty
    if (values.description?.trim()) {
      payload.description = values.description.trim()
    }
    
    createRoomMutation.mutate(payload)
  }

  const mutationError = createRoomMutation.error?.response?.data?.message || createRoomMutation.error?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="room-name">Nama Forum</Label>
        <Input id="room-name" placeholder="Contoh: Infrastruktur & Jaringan" {...register('name')} className="mt-2" />
        {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="room-description">Deskripsi</Label>
        <textarea
          id="room-description"
          rows={4}
          className="mt-2 w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Jelaskan tujuan forum"
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>}
      </div>

      {mutationError && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
          {mutationError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="px-4 py-2" onClick={resetToDefaults} disabled={createRoomMutation.isPending}>
          Reset
        </Button>
        <Button type="submit" className="px-4 py-2" disabled={createRoomMutation.isPending}>
          {createRoomMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Buat Forum
        </Button>
      </div>
    </form>
  )
}

function CreatePeriodForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createPeriodSchema),
    defaultValues: {
      name: '',
      period_type: 'semesterly',
      start_date: '',
      end_date: '',
    },
  })

  const lastSuggestedEndRef = useRef(null)
  const startDate = watch('start_date')
  const periodType = watch('period_type')
  const endDate = watch('end_date')

  useEffect(() => {
    if (!startDate || !periodType) return

    const addMonths = (value, months) => {
      const base = new Date(value)
      if (Number.isNaN(base.getTime())) return null
      const day = base.getDate()
      const result = new Date(base)
      result.setMonth(result.getMonth() + months)
      if (result.getDate() !== day) {
        result.setDate(0)
      }
      return result
    }

    const formatDateInput = (value) => {
      if (!value || Number.isNaN(value.getTime())) return ''
      const year = value.getFullYear()
      const month = String(value.getMonth() + 1).padStart(2, '0')
      const date = String(value.getDate()).padStart(2, '0')
      return `${year}-${month}-${date}`
    }

    const monthsMap = {
      monthly: 1,
      quarterly: 3,
      semesterly: 6,
      yearly: 12,
    }

    const months = monthsMap[periodType]
    if (!months) return

    const suggested = formatDateInput(addMonths(startDate, months))
    if (!suggested) return

    if (!endDate || endDate === lastSuggestedEndRef.current) {
      setValue('end_date', suggested, { shouldDirty: true })
      lastSuggestedEndRef.current = suggested
    }
  }, [startDate, periodType, endDate, setValue])

  const createPeriodMutation = useCreateForumPeriod({
    onSuccess: (data, variables, context) => {
      reset()
      if (onSuccess) onSuccess(data, variables, context)
    },
  })

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      period_type: values.period_type,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
    }

    createPeriodMutation.mutate(payload)
  }

  const mutationError = createPeriodMutation.error?.response?.data?.message || createPeriodMutation.error?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="period-name">Nama Periode</Label>
        <Input id="period-name" placeholder="Contoh: Semester Genap 2026" {...register('name')} className="mt-2" />
        {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="period-type">Tipe Periode</Label>
        <select
          id="period-type"
          className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          {...register('period_type')}
        >
          <option value="monthly">Bulanan</option>
          <option value="quarterly">Triwulan</option>
          <option value="semesterly">Semester</option>
          <option value="yearly">Tahunan</option>
        </select>
        {errors.period_type && <p className="text-xs text-rose-600 mt-1">{errors.period_type.message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="period-start">Tanggal Mulai</Label>
          <Input id="period-start" type="date" {...register('start_date')} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="period-end">Deadline (End Date)</Label>
          <Input id="period-end" type="date" {...register('end_date')} className="mt-2" />
        </div>
      </div>

      {mutationError && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
          {mutationError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" className="px-4 py-2" onClick={() => reset()} disabled={createPeriodMutation.isPending}>
          Reset
        </Button>
        <Button type="submit" className="px-4 py-2" disabled={createPeriodMutation.isPending}>
          {createPeriodMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Periode
        </Button>
      </div>
    </form>
  )
}

function JoinPeriodForm({ onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { code: '' },
  })

  const joinMutation = useJoinForumPeriod({
    onSuccess: (data, variables, context) => {
      reset()
      if (onSuccess) onSuccess(data, variables, context)
    },
  })

  const onSubmit = (values) => {
    joinMutation.mutate({ code: values.code })
  }

  const mutationError = joinMutation.error?.response?.data?.message || joinMutation.error?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="join-period-code">Kode Periode</Label>
        <Input id="join-period-code" placeholder="Contoh: ABC123" {...register('code', { required: true })} className="mt-2" />
        {errors.code && <p className="text-xs text-rose-600 mt-1">Kode wajib diisi</p>}
      </div>

      {mutationError && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
          {mutationError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="px-4 py-2" disabled={joinMutation.isPending}>
          {joinMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Gabung
        </Button>
      </div>
    </form>
  )
}

function UpdatePeriodForm({ period, onSuccess }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updatePeriodSchema),
    defaultValues: {
      name: period?.name || '',
      period_type: period?.period_type || 'semesterly',
      start_date: period?.start_date ? String(period.start_date).slice(0, 10) : '',
      end_date: period?.end_date ? String(period.end_date).slice(0, 10) : '',
    },
  })

  useEffect(() => {
    reset({
      name: period?.name || '',
      period_type: period?.period_type || 'semesterly',
      start_date: period?.start_date ? String(period.start_date).slice(0, 10) : '',
      end_date: period?.end_date ? String(period.end_date).slice(0, 10) : '',
    })
  }, [period, reset])

  const updatePeriodMutation = useUpdateForumPeriod(period?.id, {
    onSuccess: (data, variables, context) => {
      if (onSuccess) onSuccess(data, variables, context)
    },
  })

  const onSubmit = (values) => {
    const payload = {
      name: values.name || undefined,
      period_type: values.period_type || undefined,
      start_date: values.start_date || null,
      end_date: values.end_date || null,
    }

    updatePeriodMutation.mutate(payload)
  }

  const mutationError = updatePeriodMutation.error?.response?.data?.message || updatePeriodMutation.error?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="period-name-edit">Nama Periode</Label>
        <Input id="period-name-edit" placeholder="Contoh: Semester Genap 2026" {...register('name')} className="mt-2" />
        {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="period-type-edit">Tipe Periode</Label>
        <select
          id="period-type-edit"
          className="mt-2 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
          {...register('period_type')}
        >
          <option value="monthly">Bulanan</option>
          <option value="quarterly">Triwulan</option>
          <option value="semesterly">Semester</option>
          <option value="yearly">Tahunan</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="period-start-edit">Tanggal Mulai</Label>
          <Input id="period-start-edit" type="date" {...register('start_date')} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="period-end-edit">Deadline (End Date)</Label>
          <Input id="period-end-edit" type="date" {...register('end_date')} className="mt-2" />
        </div>
      </div>

      {mutationError && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
          {mutationError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" className="px-4 py-2" disabled={updatePeriodMutation.isPending}>
          {updatePeriodMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}

