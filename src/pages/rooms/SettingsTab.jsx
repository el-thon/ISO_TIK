import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useArchiveRoom, useLockRoom, useRestoreRoom, useUnlockRoom, useUpdateRoom } from '@/services/roomHooks'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'

export default function SettingsTab({ room }) {
  const roomId = room?.id

  const lockMutation = useLockRoom(roomId)
  const unlockMutation = useUnlockRoom(roomId)
  const archiveMutation = useArchiveRoom(roomId)
  const restoreMutation = useRestoreRoom(roomId)

  const isActionPending =
    lockMutation.isPending ||
    unlockMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending

  const handleLockToggle = () => {
    if (!roomId) return
    if (room?.is_locked) {
      unlockMutation.mutate()
    } else {
      lockMutation.mutate()
    }
  }

  const handleArchiveToggle = () => {
    if (!roomId) return
    if (room?.is_archived) {
      restoreMutation.mutate()
    } else {
      archiveMutation.mutate()
    }
  }

  const infoItems = [
    { label: 'ID Ruangan', value: room?.id || '-' },
    { label: 'Status', value: room?.is_locked ? 'Locked' : 'Unlocked' },
    { label: 'Arsip', value: room?.is_archived ? 'Archived' : 'Active' },
    { label: 'Peran Saya', value: room?.user_role || 'Tidak diketahui' },
  ]

  const errorMessage =
    lockMutation.error?.response?.data?.message ||
    unlockMutation.error?.response?.data?.message ||
    archiveMutation.error?.response?.data?.message ||
    restoreMutation.error?.response?.data?.message ||
    lockMutation.error?.message ||
    unlockMutation.error?.message ||
    archiveMutation.error?.message ||
    restoreMutation.error?.message

  return (
    <TabsContent value="settings" className="mt-4 space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Ubah Nama Forum</h3>
        <div className="mt-3 p-4 border rounded-md bg-white">
          <UpdateRoomNameForm room={room} />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Informasi Ruangan</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item) => (
            <div key={item.label} className="p-4 border rounded-md bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg">Tindakan</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant={room?.is_locked ? 'outline' : 'default'}
            onClick={handleLockToggle}
            disabled={!roomId || isActionPending}
          >
            {(lockMutation.isPending || unlockMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {room?.is_locked ? 'Buka Kunci' : 'Kunci Ruangan'}
          </Button>
          <Button
            variant={room?.is_archived ? 'outline' : 'destructive'}
            onClick={handleArchiveToggle}
            disabled={!roomId || isActionPending}
          >
            {(archiveMutation.isPending || restoreMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {room?.is_archived ? 'Pulihkan' : 'Arsipkan'}
          </Button>
        </div>
        {errorMessage && (
          <div className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
            {errorMessage}
          </div>
        )}
      </div>
    </TabsContent>
  )
}

function UpdateRoomNameForm({ room }) {
  const roomId = room?.id
  const periodId = room?.forum_period_id
  const queryClient = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { name: room?.name || '' } })

  React.useEffect(() => {
    reset({ name: room?.name || '' })
  }, [room?.name, reset])

  const updateMutation = useUpdateRoom(roomId, {
    // optimistic update: update single-room cache and any forum-periods forum lists
    onMutate: async (variables) => {
      if (!roomId) return {}
      await queryClient.cancelQueries({ queryKey: ['rooms', roomId] })
      const previousRoom = queryClient.getQueryData(['rooms', roomId])

      // optimistically update the room's cache
      queryClient.setQueryData(['rooms', roomId], (old) => ({ ...(old ?? {}), ...previousRoom, name: variables.name }))

      // update any forum-periods forums list that include this room
      if (periodId) {
        const matching = queryClient.getQueriesData({ queryKey: ['forum-periods', periodId, 'forums'], exact: false })
        matching.forEach(([key, data]) => {
          if (!data) return
          queryClient.setQueryData(key, (old) => {
            if (!old || !old.forums) return old
            const updated = { ...old }
            updated.forums = (Array.isArray(old.forums) ? old.forums : []).map((f) => (f?.id === roomId ? { ...f, name: variables.name } : f))
            return updated
          })
        })
      }

      return { previousRoom }
    },
    onError: (err, variables, context) => {
      // rollback
      if (context?.previousRoom) {
        queryClient.setQueryData(['rooms', roomId], context.previousRoom)
      }
      const message = err?.response?.data?.message || err?.message || 'Gagal memperbarui nama forum.'
      toast({ variant: 'destructive', title: 'Gagal', description: message })
      if (typeof updateMutation?.onError === 'function') {
        // noop, left for parity
      }
    },
    onSettled: () => {
      // refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: ['forum-periods', periodId, 'forums'] })
        queryClient.invalidateQueries({ queryKey: ['forum-periods', periodId] })
      }
    },
    onSuccess: (data) => {
      toast({ title: 'Berhasil', description: 'Nama forum diperbarui.' })
      reset({ name: data?.name || '' })
    },
  })

  const onSubmit = (vals) => {
    if (!vals?.name || vals.name.trim().length < 3) return
    updateMutation.mutate({ name: vals.name.trim() })
  }

  const handleCancel = () => {
    reset({ name: room?.name || '' })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="md:col-span-2">
          <Label>Nama Forum</Label>
          <Input {...register('name', { required: true, minLength: 3 })} className="mt-2" />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message || 'Nama minimal 3 karakter'}</p>}
        </div>
        <div className="flex gap-2 md:justify-end mt-2 md:mt-0">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
            Batal
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan
          </Button>
        </div>
      </div>
    </form>
  )
}
