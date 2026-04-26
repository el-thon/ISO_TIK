import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useCreateForumPeriod } from '@/services/forumPeriodHooks'
import { createPeriodSchema } from '../constants'

export default function CreatePeriodForm({ onSuccess }) {
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