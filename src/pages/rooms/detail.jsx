import React, { useMemo } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { Home } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import TabsBar from '@/components/mainComponents/tabsBar'
import { Tabs } from '@/components/ui/tabs'
import RoomTabsContent from '@/pages/rooms/RoomTabsContent'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoom, useRoomParticipants } from '@/services/roomHooks'
import { useMe } from '@/services/authHooks'

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatVisibility = (value) => {
  switch (value) {
    case 'private':
      return 'Private'
    case 'org-wide':
      return 'Org-wide'
    case 'group-wide':
    default:
      return 'Group-wide'
  }
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

const normalizeRoleKey = (role) => {
  if (!role) return ''
  const cleaned = String(role).toLowerCase().replace(/[^a-z]/g, '')
  if (cleaned === 'auditoree') return 'auditor'
  if (cleaned === 'auditee') return 'auditee'
  if (cleaned === 'owner' || cleaned === 'groupowner') return 'group_owner'
  return cleaned
}

export default function RoomDetail() {
  const { id: roomId } = useParams()
  const location = useLocation()
  const fromGroup = location.state?.fromGroup
  const { data: room, isLoading, isError, error, refetch } = useRoom(roomId)
  const { data: meData } = useMe({ staleTime: 60_000 })
  const currentUserId = meData?.id ?? null
  const {
    data: participantsData,
  } = useRoomParticipants(roomId, { per_page: 200 }, { enabled: Boolean(roomId && currentUserId) })
  const participantRole = useMemo(() => {
    if (!currentUserId) return null
    const participants = participantsData?.participants ?? []
    const match = participants.find((participant) => String(participant.user_id) === String(currentUserId))
    return match?.role || null
  }, [currentUserId, participantsData])

  const stats = room?.stats ?? { participant_count: 0, topic_count: 0 }
  const groupCrumbHref = fromGroup ? `/groups/${fromGroup.id}?tab=rooms` : '/rooms'
  const groupCrumbLabel = fromGroup ? `Grup Room (${fromGroup.name || 'Tanpa nama'})` : 'Ruangan'
  const roleKey = normalizeRoleKey(room?.user_role || room?.role || room?.participant_role || participantRole)
  const canCreateTopic = roleKey === 'auditor' || roleKey === 'group_owner' || roleKey === 'super_admin'
  const showTopicsTab = canCreateTopic
  const defaultTab = showTopicsTab ? 'topics' : 'attachments'

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard" className="inline-flex items-center gap-2">
                    <Home className="w-4 h-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={groupCrumbHref}>{groupCrumbLabel}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage>
                  Detail {room?.name || 'Memuat...'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {isLoading && (
          <RoomDetailSkeleton />
        )}

        {isError && (
          <div className="p-4 mb-4 border border-rose-200 bg-rose-50 rounded-md flex items-center justify-between">
            <div>
              <p className="font-medium text-rose-700">Gagal memuat ruangan</p>
              <p className="text-sm text-rose-600">{error?.response?.data?.message || error?.message || 'Coba beberapa saat lagi.'}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Muat ulang
            </Button>
          </div>
        )}

        {!isLoading && room && (
          <>
            <div className="mb-6">
              <Card className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <CardTitle className="text-heading-3 font-semibold flex flex-wrap items-center gap-2">
                      {room.name}
                      {room.is_locked && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Locked</span>
                      )}
                      {room.is_archived && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Archived</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {room.description || 'Belum ada deskripsi'}
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                        {formatVisibility(room.visibility)}
                      </span>
                      <Link
                        to={room.group?.id ? `/groups/${room.group.id}` : '/groups'}
                        className="text-blue-600 font-medium"
                      >
                        {room.group?.name || 'Lihat grup'}
                      </Link>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <div>
                        <div className="text-xs uppercase tracking-wide">Dibuat</div>
                        <div>{formatDateTime(room.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide">Terakhir diperbarui</div>
                        <div>{formatDateTime(room.updated_at)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {canCreateTopic && (
                      <Link to="/topics/create" state={{ roomId: room.id, roomTitle: room.name }}>
                        <Button size="sm" className="bg-blue-600 text-white">
                          + Create Topic
                        </Button>
                      </Link>
                    )}
                    <Link to="#settings">
                      <Button variant="outline" size="sm">
                        Settings
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Peserta:</span>
                    <span className="font-semibold">{stats.participant_count ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Topik aktif:</span>
                    <span className="font-semibold">{stats.topic_count ?? 0}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mb-6" id="settings">
              <Tabs defaultValue={defaultTab}>
                <div className="bg-white">
                  <TabsBar
                    items={[
                      ...(showTopicsTab ? [{ label: 'Topics', value: 'topics', count: stats.topic_count ?? 0 }] : []),
                      { label: 'Attachments', value: 'attachments' },
                      { label: 'Participants', value: 'participants', count: stats.participant_count ?? 0 },
                      { label: 'Timeline', value: 'timeline' },
                      { label: 'Settings', value: 'settings' },
                    ]}
                  />
                </div>
                <RoomTabsContent roomId={room.id} room={room} showTopicsTab={showTopicsTab} />
              </Tabs>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}

function RoomDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
