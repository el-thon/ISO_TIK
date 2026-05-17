import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Info } from 'lucide-react'
import { useUpdateEmployment } from '@/hooks/useProfile'
import { Field } from './components/common/Field'

const toDefaultValues = (employment) => {
  const data = employment ?? {}
  return {
    employee_id: data.employee_id || '',
    lecturer_id: data.lecturer_id || '',
    faculty: data.faculty || '',
    department: data.department || '',
    study_program: data.study_program || '',
    unit: data.unit || '',
    office_location: data.office_location || '',
    functional_position: data.functional_position || '',
    structural_position: data.structural_position || '',
    rank_grade: data.rank_grade || '',
    employment_status: data.employment_status || '',
    employment_start_date: data.employment_start_date || '',
    employment_end_date: data.employment_end_date || '',
    highest_education: data.highest_education || '',
  }
}
const cleanPayload = (obj = {}) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

export default function Employment({ employment, onRefetch }) {
  const [editing, setEditing] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const formId = 'employment-form'
  const data = useMemo(() => toDefaultValues(employment), [employment])
  const form = useForm({
    defaultValues: data,
  })

  useEffect(() => {
    form.reset(toDefaultValues(employment))
  }, [employment, form])

  const updateEmployment = useUpdateEmployment({
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Data kepegawaian diperbarui' })
      setEditing(false)
      if (onRefetch) onRefetch()
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal memperbarui data kepegawaian'
      setStatusMessage({ type: 'error', text: message })
    },
  })

  const onSubmit = async (values) => {
    setStatusMessage(null)
    const payload = cleanPayload(values)
    if (!Object.keys(payload).length) {
      setStatusMessage({ type: 'info', text: 'Tidak ada perubahan untuk disimpan' })
      return
    }
    try {
      await updateEmployment.mutateAsync({ payload })
      form.reset(toDefaultValues(employment))
    } catch (error) {
      const message = error?.response?.data?.message || 'Gagal memperbarui data kepegawaian'
      setStatusMessage({ type: 'error', text: message })
    }
  }

  const renderReadValue = (value) => (
    <div className="font-medium text-sm text-foreground wrap-break-word">{value || '-'}</div>
  )

  const fields = [
    { label: 'NIP / Employee ID', value: data.employee_id, name: 'employee_id' },
    { label: 'NIDN / Lecturer ID', value: data.lecturer_id, name: 'lecturer_id' },
    { label: 'Fakultas', value: data.faculty, name: 'faculty' },
    { label: 'Departemen', value: data.department, name: 'department' },
    { label: 'Program Studi', value: data.study_program, name: 'study_program' },
    { label: 'Unit', value: data.unit, name: 'unit' },
    { label: 'Lokasi Kantor', value: data.office_location, name: 'office_location' },
    { label: 'Jabatan Fungsional', value: data.functional_position, name: 'functional_position' },
    { label: 'Jabatan Struktural', value: data.structural_position, name: 'structural_position' },
    { label: 'Status Kepegawaian', value: data.employment_status, name: 'employment_status' },
    { label: 'Tanggal Mulai', value: data.employment_start_date, name: 'employment_start_date' },
    { label: 'Tanggal Selesai', value: data.employment_end_date, name: 'employment_end_date' },
    { label: 'Pendidikan Tertinggi', value: data.highest_education, name: 'highest_education' },
    { label: 'Pangkat / Golongan', value: data.rank_grade, name: 'rank_grade' },
  ]

  const hasData = employment && Object.values(data).some((v) => v)
  const messageColor = statusMessage?.type === 'success'
    ? 'text-emerald-600'
    : statusMessage?.type === 'error'
      ? 'text-red-600'
      : 'text-muted-foreground'

  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Informasi Kepegawaian</h3>
              <p className="text-xs text-muted-foreground">Perbarui data kepegawaian kamu</p>
            </div>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusMessage(null)
                  setEditing(true)
                }}
              >
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => {
                    form.reset(toDefaultValues(employment))
                    setStatusMessage(null)
                    setEditing(false)
                  }}
                  disabled={updateEmployment.isPending}
                >
                  Batal
                </Button>
                <Button
                  size="sm"
                  type="submit"
                  form={formId}
                  disabled={updateEmployment.isPending || !form.formState.isDirty}
                  onClick={() => {
                    return form.handleSubmit(onSubmit)()
                  }}
                >
                  {updateEmployment.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            )}
          </div>
          {!hasData && (
            <div className="mb-4 flex items-center gap-2 text-xs text-amber-600">
              <Info className="w-4 h-4" /> Data kepegawaian belum tersedia untuk akun ini.
            </div>
          )}

          {!editing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <Field key={field.label} label={field.label}>
                  {renderReadValue(field.value)}
                </Field>
              ))}
            </div>
          )}

          {editing && (
            <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <Field key={field.label} label={field.label}>
                  <Input className="mt-1" {...form.register(field.name)} />
                </Field>
              ))}
            </form>
          )}

          {statusMessage && (
            <p className={`text-sm mt-4 ${messageColor}`}>{statusMessage.text}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
