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
import { useAssignComment, useAssignTopic } from '@/services/assignmentsHooks'

const ROUTE_TYPES = [
  { value: 'review', label: 'Review' },
  { value: 'approval', label: 'Approval' },
  { value: 'follow_up', label: 'Follow Up' },
  { value: 'info', label: 'Informasi' },
]

const TARGET_TYPES = [
  { value: 'topic', label: 'Topik' },
  { value: 'comment', label: 'Komentar' },
]

const initialState = {
  targetType: 'topic',
  targetId: '',
  toUserId: '',
  routeType: ROUTE_TYPES[0].value,
  dueAt: '',
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
  const assignComment = useAssignComment({
    onSuccess: () => {
      resetForm()
      setOpen(false)
    },
    onError: (err) => {
      setError(err?.response?.data?.message || err?.message || 'Gagal membuat penugasan.')
    },
  })

  const isLoading = assignTopic.isPending || assignComment.isPending

  const resetForm = () => {
    setForm(initialState)
    setError(null)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError(null)
    if (!form.targetId.trim() || !form.toUserId.trim()) {
      setError('ID target dan penerima wajib diisi.')
      return
    }
    const payload = {
      to_user_id: form.toUserId.trim(),
      route_type: form.routeType,
      note: form.note?.trim() || undefined,
    }
    if (form.dueAt) {
      const due = new Date(form.dueAt)
      if (!Number.isNaN(due.getTime())) {
        payload.due_at = due.toISOString()
      }
    }

    if (form.targetType === 'comment') {
      assignComment.mutate({ commentId: form.targetId.trim(), payload })
    } else {
      assignTopic.mutate({ topicId: form.targetId.trim(), payload })
    }
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
            <DialogDescription>Kirimi rekan Anda tugas baru berdasarkan topik atau komentar yang relevan.</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Jenis target</Label>
              <Select
                value={form.targetType}
                onValueChange={(value) => setForm((prev) => ({ ...prev, targetType: value, targetId: '' }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {TARGET_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>ID {form.targetType === 'comment' ? 'Komentar' : 'Topik'}</Label>
              <Input
                placeholder={form.targetType === 'comment' ? 'contoh: 21f0-...' : 'contoh: 9a02-...'}
                value={form.targetId}
                onChange={(event) => setForm((prev) => ({ ...prev, targetId: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ID penerima (UUID)</Label>
              <Input
                placeholder="Masukkan UUID user"
                value={form.toUserId}
                onChange={(event) => setForm((prev) => ({ ...prev, toUserId: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Jenis routing</Label>
              <Select value={form.routeType} onValueChange={(value) => setForm((prev) => ({ ...prev, routeType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis" />
                </SelectTrigger>
                <SelectContent>
                  {ROUTE_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Batas waktu (opsional)</Label>
              <Input
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) => setForm((prev) => ({ ...prev, dueAt: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Catatan</Label>
              <Input
                placeholder="Tambahkan instruksi singkat"
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
              />
            </div>
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
