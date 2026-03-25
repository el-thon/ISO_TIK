import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCancelAssignment, useCompleteAssignment } from '@/services/assignmentsHooks'

const STATUS_STYLES = {
  pending: 'bg-amber-50 text-amber-700 border border-amber-200',
  assigned: 'bg-amber-50 text-amber-700 border border-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  cancelled: 'bg-slate-200 text-slate-700 border border-slate-300',
}

const ROUTE_STYLES = {
  review: 'bg-blue-50 text-blue-700 border border-blue-100',
  approval: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
  follow_up: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  escalate_to_responsible: 'bg-rose-50 text-rose-700 border border-rose-100',
}

const formatDate = (value, withTime = false) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const options = withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' }
  return date.toLocaleString('id-ID', options)
}

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

const getDisplayName = (user) =>
  user?.profile?.full_name || user?.full_name || user?.name || user?.username || user?.email || 'Tidak diketahui'

const excerpt = (value, length = 140) => {
  if (!value) return ''
  if (value.length <= length) return value
  return `${value.slice(0, length - 3)}…`
}

const textareaBaseClasses =
  'w-full min-h-[96px] rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

function Textarea({ className, ...props }) {
  return <textarea className={cn(textareaBaseClasses, className)} {...props} />
}

function ListSkeleton({ count = 3 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={`skeleton-${idx}`}>
          <CardContent className="pt-5 space-y-4">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function AssignmentActions({ assignment, currentUserId }) {
  const statusKey = (assignment.status || '').toLowerCase()
  const isPending = statusKey === 'pending' || statusKey === 'assigned'
  const isAssignee = currentUserId && assignment.to_user_id === currentUserId
  const isAssigner = currentUserId && assignment.from_user_id === currentUserId
  const [dialog, setDialog] = useState(null)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState({ reason: '' })

  const completeMutation = useCompleteAssignment({ onSuccess: () => setDialog(null) })
  const cancelMutation = useCancelAssignment({ onSuccess: () => setDialog(null) })

  const closeDialog = () => {
    setDialog(null)
    setFormError(null)
    setForm({ reason: '' })
  }

  const handleCancel = () => {
    if (!form.reason.trim()) {
      setFormError('Alasan pembatalan wajib diisi.')
      return
    }
    cancelMutation.mutate({ assignmentId: assignment.id, payload: { reason: form.reason.trim() } })
  }

  const dialogPending = cancelMutation.isPending

  const showComplete = isPending && isAssignee
  const showCancel = (isAssigner || isAssignee) && isPending

  if (!showComplete && !showCancel) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showComplete && (
        <Button
          size="sm"
          onClick={() => completeMutation.mutate(assignment.id)}
          disabled={completeMutation.isPending}
        >
          {completeMutation.isPending ? 'Memproses…' : 'Selesaikan'}
        </Button>
      )}
      {showCancel && (
        <Button size="sm" variant="ghost" onClick={() => setDialog('cancel')} disabled={dialogPending}>
          Batalkan
        </Button>
      )}

      <Dialog open={dialog === 'cancel'} onOpenChange={(open) => (!open ? closeDialog() : setDialog('cancel'))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan penugasan</DialogTitle>
            <DialogDescription>Berikan alasan pembatalan agar penerima mendapatkan konteks yang jelas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`cancel-${assignment.id}`}>Alasan pembatalan</Label>
            <Textarea
              id={`cancel-${assignment.id}`}
              value={form.reason}
              onChange={(event) => {
                setFormError(null)
                setForm({ reason: event.target.value })
              }}
              placeholder="Contoh: tidak lagi relevan"
            />
            {formError && <p className="text-xs text-rose-600">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeDialog} disabled={dialogPending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Membatalkan…' : 'Konfirmasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function AssignmentList({ query, emptyText, page, onPageChange, perPage = 10, currentUser }) {
  const { data, isLoading, isError, error, refetch, isFetching } = query || {}
  const assignments = data?.assignments ?? []
  const pagination = data?.pagination ?? {}
  const total = pagination.total ?? assignments.length ?? 0
  const hasPagination = total > (pagination.per_page ?? perPage)

  if (isLoading && !data) {
    return <ListSkeleton count={Math.min(perPage, 4)} />
  }

  if (isError) {
    const message = error?.response?.data?.message || error?.message || 'Gagal memuat penugasan.'
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-rose-700">{message}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch?.()}>
          Coba lagi
        </Button>
      </div>
    )
  }

  if (!isLoading && assignments.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="min-h-30 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <p>{emptyText}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const statusKey = (assignment.status || '').toLowerCase()
        const statusClass = STATUS_STYLES[statusKey] || 'bg-slate-100 text-slate-700 border border-slate-200'
        const routeType = assignment.route_type || assignment.routeType || null
        const routeClass = ROUTE_STYLES[routeType] || 'bg-slate-100 text-slate-700 border border-slate-200'
        const topicTitle = assignment.topic?.title || 'Penugasan tanpa judul'
        const description = assignment.note || assignment.topic?.description || excerpt(assignment.comment?.body, 120)
        const roomName = assignment.topic?.forum?.name || assignment.topic?.room?.name
        const dueLabel = formatDate(assignment.due_at, true)
        const linkTarget = assignment.topic?.id
          ? `/formulir/${assignment.topic.id}`
          : assignment.comment?.topic_id
          ? `/formulir/${assignment.comment.topic_id}`
          : null
        const assignerName = getDisplayName(assignment.assigned_by || assignment.from_user)
        const assigneeName = getDisplayName(assignment.assignee || assignment.to_user)

        const card = (
          <Card className="hover:border-blue-200 transition-colors">
            <CardContent className="pt-5 space-y-4">
              <div className="flex flex-wrap items-start gap-3 justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-foreground">{topicTitle}</p>
                  {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {assignment.status && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusClass}`}>
                      {assignment.status.replace(/_/g, ' ')}
                    </span>
                  )}
                  {routeType && <span className={`text-xs px-2 py-1 rounded-full ${routeClass}`}>{routeType.replace(/_/g, ' ')}</span>}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {roomName && (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 border border-slate-200">
                    {roomName}
                  </Badge>
                )}
                {assignment.due_at && (
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    Jatuh tempo {dueLabel}
                  </Badge>
                )}
                {assignment.completed_at && (
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    Selesai {formatDate(assignment.completed_at, true)}
                  </Badge>
                )}
              </div>

              {assignment.comment?.body && (
                <div className="rounded-md bg-slate-50 border border-slate-100 p-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">Konteks komentar</p>
                  <p className="line-clamp-3">{assignment.comment.body}</p>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3 min-w-50">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{getInitials(assignerName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{assignerName}</p>
                    <p className="text-xs text-muted-foreground">Penugasan dibuat {formatDate(assignment.created_at, true)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 min-w-50">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{getInitials(assigneeName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{assigneeName}</p>
                    <p className="text-xs text-muted-foreground">Penerima penugasan</p>
                  </div>
                </div>
                <div className="ml-auto flex flex-wrap gap-2 items-center">
                  {linkTarget && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={linkTarget}>Buka topik</Link>
                    </Button>
                  )}
                  <AssignmentActions assignment={assignment} currentUserId={currentUser?.id} />
                </div>
              </div>
            </CardContent>
          </Card>
        )

        return (
          <div key={assignment.id} className="block text-inherit">
            {card}
          </div>
        )
      })}

      {hasPagination && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-muted-foreground">
          <div>
            Menampilkan {pagination.from ?? 0}-{pagination.to ?? assignments.length} dari {total} penugasan
            {isFetching && <span className="ml-2 text-xs">Memuat…</span>}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(pagination.last_page && page >= pagination.last_page) || isFetching}
              onClick={() => onPageChange?.((pagination.last_page ?? page) > page ? page + 1 : page)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
