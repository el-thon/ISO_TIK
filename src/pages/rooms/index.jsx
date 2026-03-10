import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
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
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Loader2 } from 'lucide-react'
import { useRooms, useCreateRoom } from '@/services/roomHooks'
import { useMe } from '@/services/authHooks'

const DEFAULT_ROOM_VISIBILITY = 'restricted'

const createRoomSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional().or(z.literal('')),
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
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: meData } = useMe({ staleTime: 60_000 })
  const currentUserId = meData?.id ?? null

  useEffect(() => {
    setPage(1)
  }, [search])

  const params = useMemo(
    () => {
      const p = {
        page,
        per_page: 8,
        my_rooms: true,
      }
      if (search.trim()) p.search = search.trim()
      return p
    },
    [search, page]
  )

  const { data: roomsData, isLoading, isFetching, isError, error, refetch } = useRooms(params)
  const rooms = roomsData?.rooms ?? []
  const pagination = roomsData?.pagination ?? {}

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
            <h1 className="text-heading-2 font-semibold">Forum</h1>
            <p className="text-body-md text-muted-foreground">Kelola forum diskusi dan workspace</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue hover:bg-blue-light text-white flex items-center gap-2">
                <Plus className="w-4 h-4" /> Tambah Forum
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Buat Forum Baru</DialogTitle>
                <DialogDescription>Isi formulir berikut untuk membuat forum diskusi baru.</DialogDescription>
              </DialogHeader>
              <CreateRoomForm
                onSuccess={() => {
                  setDialogOpen(false)
                  refetch()
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="md:col-span-3">
            <Label htmlFor="room-search" className="text-sm text-muted-foreground">
              Cari Forum
            </Label>
            <Input
              id="room-search"
              placeholder="Cari berdasarkan nama atau deskripsi"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        {isError && (
          <div className="p-4 mb-6 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between">
            <span>{error?.response?.data?.message || 'Gagal memuat data forum.'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        )}

        {isLoading ? (
          <RoomsSkeleton />
        ) : emptyState ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
            Belum ada forum yang dapat ditampilkan. Tambahkan forum baru atau ubah filter pencarian.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className={room.is_archived ? 'opacity-80' : ''}>
                  <Link to={`/forum/${room.id}`} className="block no-underline text-inherit">
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
                          <div className="text-sm text-muted-foreground mt-3 line-clamp-3">{room.description || 'Belum ada deskripsi'}</div>

                          <div className="flex flex-wrap gap-2 mt-4 text-xs">
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                              {room.participant_count ?? 0} peserta
                            </span>
                          </div>

                          <div className="border-t my-4" />

                          <div className="text-xs text-muted-foreground mt-3">
                            Dibuat {formatDate(room.created_at)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
              </Card>
            ))}
          </div>
        )}

        {rooms.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-8 text-sm text-muted-foreground">
            <div>
              Menampilkan {pagination.from ?? 0}-{pagination.to ?? 0} dari {pagination.total ?? rooms.length} forum
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

function CreateRoomForm({ onSuccess }) {
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
  }, [reset])

  const createRoomMutation = useCreateRoom({
    onSuccess: (data, variables, context) => {
      resetToDefaults()
      if (onSuccess) onSuccess(data, variables, context)
    },
  })

  const onSubmit = (values) => {
    const payload = {
      name: values.name,
      visibility: 'restricted',
      security_level: 'L1',
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
        <Button type="button" variant="outline" onClick={resetToDefaults} disabled={createRoomMutation.isPending}>
          Reset
        </Button>
        <Button type="submit" disabled={createRoomMutation.isPending}>
          {createRoomMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Buat Forum
        </Button>
      </div>
    </form>
  )
}
