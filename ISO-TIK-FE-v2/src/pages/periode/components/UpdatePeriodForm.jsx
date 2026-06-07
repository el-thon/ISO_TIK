import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { useUpdatePeriod } from '@/hooks/usePeriod'
import { updatePeriodSchema } from '../constants'

export default function UpdatePeriodForm({ period, onSuccess }) {
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

  const updatePeriodMutation = useUpdatePeriod(period?.id, {
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
