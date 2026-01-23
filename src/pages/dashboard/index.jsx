import React from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary, useMyAssignments, useTopicsNeedingAttention, useUpcomingDeadlines, useDashboardStatistics } from '@/services/dashboardHooks'
import { useMe } from '@/services/authHooks'

const SUMMARY_CARDS = [
  { key: 'active_assignments', label: 'Tugas Aktif', accent: 'bg-blue-50 text-blue-900' },
  { key: 'topics_needing_attention', label: 'Perlu Perhatian', accent: 'bg-yellow-50 text-yellow-900' },
  { key: 'upcoming_deadlines', label: 'Deadline 7 Hari', accent: 'bg-orange-50 text-orange-900' },
  { key: 'unread_notifications', label: 'Notifikasi Belum Dibaca', accent: 'bg-red-50 text-red-900' },
  { key: 'recent_activity', label: 'Aktivitas 30 Hari', accent: 'bg-green-50 text-green-900' },
]

const STATS_CARDS = [
  { key: 'total_assignments', label: 'Total Penugasan' },
  { key: 'completed_assignments', label: 'Selesai' },
  { key: 'active_assignments', label: 'Sedang Berjalan' },
  { key: 'completion_rate', label: 'Completion Rate', suffix: '%' },
  { key: 'on_time_completion_rate', label: 'On-time Rate', suffix: '%' },
  { key: 'average_completion_days', label: 'Rata-rata Hari' },
  { key: 'topics_created', label: 'Topik Dibuat' },
  { key: 'comments_made', label: 'Komentar Dibuat' },
  { key: 'rooms_participated', label: 'Ruang Kolaborasi' },
]

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value) {
  if (!value) return 'Belum ada'
  try {
    return dateTimeFormatter.format(new Date(value))
  } catch (error) {
    return value
  }
}

function SectionState({ isLoading, isError, error, emptyText, children, onRetry, hasContent }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-2/3" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col gap-2 items-start">
        <p className="text-sm text-destructive">{error?.response?.data?.message || 'Gagal memuat data.'}</p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Coba lagi
          </Button>
        )}
      </div>
    )
  }

  if (!hasContent) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>
  }

  return children
}

