import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useArchiveRoom, useLockRoom, useRestoreRoom, useUnlockRoom, useUpdateRoom } from '@/hooks/useRoom'
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
    <TabsContent value="settings" className="mt-4 space-y-6 w-full">
      <div>
        <h3 className="font-semibold text-lg">Ubah Detail Forum</h3>
        <div className="mt-3 p-4 border rounded-md bg-white">
          <UpdateRoomDetailsForm room={room} />
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

function UpdateRoomDetailsForm({ room }) {
  const roomId = room?.id
  const periodId = room?.forum_period_id
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: room?.name || '',
      description: room?.description || '',
    },
  })

  React.useEffect(() => {
    reset({
      name: room?.name || '',
      description: room?.description || '',
    })
  }, [room?.name, room?.description, reset])

  const watchedDescription = watch('description') || ''

  const updateMutation = useUpdateRoom(roomId, {
    onMutate: async (variables) => {
      if (!roomId) return {}
      await queryClient.cancelQueries({ queryKey: ['rooms', roomId] })
      const previousRoom = queryClient.getQueryData(['rooms', roomId])

      queryClient.setQueryData(['rooms', roomId], (old) => ({
        ...(old ?? {}),
        ...previousRoom,
        name: variables.name,
        description: variables.description,
      }))

      if (periodId) {
        const keyPrefixes = [
          ['ruangan', periodId, 'forums'],
          ['forum-periods', periodId, 'forums'],
        ]

        keyPrefixes.forEach((prefix) => {
          const matching = queryClient.getQueriesData({ queryKey: prefix, exact: false })
          matching.forEach(([key, data]) => {
            if (!data) return
            queryClient.setQueryData(key, (old) => {
              if (!old || !old.forums) return old
              const updated = { ...old }
              updated.forums = (Array.isArray(old.forums) ? old.forums : []).map((f) =>
                f?.id === roomId
                  ? {
                      ...f,
                      name: variables.name,
                      description: variables.description,
                    }
                  : f
              )
              return updated
            })
          })
        })
      }

      return { previousRoom }
    },
    onError: (err, variables, context) => {
      if (context?.previousRoom) {
        queryClient.setQueryData(['rooms', roomId], context.previousRoom)
      }
      const message = err?.response?.data?.message || err?.message || 'Gagal memperbarui detail forum.'
      toast({ variant: 'destructive', title: 'Gagal', description: message })
      if (typeof updateMutation?.onError === 'function') {
        // noop, left for parity
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', roomId] })
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: ['ruangan', periodId, 'forums'] })
        queryClient.invalidateQueries({ queryKey: ['ruangan', periodId] })
        queryClient.invalidateQueries({ queryKey: ['forum-periods', periodId, 'forums'] })
        queryClient.invalidateQueries({ queryKey: ['forum-periods', periodId] })
      }
    },
    onSuccess: (data) => {
      const resolvedName = data?.name ?? room?.name ?? ''
      const resolvedDescription = data?.description ?? room?.description ?? ''
      toast({ title: 'Berhasil', description: 'Detail forum berhasil diperbarui.' })
      reset({
        name: resolvedName,
        description: resolvedDescription,
      })
    },
  })

  const onSubmit = (vals) => {
    if (!vals?.name || vals.name.trim().length < 3) return
    const normalizedDescription = (vals?.description || '').trim()
    if (normalizedDescription.length > 1000) return

    updateMutation.mutate({
      name: vals.name.trim(),
      description: normalizedDescription || null,
    })
  }

  const handleCancel = () => {
    reset({
      name: room?.name || '',
      description: room?.description || '',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
        <p className="text-sm text-slate-700">
          Perbarui informasi forum agar anggota ruangan lebih mudah memahami konteks forum.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="settings-room-name">Nama Forum</Label>
          <Input
            id="settings-room-name"
            {...register('name', { required: true, minLength: 3 })}
            className="mt-2"
            placeholder="Contoh: General Discussion"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message || 'Nama minimal 3 karakter'}</p>}
        </div>

        <div>
          <Label htmlFor="settings-room-description">Deskripsi Forum</Label>
          <textarea
            id="settings-room-description"
            {...register('description', { maxLength: 1000 })}
            rows={4}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            placeholder="Jelaskan tujuan forum ini, cakupan diskusi, atau panduan singkat untuk peserta..."
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Opsional, maksimal 1000 karakter.</p>
            <p className="text-xs text-muted-foreground">{watchedDescription.length}/1000</p>
          </div>
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1">{errors.description.message || 'Deskripsi maksimal 1000 karakter'}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>
          Reset
        </Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}
