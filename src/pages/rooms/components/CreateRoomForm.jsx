import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useCreateForumPeriodForum } from '@/services/forumPeriodHooks'
import { createRoomSchema } from '../constants'

export default function CreateRoomForm({ onSuccess, selectedPeriodId }) {
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