export default function Dashboard() {
  const { data: meData } = useMe({ staleTime: 1000 * 60 * 5 })
  const user = meData?.data?.user

  const summaryQuery = useDashboardSummary()
  const assignmentsQuery = useMyAssignments()
  const topicsQuery = useTopicsNeedingAttention()
  const deadlinesQuery = useUpcomingDeadlines()
  const statsQuery = useDashboardStatistics()

  const handleRefresh = () => {
    summaryQuery.refetch()
    assignmentsQuery.refetch()
    topicsQuery.refetch()
    deadlinesQuery.refetch()
    statsQuery.refetch()
  }

  const summaryData = summaryQuery.data || {}
  const assignments = assignmentsQuery.data || []
  const topics = topicsQuery.data || []
  const deadlines = deadlinesQuery.data || []
  const stats = statsQuery.data || {}

  return (
    <MainLayout>
      <div className="max-w-full mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-heading-2 font-semibold">Selamat Datang, {user?.name || user?.username || 'Pengguna'}</h1>
            <p className="text-body-md text-muted-foreground">Ringkasan aktivitas & penugasan terbaru Anda.</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            Muat ulang data
          </Button>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {SUMMARY_CARDS.map((card) => (
            <Card key={card.key} className={card.accent}>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground/80">{card.label}</CardTitle>
                {summaryQuery.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : summaryQuery.isError ? (
                  <CardDescription className="text-destructive text-lg">—</CardDescription>
                ) : (
                  <CardDescription className="text-3xl font-semibold text-foreground">
                    {summaryData[card.key] ?? 0}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          ))}
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Pintasan untuk kolaborasi yang sering dilakukan.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/groups"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-10 px-4 bg-navy text-white hover:opacity-95 no-underline"
                >
                  + Buat Grup
                </Link>
                <Link
                  to="/rooms"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-10 px-4 bg-navy text-white hover:opacity-95 no-underline"
                >
                  + Buat Ruangan
                </Link>
                <Link
                  to="/topics/create"
                  className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all h-10 px-4 bg-navy text-white hover:opacity-95 no-underline"
                >
                  + Buat Topik
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>My Assignments</CardTitle>
              <CardDescription>Penugasan aktif yang membutuhkan tindakan.</CardDescription>
            </CardHeader>
            <CardContent>
              <SectionState
                isLoading={assignmentsQuery.isLoading}
                isError={assignmentsQuery.isError}
                error={assignmentsQuery.error}
                onRetry={assignmentsQuery.refetch}
                emptyText="Tidak ada penugasan aktif."
                hasContent={assignments.length > 0}
              >
                <ul className="flex flex-col gap-3">
                  {assignments.map((assignment) => (
                    <li key={assignment.id} className="p-4 border rounded-lg bg-white/80">
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-semibold">{assignment.topic?.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.topic?.room?.name ? `Ruang: ${assignment.topic.room.name}` : 'Tanpa ruang'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Ditugaskan oleh {assignment.assigned_by?.name || 'Sistem'} pada {formatDate(assignment.assigned_at)}
                        </p>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Deadline: {assignment.deadline_at ? formatDate(assignment.deadline_at) : 'Tidak ditentukan'}
                        </span>
                        {assignment.priority && (
                          <span className="text-xs font-semibold uppercase tracking-wide text-navy">{assignment.priority}</span>
                        )}
                      </div>
                      {assignment.notes && (
                        <p className="mt-2 text-sm text-muted-foreground">Catatan: {assignment.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Topics Needing Attention</CardTitle>
              <CardDescription>Topik aktif yang masih menunggu Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <SectionState
                isLoading={topicsQuery.isLoading}
                isError={topicsQuery.isError}
                error={topicsQuery.error}
                onRetry={topicsQuery.refetch}
                emptyText="Tidak ada topik yang membutuhkan perhatian."
                hasContent={topics.length > 0}
              >
                <ul className="flex flex-col gap-3">
                  {topics.map((topic) => (
                    <li key={topic.id} className="p-3 rounded-lg bg-slate-50">
                      <p className="text-sm font-semibold">{topic.title}</p>
                      <p className="text-xs text-muted-foreground">Ruang: {topic.room?.name || 'Tidak tersedia'}</p>
                      <p className="text-xs text-muted-foreground">
                        Dibuat oleh {topic.assigned_by?.name || 'Sistem'} • {topic.deadline_at ? `Deadline ${formatDate(topic.deadline_at)}` : 'Tanpa deadline'}
                      </p>
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Deadlines (7 Hari)</CardTitle>
              <CardDescription>Topik dengan batas waktu terdekat.</CardDescription>
            </CardHeader>
            <CardContent>
              <SectionState
                isLoading={deadlinesQuery.isLoading}
                isError={deadlinesQuery.isError}
                error={deadlinesQuery.error}
                onRetry={deadlinesQuery.refetch}
                emptyText="Tidak ada deadline dalam 7 hari."
                hasContent={deadlines.length > 0}
              >
                <ul className="flex flex-col gap-3">
                  {deadlines.map((deadline) => (
                    <li key={deadline.id} className="p-4 border rounded-lg">
                      <div className="flex flex-col gap-1">
                        <p className="text-sm font-semibold">{deadline.title}</p>
                        <p className="text-xs text-muted-foreground">Ruang: {deadline.room?.name || 'Tidak tersedia'}</p>
                        <p className="text-xs text-muted-foreground">
                          Deadline: {deadline.deadline_at ? formatDate(deadline.deadline_at) : 'Tidak ditentukan'}
                        </p>
                      </div>
                      {typeof deadline.days_until_deadline === 'number' && (
                        <p className="mt-2 text-xs font-medium text-orange-600">
                          {deadline.days_until_deadline >= 0 ? `${deadline.days_until_deadline} hari lagi` : `${Math.abs(deadline.days_until_deadline)} hari lewat`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </SectionState>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Statistics</CardTitle>
              <CardDescription>Metrix produktivitas Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
              ) : statsQuery.isError ? (
                <SectionState
                  isLoading={false}
                  isError
                  error={statsQuery.error}
                  onRetry={statsQuery.refetch}
                  emptyText=""
                  hasContent={false}
                />
              ) : (
                <dl className="grid grid-cols-1 gap-3">
                  {STATS_CARDS.map((card) => (
                    <div key={card.key} className="rounded-lg border p-3">
                      <dt className="text-xs text-muted-foreground">{card.label}</dt>
                      <dd className="text-lg font-semibold">
                        {stats[card.key] ?? '—'}
                        {card.suffix && stats[card.key] !== null && stats[card.key] !== undefined ? card.suffix : ''}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  )
}
