import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'

const STATUS_STYLES = {
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  in_review: 'bg-amber-50 text-amber-700 border border-amber-200',
  draft: 'bg-slate-100 text-slate-700 border border-slate-200',
  changes_requested: 'bg-rose-50 text-rose-700 border border-rose-200',
  closed: 'bg-slate-200 text-slate-700 border border-slate-300',
}

const formatDate = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatStatus = (status) => {
  if (!status) return ''
  return status.replace(/_/g, ' ')
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

export default function AssignmentList({ query, emptyText, page, onPageChange, perPage = 8 }) {
  const { data, isLoading, isError, error, refetch, isFetching } = query || {}
  const topics = data?.topics ?? []
  const pagination = data?.pagination ?? {}
  const total = pagination.total ?? topics.length ?? 0
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

  if (!isLoading && topics.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="min-h-[120px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <p>{emptyText}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const authorName =
          topic.created_by?.profile?.full_name || topic.created_by?.name || topic.created_by?.username || 'Tidak diketahui'
        const roomName = topic.room?.name || 'Tanpa ruangan'
        const statusClass = STATUS_STYLES[(topic.status || '').toLowerCase()] || 'bg-slate-100 text-slate-700'

        return (
          <Link key={topic.id} to={`/topics/${topic.id}`} className="block no-underline text-inherit">
            <Card className="hover:border-blue-200 transition-colors">
              <CardContent className="pt-5">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{topic.title}</p>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {topic.description || 'Belum ada deskripsi untuk topik ini.'}
                      </p>
                    </div>
                    {topic.status && (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusClass}`}>
                        {formatStatus(topic.status)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {topic.room?.name && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {roomName}
                      </span>
                    )}
                    {topic.security_level && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {topic.security_level}
                      </span>
                    )}
                    {topic.deadline_at && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Deadline {formatDate(topic.deadline_at)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{authorName}</p>
                        <p className="text-xs">Dibuat {formatDate(topic.created_at)}</p>
                      </div>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                      Pembaruan terakhir {formatDate(topic.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}

      {hasPagination && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-muted-foreground">
          <div>
            Menampilkan {pagination.from ?? 0}-{pagination.to ?? topics.length} dari {total} penugasan
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
