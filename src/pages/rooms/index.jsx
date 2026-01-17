import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Loader2 } from 'lucide-react'
import { useRooms, useCreateRoom } from '@/services/roomHooks'
import { useGroups } from '@/services/groupHooks'

const visibilityOptions = [
  { value: 'group-wide', label: 'Group-Wide (default)' },
  { value: 'private', label: 'Private' },
  { value: 'org-wide', label: 'Organization Wide' },
]

const GROUP_FILTER_ALL = '__all'
const SECURITY_LEVEL_VALUES = ['L0', 'L1', 'L2', 'L3']
const SECURITY_LEVEL_LABELS = {
  L0: 'Level 0 - Publik',
  L1: 'Level 1 - Internal',
  L2: 'Level 2 - Terbatas',
  L3: 'Level 3 - Rahasia',
}
const DEFAULT_SECURITY_LEVEL = 'L1'
const DEFAULT_SECURITY_LEVEL_OPTIONS = SECURITY_LEVEL_VALUES.map((value) => ({
  value,
  label: SECURITY_LEVEL_LABELS[value] ?? value,
}))

const createRoomSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
  groupId: z.string().min(1, 'Pilih grup tujuan'),
  visibility: z.enum(['group-wide', 'private', 'org-wide']),
  securityLevel: z.enum(SECURITY_LEVEL_VALUES, {
    required_error: 'Pilih level keamanan',
    invalid_type_error: 'Level keamanan tidak valid',
  }),
})

const toSecurityOption = (entry) => {
  if (!entry) return null
  if (typeof entry === 'string') {
    const value = entry.trim()
    if (!value) return null
    return { value, label: SECURITY_LEVEL_LABELS[value] ?? value }
  }

  if (typeof entry === 'object') {
    const value = entry.value ?? entry.code ?? entry.key ?? entry.id ?? entry.slug ?? ''
    if (!value) return null
    const label = entry.label ?? entry.name ?? entry.title ?? SECURITY_LEVEL_LABELS[value] ?? value
    return { value, label }
  }

  return null
}

const dedupeSecurityOptions = (options = []) => {
  const map = new Map()
  options.forEach((option) => {
    if (option?.value && !map.has(option.value)) {
      map.set(option.value, option)
    }
  })
  return Array.from(map.values())
}

const deriveSecurityOptions = (payload = {}, fallbackRooms = []) => {
  const candidateArrays = [
    payload.securityLevels,
    payload.security_levels,
    payload.metadata?.securityLevels,
    payload.metadata?.security_levels,
  ]

  for (const arr of candidateArrays) {
    if (Array.isArray(arr) && arr.length) {
      const normalized = arr.map(toSecurityOption).filter(Boolean)
      if (normalized.length) {
        return dedupeSecurityOptions(normalized)
      }
    }
  }

  const roomsSource = Array.isArray(payload.rooms) && payload.rooms.length ? payload.rooms : fallbackRooms
  if (Array.isArray(roomsSource) && roomsSource.length) {
    const fromRooms = roomsSource
      .map((room) => toSecurityOption(room?.security_level ?? room?.securityLevel))
      .filter(Boolean)
    if (fromRooms.length) {
      return dedupeSecurityOptions(fromRooms)
    }
  }

  return DEFAULT_SECURITY_LEVEL_OPTIONS
}

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

