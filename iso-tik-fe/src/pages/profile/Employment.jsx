import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Edit3, Save, X, Info } from 'lucide-react'
import { useUpdateEmployment } from '@/services/profileHooks'

const Field = ({ label, children }) => (
  <div>
    <div className="text-xs text-muted-foreground">{label}</div>
    {children}
  </div>
)

const toDefaultValues = (employment = {}) => ({
  employee_id: employment.employee_id || '',
  lecturer_id: employment.lecturer_id || '',
  student_id: employment.student_id || '',
  faculty: employment.faculty || '',
  department: employment.department || '',
  study_program: employment.study_program || '',
  unit: employment.unit || '',
  office_location: employment.office_location || '',
  functional_position: employment.functional_position || '',
  structural_position: employment.structural_position || '',
  rank_grade: employment.rank_grade || '',
  employment_status: employment.employment_status || '',
  employment_start_date: employment.employment_start_date || '',
  employment_end_date: employment.employment_end_date || '',
  highest_education: employment.highest_education || '',
})

const cleanPayload = (obj = {}) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ''))

export default function Employment({ employment, userId }) {
  const [editing, setEditing] = useState(false)
  const [statusMessage, setStatusMessage] = useState(null)
  const defaults = useMemo(() => toDefaultValues(employment), [employment])
  const form = useForm({ defaultValues: defaults })

  const updateEmployment = useUpdateEmployment({
    onSuccess: () => {
      setStatusMessage({ type: 'success', text: 'Data kepegawaian diperbarui' })
      setEditing(false)
    },
    onError: (error) => {
      const message = error?.response?.data?.message || 'Gagal memperbarui data kepegawaian'
      setStatusMessage({ type: 'error', text: message })
    },
  })

  useEffect(() => {
    form.reset(toDefaultValues(employment))
  }, [employment, form])

  const onSubmit = async (values) => {
    setStatusMessage(null)
    const payload = cleanPayload(values)
    if (!userId) {
      setStatusMessage({ type: 'error', text: 'userId tidak tersedia untuk update employment' })
      return
    }
    try {
      await updateEmployment.mutateAsync({ userId, payload })
    } catch (_) {
      // handled in onError
    }
  }

  const messageColor = statusMessage?.type === 'success' ? 'text-emerald-600' : 'text-red-600'
  const statusOptions = [
    { value: 'permanent', label: 'Tetap' },
    { value: 'contract', label: 'Kontrak' },
    { value: 'honorary', label: 'Honorer' },
  ]

  const renderReadValue = (value) => (
    <div className="font-medium text-sm text-foreground wrap-break-word">{value || '-'}</div>
  )

  const renderInput = (name, placeholder = '') => (
    <Input
      className="mt-1"
      placeholder={placeholder}
      disabled={!editing || updateEmployment.isPending}
      {...form.register(name)}
    />
  )

  const renderDate = (name) => (
    <Input
      className="mt-1"
      type="date"
      disabled={!editing || updateEmployment.isPending}
      {...form.register(name)}
    />
  )

  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Informasi Kepegawaian</h3>
              <p className="text-xs text-muted-foreground">Data ini berasal dari sistem HR / akademik</p>
            </div>
            <div className="flex gap-2">
              {!editing ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={() => setEditing(true)}
                  disabled={!userId}
                >
                  <Edit3 className="w-4 h-4" /> Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      form.reset(defaults)
                      setEditing(false)
                      setStatusMessage(null)
                    }}
                    disabled={updateEmployment.isPending}
                  >
                    <X className="w-4 h-4" /> Batal
                  </Button>
                  <Button
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={updateEmployment.isPending}
                  >
                    {updateEmployment.isPending ? 'Menyimpan...' : (<><Save className="w-4 h-4" /> Simpan</>)}
                  </Button>
                </>
              )}
            </div>
          </div>

          {!userId && (
            <div className="mb-4 flex items-center gap-2 text-xs text-amber-600">
              <Info className="w-4 h-4" /> Tidak ada userId, update employment dinonaktifkan (hanya SA/UM via endpoint admin).
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field label="NIP / Employee ID">
              {editing ? renderInput('employee_id') : renderReadValue(form.watch('employee_id'))}
            </Field>
            <Field label="NIDN / Lecturer ID">
              {editing ? renderInput('lecturer_id') : renderReadValue(form.watch('lecturer_id') || form.watch('student_id'))}
            </Field>
            <Field label="NIM / Student ID">
              {editing ? renderInput('student_id') : renderReadValue(form.watch('student_id'))}
            </Field>
            <Field label="Fakultas">
              {editing ? renderInput('faculty') : renderReadValue(form.watch('faculty'))}
            </Field>
            <Field label="Departemen">
              {editing ? renderInput('department') : renderReadValue(form.watch('department'))}
            </Field>
            <Field label="Program Studi">
              {editing ? renderInput('study_program') : renderReadValue(form.watch('study_program'))}
            </Field>
            <Field label="Unit">
              {editing ? renderInput('unit') : renderReadValue(form.watch('unit'))}
            </Field>
            <Field label="Lokasi Kantor">
              {editing ? renderInput('office_location') : renderReadValue(form.watch('office_location'))}
            </Field>
            <Field label="Jabatan Fungsional">
              {editing ? renderInput('functional_position') : renderReadValue(form.watch('functional_position'))}
            </Field>
            <Field label="Jabatan Struktural">
              {editing ? renderInput('structural_position') : renderReadValue(form.watch('structural_position'))}
            </Field>
            <Field label="Status Kepegawaian">
              {editing ? (
                <Select
                  value={form.watch('employment_status') || undefined}
                  onValueChange={(val) => form.setValue('employment_status', val)}
                  disabled={updateEmployment.isPending}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                renderReadValue(form.watch('employment_status'))
              )}
            </Field>
            <Field label="Tanggal Mulai">
              {editing ? renderDate('employment_start_date') : renderReadValue(form.watch('employment_start_date'))}
            </Field>
            <Field label="Tanggal Selesai">
              {editing ? renderDate('employment_end_date') : renderReadValue(form.watch('employment_end_date'))}
            </Field>
            <Field label="Pendidikan Tertinggi">
              {editing ? renderInput('highest_education') : renderReadValue(form.watch('highest_education'))}
            </Field>
            <Field label="Pangkat / Golongan">
              {editing ? renderInput('rank_grade') : renderReadValue(form.watch('rank_grade'))}
            </Field>
          </div>

          {statusMessage && (
            <p className={`text-xs mt-4 ${messageColor}`}>
              {statusMessage.text}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
