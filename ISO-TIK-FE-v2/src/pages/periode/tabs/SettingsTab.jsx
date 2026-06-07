import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useArchiveForum, useLockForum, useRestoreForum, useUnlockForum, useUpdateForum } from '@/hooks/useForum'
import { useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { toast } from '@/components/ui/use-toast'

export default function SettingsTab({ room, forum: forumProp }) {
  const forum = forumProp ?? room
  const forumId = forum?.id

  const lockMutation = useLockForum(forumId)
  const unlockMutation = useUnlockForum(forumId)
  const archiveMutation = useArchiveForum(forumId)
  const restoreMutation = useRestoreForum(forumId)

  const isActionPending =
    lockMutation.isPending ||
    unlockMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending

  const handleLockToggle = () => {
    if (!forumId) return
    if (forum?.is_locked) {
      unlockMutation.mutate()
    } else {
      lockMutation.mutate()
    }
  }

  const handleArchiveToggle = () => {
    if (!forumId) return
    if (forum?.is_archived) {
      restoreMutation.mutate()
    } else {
      archiveMutation.mutate()
    }
  }

  const infoItems = [
    { label: 'ID Forum', value: forum?.id || '-' },
    { label: 'Status', value: forum?.is_locked ? 'Locked' : 'Unlocked' },
    { label: 'Arsip', value: forum?.is_archived ? 'Archived' : 'Active' },
    { label: 'Peran Saya', value: forum?.user_role || 'Tidak diketahui' },
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
          <UpdateForumDetailsForm forum={forum} />
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-lg">Informasi Forum</h3>
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
            variant={forum?.is_locked ? 'outline' : 'default'}
            onClick={handleLockToggle}
            disabled={!forumId || isActionPending}
          >
            {(lockMutation.isPending || unlockMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {forum?.is_locked ? 'Buka Kunci' : 'Kunci Forum'}
          </Button>
          <Button
            variant={forum?.is_archived ? 'outline' : 'destructive'}
            onClick={handleArchiveToggle}
            disabled={!forumId || isActionPending}
          >
            {(archiveMutation.isPending || restoreMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {forum?.is_archived ? 'Pulihkan' : 'Arsipkan'}
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

function UpdateForumDetailsForm({ forum }) {
  const forumId = forum?.id
  const periodId = forum?.forum_period_id
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: forum?.name || '',
      description: forum?.description || '',
    },
  })

  React.useEffect(() => {
    reset({
      name: forum?.name || '',
      description: forum?.description || '',
    })
  }, [forum?.name, forum?.description, reset])

  const watchedDescription = watch('description') || ''

  const updateMutation = useUpdateForum(forumId, {
    onMutate: async (variables) => {
      if (!forumId) return {}
      await queryClient.cancelQueries({ queryKey: ['forums', forumId] })
      const previousForum = queryClient.getQueryData(['forums', forumId])

      queryClient.setQueryData(['forums', forumId], (old) => ({
        ...(old ?? {}),
        ...previousForum,
        name: variables.name,
        description: variables.description,
      }))

      if (periodId) {
        queryClient.invalidateQueries({ queryKey: ['period', periodId, 'forums'] })
        queryClient.invalidateQueries({ queryKey: ['period', periodId] })
      }

      return { previousForum }
    },
    onError: (err, variables, context) => {
      if (context?.previousForum) {
        queryClient.setQueryData(['forums', forumId], context.previousForum)
      }
      const message = err?.response?.data?.message || err?.message || 'Gagal memperbarui detail forum.'
      toast({ variant: 'destructive', title: 'Gagal', description: message })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      if (periodId) {
        queryClient.invalidateQueries({ queryKey: ['period', periodId, 'forums'] })
        queryClient.invalidateQueries({ queryKey: ['period', periodId] })
      }
    },
    onSuccess: (data) => {
      const resolvedName = data?.name ?? forum?.name ?? ''
      const resolvedDescription = data?.description ?? forum?.description ?? ''
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
      name: forum?.name || '',
      description: forum?.description || '',
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
        <p className="text-sm text-slate-700">
          Perbarui informasi forum agar anggota lebih mudah memahami konteks forum.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="settings-forum-name">Nama Forum</Label>
          <Input
            id="settings-forum-name"
            {...register('name', { required: true, minLength: 3 })}
            className="mt-2"
            placeholder="Contoh: General Discussion"
          />
          {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name.message || 'Nama minimal 3 karakter'}</p>}
        </div>

        <div>
          <Label htmlFor="settings-forum-description">Deskripsi Forum</Label>
          <textarea
            id="settings-forum-description"
            {...register('description', { maxLength: 1000 })}
            rows={4}
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            placeholder="Jelaskan tujuan forum ini, cakupan diskusi, atau panduan singkat untuk peserta..."
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Opsional, maksimal 1000 karakter.</p>
            <p className="text-xs text-muted-foreground">{watchedDescription.length}/1000</p>
          </div>
          {errors.description && <p className="text-xs text-rose-600 mt-1">{errors.description.message || 'Deskripsi maksimal 1000 karakter'}</p>}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={handleCancel} disabled={updateMutation.isPending}>Reset</Button>
        <Button type="submit" disabled={updateMutation.isPending}>
          {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Simpan Perubahan
        </Button>
      </div>
    </form>
  )
}