const formatVisibility = (value) => {
  switch (value) {
    case 'private':
      return 'Private'
    case 'org-wide':
      return 'Org-wide'
    case 'group-wide':
    default:
      return 'Group-wide'
  }
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function RoomsPage() {
  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState(GROUP_FILTER_ALL)
  const [onlyMine, setOnlyMine] = useState(false)
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [search, selectedGroupId, onlyMine])

  const params = useMemo(
    () => ({
      search: search.trim() || undefined,
      group_id: selectedGroupId === GROUP_FILTER_ALL ? undefined : selectedGroupId,
      my_rooms: onlyMine || undefined,
      page,
      per_page: 8,
    }),
    [search, selectedGroupId, onlyMine, page]
  )

  const { data: roomsData, isLoading, isFetching, isError, error, refetch } = useRooms(params)
  const rooms = roomsData?.rooms ?? []
  const pagination = roomsData?.pagination ?? {}
  const securityOptions = useMemo(() => deriveSecurityOptions(roomsData, rooms), [roomsData, rooms])

  const { data: groupsData, isLoading: isGroupsLoading } = useGroups(
    { per_page: 100 },
    { staleTime: 120_000 }
  )
  const groupOptions = groupsData?.groups ?? []

  const handlePageChange = (direction) => {
    setPage((prev) => {
      if (direction === 'prev') return Math.max(1, prev - 1)
      if (direction === 'next') return prev + 1
      return prev
    })
  }

  const emptyState = !isLoading && rooms.length === 0

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-heading-2 font-semibold">Rooms</h1>
            <p className="text-body-md text-muted-foreground">Kelola ruangan diskusi dan workspace</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue hover:bg-blue-light text-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah Ruangan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Buat Ruangan Baru</DialogTitle>
                <DialogDescription>Isi formulir berikut untuk membuka ruang diskusi baru.</DialogDescription>
              </DialogHeader>
              <CreateRoomForm
                groups={groupOptions}
                groupsLoading={isGroupsLoading}
                securityOptions={securityOptions}
                onSuccess={() => {
                  setDialogOpen(false)
                  refetch()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="md:col-span-2">
            <Label htmlFor="room-search" className="text-sm text-muted-foreground">
              Cari Ruangan
            </Label>
            <Input
              id="room-search"
              placeholder="Cari berdasarkan nama atau deskripsi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Filter Grup</Label>
            <Select value={selectedGroupId} onValueChange={(value) => setSelectedGroupId(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Semua grup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GROUP_FILTER_ALL}>Semua grup</SelectItem>
                {groupOptions.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <div className="flex items-center gap-3 border rounded-md px-3 py-2 w-full">
              <Switch checked={onlyMine} onCheckedChange={setOnlyMine} id="filter-mine" />
              <Label htmlFor="filter-mine" className="text-sm">Tampilkan ruanganku</Label>
            </div>
          </div>
        </div>

        {isError && (
          <div className="p-4 mb-6 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between">
            <span>{error?.response?.data?.message || 'Gagal memuat data ruangan.'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        )}

        {isLoading ? (
          <RoomsSkeleton />
        ) : emptyState ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
            Belum ada ruangan yang dapat ditampilkan. Tambahkan ruangan baru atau ubah filter pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => {
              const responsibleName = room?.responsible_user?.profile?.full_name || room?.responsible_user?.username || 'Belum ditetapkan'
              const initials = getInitials(responsibleName)
              return (
                <Card key={room.id} className={room.is_archived ? 'opacity-80' : ''}>
                  <Link to={`/rooms/${room.id}`} className="block no-underline text-inherit">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-semibold text-lg">{room.name}</div>
                            {room.is_locked && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Locked</span>
                            )}
                            {room.is_archived && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Archived</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">{room.group?.name || 'Tanpa grup'}</div>
                          <div className="text-sm text-muted-foreground mt-3 line-clamp-3">{room.description || 'Belum ada deskripsi'}</div>

                          <div className="flex flex-wrap gap-2 mt-4 text-xs">
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                              {formatVisibility(room.visibility)}
                            </span>
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                              {room.participant_count ?? 0} peserta
                            </span>
                          </div>

                          <div className="border-t my-4" />

                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xs text-muted-foreground">Responsible</div>
                              <div className="text-sm">{responsibleName}</div>
                            </div>
                          </div>

                          <div className="text-xs text-muted-foreground mt-3">
                            Dibuat {formatDate(room.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        )}

        {rooms.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-8 text-sm text-muted-foreground">
            <div>
              Menampilkan {pagination.from ?? 0}-{pagination.to ?? 0} dari {pagination.total ?? rooms.length} ruangan
              {isFetching && <span className="ml-2 text-xs">Memuat...</span>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => handlePageChange('prev')}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (pagination.last_page ?? page) || isFetching}
                onClick={() => handlePageChange('next')}
              >
                Berikutnya
              </Button>
            </div>
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

function CreateRoomForm({ groups, groupsLoading, securityOptions, onSuccess }) {
  const resolvedSecurityOptions = securityOptions?.length ? securityOptions : DEFAULT_SECURITY_LEVEL_OPTIONS
  const resolvedDefaultSecurityValue = resolvedSecurityOptions[0]?.value ?? DEFAULT_SECURITY_LEVEL

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: '',
      description: '',
      groupId: '',
      visibility: 'group-wide',
      securityLevel: resolvedDefaultSecurityValue,
    },
  })

  const securityLevelValue = watch('securityLevel')

  useEffect(() => {
    if (!resolvedSecurityOptions.length) return
    const fallbackValue = resolvedDefaultSecurityValue
    if (!securityLevelValue) {
      setValue('securityLevel', fallbackValue)
      return
    }
    const exists = resolvedSecurityOptions.some((option) => option.value === securityLevelValue)
    if (!exists) {
      setValue('securityLevel', fallbackValue)
    }
  }, [resolvedSecurityOptions, resolvedDefaultSecurityValue, securityLevelValue, setValue])

  const resetToDefaults = useCallback(() => {
    reset({
      name: '',
      description: '',
      groupId: '',
      visibility: 'group-wide',
      securityLevel: resolvedDefaultSecurityValue,
    })
  }, [reset, resolvedDefaultSecurityValue])

  const createRoomMutation = useCreateRoom({
    onSuccess: (data, variables, context) => {
      resetToDefaults()
      if (onSuccess) onSuccess(data, variables, context)
    },
  })

  const onSubmit = (values) => {
    createRoomMutation.mutate({
      groupId: values.groupId,
      payload: {
        name: values.name,
        description: values.description || null,
        visibility: values.visibility,
        security_level: values.securityLevel,
      },
    })
  }

  const mutationError = createRoomMutation.error?.response?.data?.message || createRoomMutation.error?.message

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="room-name">Nama Ruangan</Label>
        <Input id="room-name" placeholder="Contoh: Infrastruktur & Jaringan" {...register('name')} className="mt-2" />
        {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <Label htmlFor="room-description">Deskripsi</Label>
        <textarea
          id="room-description"
          rows={4}
          className="mt-2 w-full border border-slate-200 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Jelaskan tujuan ruangan"
          {...register('description')}
        />
        {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description.message}</p>}
      </div>

      <div>
        <Label>Grup</Label>
        <Controller
          name="groupId"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={groupsLoading}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder={groupsLoading ? 'Memuat grup…' : 'Pilih grup'} />
              </SelectTrigger>
              <SelectContent>
                {groups?.length ? (
                  groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="__placeholder">Belum ada grup</SelectItem>
                )}
              </SelectContent>
            </Select>
          )}
        />
        {errors.groupId && <p className="text-xs text-rose-600 mt-1">{errors.groupId.message}</p>}
      </div>

      <div>
        <Label>Visibilitas</Label>
        <Controller
          name="visibility"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div>
        <Label>Security Level</Label>
        <Controller
          name="securityLevel"
          control={control}
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih level keamanan" />
              </SelectTrigger>
              <SelectContent>
                {resolvedSecurityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.securityLevel && <p className="text-xs text-rose-600 mt-1">{errors.securityLevel.message}</p>}
      </div>

      {mutationError && (
        <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
          {mutationError}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={resetToDefaults} disabled={createRoomMutation.isPending}>
          Reset
        </Button>
        <Button type="submit" disabled={createRoomMutation.isPending || groupsLoading}>
          {createRoomMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Buat Ruangan
        </Button>
      </div>
    </form>
  )
}
