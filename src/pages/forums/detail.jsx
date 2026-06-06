import React, { useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Home, Paperclip, Settings, Users } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isPeriodDeadlinePassed } from '@/utils/periodDeadline'
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
import { useRoom, useRoomParticipants } from '@/hooks/useRoom'
import { useMe } from '@/hooks/useAuth'
import { getAccessToken, getCurrentUserId, getUserData } from '@/utils/auth'
import { toast } from '@/components/ui/use-toast'

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

export default function RoomDetail() {
  const { id: roomId } = useParams()
  const { data: roomResponse, isLoading, isError, error, refetch } = useRoom(roomId)
  const room = useMemo(() => roomResponse?.forum ?? roomResponse?.room ?? roomResponse, [roomResponse])
  const cachedUser = getUserData()
  const shouldFetchMe = !cachedUser?.id && !cachedUser?.user_id && Boolean(getAccessToken())
  const { data: meData } = useMe({ 
    staleTime: 60_000,
    enabled: shouldFetchMe,
  })

  // Enhanced currentUserId detection with multiple fallbacks
  const currentUserId =
    cachedUser?.id ||
    cachedUser?.user_id ||
    meData?.id ||
    meData?.user?.id ||
    meData?.data?.user?.id ||
    getCurrentUserId()

  // Ensure we have string for comparison
  const normalizedCurrentUserId = currentUserId ? String(currentUserId) : null
  const normalizedResponsibleUserId = room?.responsible_user_id ? String(room.responsible_user_id) : null
  const normalizedOwnerUserId =
    room?.created_by_user_id ? String(room.created_by_user_id)
      : room?.created_by_user?.id ? String(room.created_by_user.id)
        : room?.owner?.id ? String(room.owner.id)
          : null

  const {
    data: participantsData,
  } = useRoomParticipants(
    roomId, 
    { per_page: 200 }, 
    { 
      enabled: Boolean(roomId && normalizedCurrentUserId) // Only fetch if we have user ID
    }
  )

  const currentParticipant = useMemo(() => {
    if (!normalizedCurrentUserId) return null
    const participants = participantsData?.participants ?? []
    return participants.find((participant) => String(participant.user_id) === normalizedCurrentUserId) || null
  }, [normalizedCurrentUserId, participantsData])

  const stats = {
    participant_count: room?.stats?.participant_count ?? room?.participant_count ?? room?.participants_count ?? 0,
    topic_count: room?.stats?.topic_count ?? room?.topic_count ?? room?.topics_count ?? 0,
  }
  const canCreateTopic = Boolean(currentParticipant && (currentParticipant.role === 'auditor' || String(currentParticipant.role).toLowerCase() === 'auditor'))
  const defaultTab = 'topics' // Default to topics tab
  const isPeriodClosed = Boolean(
    isPeriodDeadlinePassed(room)
  )
  
  // Check if current user is the responsible user (owner) of this room
  const isRoomOwner = Boolean(
    normalizedCurrentUserId && (
      (normalizedResponsibleUserId && normalizedCurrentUserId === normalizedResponsibleUserId) ||
      (normalizedOwnerUserId && normalizedCurrentUserId === normalizedOwnerUserId) ||
      room?.current_user_participant?.is_responsible_user === true
    )
  )
  const deadlineToastShownRef = React.useRef(false)

  useEffect(() => {
    if (!isPeriodClosed || deadlineToastShownRef.current) return

    const t = toast({
      variant: 'destructive',
      title: 'Deadline ruangan telah lewat',
      description: 'Tombol buat formulir dinonaktifkan karena deadline sudah lewat.',
    })

    const timer = setTimeout(() => {
      t.dismiss()
    }, 5000)

    deadlineToastShownRef.current = true

    return () => clearTimeout(timer)
  }, [isPeriodClosed])

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/beranda" className="inline-flex items-center gap-2">
                    <Home className="w-4 h-4" />
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/forum">Forum</Link>
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
              <p className="font-medium text-rose-700">Gagal memuat forum</p>
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Terkunci</span>
                      )}
                      {room.is_archived && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Diarsipkan</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {room.description || 'Belum ada deskripsi'}
                    </CardDescription>
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
                    {canCreateTopic && !isPeriodClosed && (
                      <Link to="/formulir/buat" state={{ roomId: room.id, roomTitle: room.name }}>
                        <Button size="sm" className="bg-blue-600 text-white px-4 py-2">
                          + Buat Formulir
                        </Button>
                      </Link>
                    )}
                    {canCreateTopic && isPeriodClosed && (
                      <Button
                        size="sm"
                        className="bg-slate-300 text-slate-600 px-4 py-2 cursor-not-allowed"
                        disabled
                        title="Deadline forum period sudah lewat, formulir baru tidak dapat dibuat"
                      >
                        + Buat Formulir
                      </Button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Peserta:</span>
                    <span className="font-semibold">{stats.participant_count ?? 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Formulir aktif:</span>
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
                      { label: 'Formulir', value: 'topics', count: stats.topic_count ?? 0, icon: <FileText className="w-4 h-4" /> },
                      { label: 'Lampiran', value: 'attachments', icon: <Paperclip className="w-4 h-4" /> },
                      { label: isRoomOwner ? 'Invitation' : 'Peserta', value: 'participants', count: stats.participant_count ?? 0, icon: <Users className="w-4 h-4" /> },
                      ...(isRoomOwner ? [{ label: 'Pengaturan', value: 'settings', icon: <Settings className="w-4 h-4" /> }] : []),
                    ]}
                  />
                </div>
                <RoomTabsContent 
                  roomId={room.id} 
                  room={room} 
                  isRoomOwner={isRoomOwner}
                  currentUserId={normalizedCurrentUserId}
                />
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
