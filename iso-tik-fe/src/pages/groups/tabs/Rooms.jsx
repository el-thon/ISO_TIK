import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { useCreateGroupRoom, useGroupRooms } from '@/services/groupHooks'
import { Link } from 'react-router-dom'

const visibilityOptions = [
  { label: 'Private', value: 'private' },
  { label: 'Group-wide', value: 'group-wide' },
  { label: 'Org-wide', value: 'org-wide' },
]

const DEFAULT_SECURITY_LEVEL = 'L1'

export default function Rooms({ groupId, onCountChange }) {
  const { data, isLoading, isError, isSuccess, refetch } = useGroupRooms(groupId, { enabled: Boolean(groupId) })
  const rooms = data?.rooms ?? []
  const roomCount = useMemo(() => {
    if (typeof data?.total === 'number') return data.total
    return rooms.length
  }, [data?.total, rooms.length])
  const groupMetadata = data?.group ?? null
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!isSuccess || typeof roomCount !== 'number' || !onCountChange) return
    onCountChange(roomCount)
  }, [isSuccess, roomCount, onCountChange])
  const roomForm = useForm({
    defaultValues: {
      name: '',
      description: '',
      visibility: 'group-wide',
      responsible_user_id: '',
    },
  })

  const createRoomMutation = useCreateGroupRoom(groupId, {
    onSuccess: async () => {
      roomForm.reset({ name: '', description: '', visibility: 'group-wide', responsible_user_id: '' })
      setOpen(false)
      // Pastikan daftar rooms langsung diperbarui tanpa reload manual
      await refetch()
    },
  })

  const submitRoom = (values) => {
    createRoomMutation.mutate({ ...values, security_level: DEFAULT_SECURITY_LEVEL })
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Ruangan ({roomCount})</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 text-white flex items-center gap-2">
                <Plus /> Buat Ruangan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat ruangan</DialogTitle>
                <DialogDescription>Ruangan membantu mengorganisir topik di dalam grup.</DialogDescription>
              </DialogHeader>
              <form className="space-y-4" onSubmit={roomForm.handleSubmit(submitRoom)}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nama</label>
                  <Input placeholder="Nama ruangan" {...roomForm.register('name', { required: true })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deskripsi</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    placeholder="Deskripsi singkat"
                    {...roomForm.register('description')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Visibilitas</label>
                  <select
                    className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                    {...roomForm.register('visibility', { required: true })}
                  >
                    {visibilityOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Penanggung jawab (opsional)</label>
                  <Input placeholder="User ID" {...roomForm.register('responsible_user_id')} />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={createRoomMutation.isPending}>
                    {createRoomMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat ruangan...</div>
          ) : isError ? (
            <div className="text-sm text-red-600">Gagal memuat ruangan.</div>
          ) : rooms.length === 0 ? (
            <div className="text-sm text-muted-foreground">Belum ada ruangan.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <Link
                  key={room.id}
                  to={`/rooms/${room.id}`}
                  state={{ fromGroup: { id: groupId, name: groupMetadata?.name ?? room.group?.name ?? 'Group' } }}
                  className="p-4 border rounded-md bg-white block no-underline text-inherit hover:border-blue-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-3/4">
                      <div className="font-medium text-lg">{room.name}</div>
                      <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{room.description || 'Tidak ada deskripsi'}</div>

                      <div className="flex items-center gap-3 mt-4 text-xs text-muted-foreground">
                        <span>Visibilitas: {room.visibility || room.type || 'group-wide'}</span>
                      </div>
                    </div>

                    <div>
                      <span className={`text-xs px-2 py-1 rounded-full ${room.is_archived ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                        {room.is_archived ? 'Arsip' : 'Aktif'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
