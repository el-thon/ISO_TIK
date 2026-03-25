import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAssignTopic } from '@/services/assignmentsHooks'

const ROLE_OPTIONS = [
  { value: 'auditor', label: 'Auditor' },
  { value: 'auditee', label: 'Auditee' },
  { value: 'responsible', label: 'Responsible' },
]

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const initialState = {
  targetId: '',
  assigneeId: '',
  role: ROLE_OPTIONS[0].value,
  urgency: URGENCY_OPTIONS[1].value,
  note: '',
}

export default function AssignmentCreateDialog() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialState)
  const [error, setError] = useState(null)

  const assignTopic = useAssignTopic({
    onSuccess: () => {
      resetForm()
      setOpen(false)
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.message || 'Gagal membuat penugasan.')
    },
  })
  const isLoading = assignTopic.isPending

  const resetForm = () => {
    setForm(initialState)
    setError(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)
    if (!form.targetId.trim() || !form.assigneeId.trim()) {
      setError('ID topik dan penerima wajib diisi.')
      return
    }
    const payload = {
      assignee_id: form.assigneeId.trim(),
      role: form.role,
      urgency: form.urgency,
      note: form.note?.trim() || undefined,
    }
    assignTopic.mutate({ topicId: form.targetId.trim(), payload })
  }

  const actionLabel = useMemo(() => (isLoading ? 'Menyimpan…' : 'Buat penugasan'), [isLoading])

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value)
        if (!value) resetForm()
      }}
    >
      <DialogTrigger asChild>
        <Button>Buat Penugasan</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Penugasan baru</DialogTitle>
            <DialogDescription>Kirimi rekan Anda tugas baru berdasarkan topik yang relevan.</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID Topik</Label>
              <Input
                placeholder="contoh: 9a02-..."
                value={form.targetId}
                onChange={(event) => setForm((prev) => ({ ...prev, targetId: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>ID penerima (UUID)</Label>
              <Input
                placeholder="Masukkan UUID user"
                value={form.assigneeId}
                onChange={(event) => setForm((prev) => ({ ...prev, assigneeId: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Peran</Label>
              <Select value={form.role} onValueChange={(value) => setForm((prev) => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Urgensi</Label>
              <Select value={form.urgency} onValueChange={(value) => setForm((prev) => ({ ...prev, urgency: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih urgensi" />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catatan</Label>
            <Input
              placeholder="Tambahkan instruksi singkat"
              value={form.note}
              onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>
              Tutup
            </Button>
            <Button type="submit" disabled={isLoading}>
              {actionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
