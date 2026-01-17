import React, { useMemo, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useTopics } from '@/services/topicHooks'

// Constants
const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed', label: 'Closed' },
]

// Utility functions
const formatDate = (value) => {
  if (!value) return '-'
  
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  
  return date.toLocaleDateString('id-ID', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  })
}

const getInitials = (name) => {
  if (!name) return '??'
  
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0] ? part[0].toUpperCase() : '')
    .slice(0, 2)
    .join('')
}

const getStatusClass = (status) => {
  const normalizedStatus = (status || '').toLowerCase()
  
  switch (normalizedStatus) {
    case 'approved':
      return 'bg-emerald-50 text-emerald-700'
    case 'in_review':
    case 'in review':
      return 'bg-amber-50 text-amber-700'
    case 'changes_requested':
    case 'changes requested':
      return 'bg-rose-50 text-rose-700'
    case 'closed':
      return 'bg-slate-100 text-slate-700'
    default:
      return 'bg-slate-50 text-slate-600'
  }
}

// Skeleton Component
const TopicsSkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, idx) => (
      <Card key={`skeleton-${idx}`}>
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-32 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

// Topic Item Component
const TopicItem = React.memo(({ topic }) => {
  const authorName = topic.created_by?.profile?.full_name 
    || topic.created_by?.name 
    || topic.created_by?.username 
    || 'Tidak diketahui'
  
  const responsibleName = topic.room?.responsible_user?.profile?.full_name 
    || topic.room?.responsible_user?.username

  return (
    <Card>
      <Link to={`/topics/${topic.id}`} className="block no-underline text-inherit">
        <CardContent className="pt-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-lg font-semibold">{topic.title}</div>
                {topic.status && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusClass(topic.status)}`}>
                    {topic.status.replace('_', ' ')}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                {topic.description || 'Belum ada deskripsi'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3 text-xs text-muted-foreground">
                {topic.room?.name && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {topic.room.name}
                  </span>
                )}
                {topic.security_level && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {topic.security_level}
                  </span>
                )}
                {topic.deadline_at && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                    Due {formatDate(topic.deadline_at)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                <Avatar className="w-9 h-9">
                  <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-slate-700">{authorName}</div>
                  <div className="text-xs">Dibuat {formatDate(topic.created_at)}</div>
                </div>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div>Responsible:</div>
              <div className="font-medium text-slate-700 mt-1">{responsibleName || '-'}</div>
              <div className="text-xs mt-4">Diperbarui {formatDate(topic.updated_at)}</div>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
})

TopicItem.displayName = 'TopicItem'

// My Topics Section Component
const MyTopicsSection = React.memo(({ 
  isLoading, 
  isError, 
  error, 
  topics, 
  onRefresh 
}) => {
  const errorMessage = error?.response?.data?.message 
    || error?.message 
    || 'Gagal memuat data.'

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={`my-topic-skeleton-${idx}`} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="text-sm text-rose-600 flex items-center justify-between">
        <span>{errorMessage}</span>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Coba lagi
        </Button>
      </div>
    )
  }

  if (topics.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Belum ada topik yang Anda buat.</p>
    )
  }

  return (
    <div className="divide-y">
      {topics.map((topic) => (
        <Link 
          key={topic.id} 
          to={`/topics/${topic.id}`} 
          className="flex items-center justify-between py-3 hover:text-primary"
        >
          <div>
            <p className="font-medium">{topic.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(topic.updated_at)} • {topic.status || 'draft'}
            </p>
          </div>
          <Button size="sm" variant="ghost">
            Lihat
          </Button>
        </Link>
      ))}
    </div>
  )
})

MyTopicsSection.displayName = 'MyTopicsSection'

// Main Component
export default function TopicsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignedToMe, setAssignedToMe] = useState(false)
  const [createdByMe, setCreatedByMe] = useState(false)
  const [page, setPage] = useState(1)

  // Main topics params
  const params = useMemo(() => ({
    search: search.trim() || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    assigned_to_me: assignedToMe || undefined,
    created_by_me: createdByMe || undefined,
    page,
    per_page: 10,
  }), [search, statusFilter, assignedToMe, createdByMe, page])

  // My topics params (static)
  const myTopicsParams = useMemo(() => ({
    created_by_me: true,
    per_page: 5,
    page: 1,
  }), [])

  // Queries
  const { 
    data, 
    isLoading, 
    isFetching, 
    isError, 
    error, 
    refetch 
  } = useTopics(params)

  const {
    data: myTopicsData,
    isLoading: myTopicsLoading,
    isError: myTopicsError,
    error: myTopicsErrorObj,
    refetch: refetchMyTopics,
  } = useTopics(myTopicsParams, { 
    keepPreviousData: true,
    // Tambahkan untuk mencegah double fetch
    staleTime: 30000,
    gcTime: 300000,
  })

  // Derived state
  const topics = data?.topics ?? []
  const pagination = data?.pagination ?? {}
  const myTopics = myTopicsData?.topics ?? []
  const emptyState = !isLoading && topics.length === 0
  const errorMessage = error?.response?.data?.message 
    || error?.message 
    || 'Gagal memuat data topik.'

  // Handlers
  const handlePageChange = useCallback((direction) => {
    setPage((prev) => {
      if (direction === 'prev') return Math.max(1, prev - 1)
      if (direction === 'next') return prev + 1
      return prev
    })
  }, [])

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback((value) => {
    setStatusFilter(value)
    setPage(1)
  }, [])

  const handleAssignedToMeChange = useCallback((value) => {
    setAssignedToMe(value)
    setPage(1)
  }, [])

  const handleCreatedByMeChange = useCallback((value) => {
    setCreatedByMe(value)
    setPage(1)
  }, [])

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-heading-2 font-semibold">Topics</h1>
            <p className="text-body-md text-muted-foreground">Kelola seluruh topik lintas ruang</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isFetching} 
              onClick={() => refetch()}
            >
              {isFetching ? 'Menyegarkan...' : 'Refresh'}
            </Button>
            <Link to="/topics/create">
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Tambah Topik
              </Button>
            </Link>
          </div>
        </div>

        {/* My Topics Card */}
        <Card className="mb-8">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold">Topik Buatan Anda</h2>
                <p className="text-sm text-muted-foreground">
                  Pantau cepat 5 topik terbaru yang Anda buat.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={myTopicsLoading} 
                onClick={() => refetchMyTopics()}
              >
                Segarkan
              </Button>
            </div>
            <MyTopicsSection
              isLoading={myTopicsLoading}
              isError={myTopicsError}
              error={myTopicsErrorObj}
              topics={myTopics}
              onRefresh={refetchMyTopics}
            />
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <div className="md:col-span-2">
            <Label htmlFor="topic-search" className="text-sm text-muted-foreground">
              Cari topik
            </Label>
            <Input
              id="topic-search"
              placeholder="Cari berdasarkan judul atau deskripsi"
              value={search}
              onChange={handleSearchChange}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-3 border rounded-md px-3 py-3">
            <label className="flex items-center justify-between text-sm">
              <span>Ditugaskan ke saya</span>
              <Switch
                checked={assignedToMe}
                onCheckedChange={handleAssignedToMeChange}
              />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>Dibuat oleh saya</span>
              <Switch
                checked={createdByMe}
                onCheckedChange={handleCreatedByMeChange}
              />
            </label>
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="p-4 mb-6 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Coba lagi
            </Button>
          </div>
        )}

        {/* Main Content */}
        {isLoading ? (
          <TopicsSkeleton />
        ) : emptyState ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
            Tidak ada topik yang cocok dengan filter saat ini.
          </div>
        ) : (
          <div className="space-y-4">
            {topics.map((topic) => (
              <TopicItem key={topic.id} topic={topic} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {topics.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-8 text-sm text-muted-foreground">
            <div>
              Menampilkan {pagination.from || 0}-{pagination.to || 0} dari {pagination.total || topics.length} topik
              {isFetching && <span className="ml-2 text-xs">Memuat...</span>}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => handlePageChange('prev')}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (pagination.last_page || page) || isFetching}
                onClick={() => handlePageChange('next')}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}