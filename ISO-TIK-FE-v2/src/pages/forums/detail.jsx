import React, { useMemo, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Home, Paperclip, Settings, Users } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { isPeriodDeadlinePassed } from '@/utils/periodDeadline'
import TabsBar from '@/components/mainComponents/tabsBar'
import { Tabs } from '@/components/ui/tabs'
import ForumTabsContent from '@/pages/periode/ForumTabsContent'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Skeleton } from '@/components/ui/skeleton'
import { useForum, useForumParticipants } from '@/hooks/useForum'
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

export default function ForumDetail() {
  const { id: forumId } = useParams()
  const { data: forumResponse, isLoading, isError, error, refetch } = useForum(forumId)
  const forum = useMemo(() => forumResponse?.forum ?? forumResponse?.room ?? forumResponse, [forumResponse])
  const cachedUser = getUserData()
  const shouldFetchMe = !cachedUser?.id && !cachedUser?.user_id && Boolean(getAccessToken())
  const { data: meData } = useMe({ staleTime: 60_000, enabled: shouldFetchMe })

  const currentUserId =
    cachedUser?.id ||
    cachedUser?.user_id ||
    meData?.id ||
    meData?.user?.id ||
    meData?.data?.user?.id ||
    getCurrentUserId()

  const normalizedCurrentUserId = currentUserId ? String(currentUserId) : null
  const normalizedResponsibleUserId = forum?.responsible_user_id ? String(forum.responsible_user_id) : null
  const normalizedOwnerUserId =
    forum?.created_by_user_id ? String(forum.created_by_user_id)
      : forum?.created_by_user?.id ? String(forum.created_by_user.id)
        : forum?.owner?.id ? String(forum.owner.id)
          : null

  const { data: participantsData } = useForumParticipants(
    forumId,
    { per_page: 200 },
    { enabled: Boolean(forumId && normalizedCurrentUserId) }
  )

  const currentParticipant = useMemo(() => {
    if (!normalizedCurrentUserId) return null
    const participants = participantsData?.participants ?? []
    return participants.find((participant) => String(participant.user_id) === normalizedCurrentUserId) || null
  }, [normalizedCurrentUserId, participantsData])

  const stats = {
    participant_count: forum?.stats?.participant_count ?? forum?.participant_count ?? forum?.participants_count ?? 0,
    form_count: forum?.stats?.form_count ?? forum?.stats?.topic_count ?? forum?.form_count ?? forum?.forms_count ?? forum?.topic_count ?? forum?.topics_count ?? 0,
  }
  const canCreateForm = Boolean(currentParticipant && String(currentParticipant.role).toLowerCase() === 'auditor')
  const defaultTab = 'forms'
  const isPeriodClosed = Boolean(isPeriodDeadlinePassed(forum))

  const isForumOwner = Boolean(
    normalizedCurrentUserId && (
      (normalizedResponsibleUserId && normalizedCurrentUserId === normalizedResponsibleUserId) ||
      (normalizedOwnerUserId && normalizedCurrentUserId === normalizedOwnerUserId) ||
      forum?.current_user_participant?.is_responsible_user === true
    )
  )
  const deadlineToastShownRef = React.useRef(false)

  useEffect(() => {
    if (!isPeriodClosed || deadlineToastShownRef.current) return

    const t = toast({
      variant: 'destructive',
      title: 'Deadline forum telah lewat',
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
                <BreadcrumbPage>Detail {forum?.name || 'Memuat...'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {isLoading && <ForumDetailSkeleton />}

        {isError && (
          <div className="p-4 mb-4 border border-rose-200 bg-rose-50 rounded-md flex items-center justify-between">
            <div>
              <p className="font-medium text-rose-700">Gagal memuat forum</p>
              <p className="text-sm text-rose-600">{error?.response?.data?.message || error?.message || 'Coba beberapa saat lagi.'}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>Muat ulang</Button>
          </div>
        )}

        {!isLoading && forum && (
          <>
            <div className="mb-6">
              <Card className="p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <CardTitle className="text-heading-3 font-semibold flex flex-wrap items-center gap-2">
                      {forum.name}
                      {forum.is_locked && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Terkunci</span>}
                      {forum.is_archived && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Diarsipkan</span>}
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {forum.description || 'Belum ada deskripsi'}
                    </CardDescription>
                    <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <div>
                        <div className="text-xs uppercase tracking-wide">Dibuat</div>
                        <div>{formatDateTime(forum.created_at)}</div>
                      </div>
                      <div>
                        <div className="text-xs uppercase tracking-wide">Terakhir diperbarui</div>
                        <div>{formatDateTime(forum.updated_at)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {canCreateForm && !isPeriodClosed && (
                      <Link to="/formulir/buat" state={{ forumId: forum.id, forumTitle: forum.name }}>
                        <Button size="sm" className="bg-blue-600 text-white px-4 py-2">+ Buat Formulir</Button>
                      </Link>
                    )}
                    {canCreateForm && isPeriodClosed && (
                      <Button size="sm" className="bg-slate-300 text-slate-600 px-4 py-2 cursor-not-allowed" disabled>
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
                    <span className="font-semibold">{stats.form_count ?? 0}</span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mb-6" id="settings">
              <Tabs defaultValue={defaultTab}>
                <div className="bg-white">
                  <TabsBar
                    items={[
                      { label: 'Formulir', value: 'forms', count: stats.form_count ?? 0, icon: <FileText className="w-4 h-4" /> },
                      { label: 'Lampiran', value: 'attachments', icon: <Paperclip className="w-4 h-4" /> },
                      { label: isForumOwner ? 'Invitation' : 'Peserta', value: 'participants', count: stats.participant_count ?? 0, icon: <Users className="w-4 h-4" /> },
                      ...(isForumOwner ? [{ label: 'Pengaturan', value: 'settings', icon: <Settings className="w-4 h-4" /> }] : []),
                    ]}
                  />
                </div>
                <ForumTabsContent
                  forumId={forum.id}
                  forum={forum}
                  isForumOwner={isForumOwner}
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

function ForumDetailSkeleton() {
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
