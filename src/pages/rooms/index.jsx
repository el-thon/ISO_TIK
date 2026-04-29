import React, { useState, useRef, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import TabsBar from '@/components/mainComponents/tabsBar'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, ArrowLeft, LayoutGrid, Ticket } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { toast } from '@/components/ui/use-toast'
import { getUserData, getUserRoles, isProductOwnerUser } from '@/utils/auth'

// Hooks
import { useForumPeriods, useForumPeriod, useForumPeriodForums, useJoinForumPeriod } from '@/services/forumPeriodHooks'
import { usePeriodJoinRequests } from '@/services/forumPeriodHooks'

// Constants & Helpers
import { isDeadlinePassedErrorMessage, isForumRelated, formatDate } from './constants'

// Components
import RoomsSkeleton from './components/RoomsSkeleton'
import CreateRoomForm from './components/CreateRoomForm'
import CreatePeriodForm from './components/CreatePeriodForm'
import UpdatePeriodForm from './components/UpdatePeriodForm'
import PeriodCard from './components/PeriodCard'
import ChildForumCard from './components/ChildForumCard'
import InvitationTab from './components/InvitationTab'

export default function RoomsPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [editPeriodDialogOpen, setEditPeriodDialogOpen] = useState(false)
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false)
  const [accessDeniedName, setAccessDeniedName] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [periodDetailId, setPeriodDetailId] = useState('')
  const [childForumPage, setChildForumPage] = useState(1)
  const lastDeadlineToastKeyRef = useRef('')
  const localDeadlineToastShownRef = useRef('')

  // Data fetching
  const { data: periodsData, isLoading: periodsLoading } = useForumPeriods()
  const periods = periodsData?.periods ?? []
  
  const { data: periodDetail, isFetching: periodDetailLoading, isError: periodDetailError, error: periodDetailErr } = useForumPeriod(
    periodDetailId,
    { enabled: Boolean(periodDetailId) }
  )
  
  const isPeriodDeadlinePassed = Boolean(
    periodDetail?.period?.end_date && new Date(periodDetail.period.end_date) < new Date()
  )
  const canManageSelectedPeriod = !isPeriodDeadlinePassed
  
  const currentUser = getUserData()
  const isProductOwner = isProductOwnerUser(currentUser)
  const currentRoles = getUserRoles(currentUser)
  const shouldFilterForumsByRelation = !isProductOwner &&
    (currentRoles.includes('member') || currentRoles.includes('admin') || currentRoles.includes('administrator'))
  
  const childForumsPerPage = 1000
  const uiChildForumsPerPage = 6

  const {
    data: childForumsData,
    isLoading: childForumsLoading,
    isError: childForumsError,
    error: childForumsErr,
    refetch: refetchChildForums,
  } = useForumPeriodForums(
    periodDetailId,
    { page: 1, per_page: childForumsPerPage },
    { enabled: Boolean(periodDetailId) }
  )
  
  const childForums = childForumsData?.forums ?? []
  const relationFilteredChildForums = useMemo(() => {
    if (!shouldFilterForumsByRelation) return childForums
    return childForums.filter((forum) => isForumRelated(forum))
  }, [childForums, shouldFilterForumsByRelation])
  
  const totalChildForumPages = Math.max(1, Math.ceil(relationFilteredChildForums.length / uiChildForumsPerPage))
  const safeChildForumPage = Math.min(childForumPage, totalChildForumPages)
  const visibleChildForums = useMemo(() => {
    const start = (safeChildForumPage - 1) * uiChildForumsPerPage
    const end = start + uiChildForumsPerPage
    return relationFilteredChildForums.slice(start, end)
  }, [relationFilteredChildForums, safeChildForumPage])

  const periodDetailErrorMessage = periodDetailErr?.response?.data?.message || periodDetailErr?.message || 'Tidak dapat melihat detail periode ini.'

  // Join Requests - langsung digunakan di InvitationTab tanpa dialog terpisah
  const {
    data: periodJoinRequestsData,
  } = usePeriodJoinRequests(
    periodDetailId,
    { status: 'all' },
    {
      enabled: Boolean(periodDetailId) && periodDetail?.current_user_role === 'owner',
    }
  )
  const periodJoinRequests = periodJoinRequestsData?.requests ?? []
  const pendingJoinRequests = useMemo(
    () => periodJoinRequests.filter((requestItem) => String(requestItem?.status || '').toLowerCase() === 'pending'),
    [periodJoinRequests]
  )

  const joinMutation = useJoinForumPeriod({
    onSuccess: () => {
      toast({
        title: 'Permintaan terkirim',
        description: 'Anda telah melakukan request join ruangan dan sedang menunggu persetujuan owner.',
      })
    },
  })

  const handleJoinPeriodRequest = (period) => {
    const periodId = String(period?.id || '').trim()
    if (!periodId || joinMutation.isPending) return
    joinMutation.mutate({ period_id: periodId })
  }

  const childForumsErrorMessage = childForumsErr?.response?.data?.message || childForumsErr?.message || 'Gagal memuat forum child.'

  // Toast effects
  React.useEffect(() => {
    if (!periodDetailError) return
    if (!isDeadlinePassedErrorMessage(periodDetailErrorMessage)) return

    const toastKey = `period:${periodDetailId}:${periodDetailErrorMessage}`
    if (lastDeadlineToastKeyRef.current === toastKey) return
    lastDeadlineToastKeyRef.current = toastKey

    toast({
      variant: 'destructive',
      title: 'Deadline periode telah lewat',
      description: 'Deadline Periode sudah lewat. Periode hanya dapat diakses dalam mode baca.',
    })
  }, [periodDetailError, periodDetailErrorMessage, periodDetailId])

  React.useEffect(() => {
    if (!periodDetailId || !isPeriodDeadlinePassed) return
    const toastKey = `period-local:${periodDetailId}`
    if (localDeadlineToastShownRef.current === toastKey) return
    localDeadlineToastShownRef.current = toastKey

    toast({
      variant: 'destructive',
      title: 'Deadline periode telah lewat',
      description: 'Deadline Periode sudah lewat. Periode hanya dapat diakses dalam mode baca.',
    })
  }, [periodDetailId, isPeriodDeadlinePassed])

  React.useEffect(() => {
    if (!childForumsError) return
    if (!isDeadlinePassedErrorMessage(childForumsErrorMessage)) return

    const toastKey = `forums:${periodDetailId}:${childForumsErrorMessage}`
    if (lastDeadlineToastKeyRef.current === toastKey) return
    lastDeadlineToastKeyRef.current = toastKey

    toast({
      variant: 'destructive',
      title: 'Deadline periode telah lewat',
      description: 'Deadline Periode sudah lewat. Data forum hanya dapat ditampilkan dalam mode baca.',
    })
  }, [childForumsError, childForumsErrorMessage, periodDetailId])

  const emptyState = !periodsLoading && periods.length === 0

  const handleSelectPeriod = (period) => {
    const isDisabled = period?.is_related === false && !isProductOwner
    if (isDisabled) {
      setAccessDeniedName(period?.name || '')
      setAccessDeniedOpen(true)
      return
    }
    setSelectedPeriodId(String(period.id))
    setPeriodDetailId(String(period.id))
    setChildForumPage(1)
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-heading-2 font-semibold">Periode</h1>
            <p className="text-body-md text-muted-foreground">Periode Anda.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!selectedPeriodId ? (
              <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
                {!isProductOwner && (
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-blue hover:bg-blue-light text-white flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Tambah Periode
                    </Button>
                  </DialogTrigger>
                )}
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Buat Periode</DialogTitle>
                    <DialogDescription>Atur periode dan deadline (end date) untuk periode.</DialogDescription>
                  </DialogHeader>
                  <CreatePeriodForm onSuccess={() => setPeriodDialogOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" variant="outline" className="px-4 py-2" onClick={() => {
                setSelectedPeriodId('')
                setPeriodDetailId('')
              }}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
              </Button>
            )}
            
            {/* Access Denied Dialog */}
            <Dialog open={accessDeniedOpen} onOpenChange={setAccessDeniedOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Akses ditolak</DialogTitle>
                  <DialogDescription>
                    Anda belum menjadi anggota Periode
                    {accessDeniedName ? ` "${accessDeniedName}"` : ''}. Silakan join terlebih dahulu.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="px-4 py-2" onClick={() => setAccessDeniedOpen(false)}>
                    Tutup
                  </Button>
                  <Button className="px-4 py-2" onClick={() => setAccessDeniedOpen(false)}>
                    Mengerti
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Period Detail Section */}
        {periodDetailId && (
          <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Detail Periode</span>
            </div>
            {periodDetailLoading && <span>Memuat detail periode...</span>}
            {periodDetailError && !isDeadlinePassedErrorMessage(periodDetailErrorMessage) && (
              <span className="text-rose-600">{periodDetailErrorMessage}</span>
            )}
            {!periodDetailLoading && !periodDetailError && periodDetail?.period && (
              <div className="space-y-1">
                <div className="font-medium wrap-break-word">{periodDetail.period.name}</div>
                <div className="text-xs text-muted-foreground flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1 sm:gap-2">
                  <span>Tipe: {periodDetail.period.period_type || '-'}</span>
                  <span>Mulai: {formatDate(periodDetail.period.start_date)}</span>
                  <span>Deadline: {formatDate(periodDetail.period.end_date)}</span>
                </div>
                {periodDetail?.current_user_role === 'owner' && (
                  <div className="pt-2">
                    <Dialog open={editPeriodDialogOpen} onOpenChange={setEditPeriodDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="px-4 py-2">Ubah Periode</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Ubah Periode</DialogTitle>
                          <DialogDescription>Perbarui nama, tipe, atau deadline periode.</DialogDescription>
                        </DialogHeader>
                        <UpdatePeriodForm period={periodDetail.period} onSuccess={() => setEditPeriodDialogOpen(false)} />
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Periods List */}
        {!periodDetailId && (
          periodsLoading ? (
            <RoomsSkeleton />
          ) : emptyState ? (
            <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
              Belum ada Periode yang dapat ditampilkan. Tambahkan periode baru untuk memulai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {periods.map((period) => {
                const isDisabled = period?.is_related === false && !isProductOwner
                return (
                  <PeriodCard
                    key={period.id}
                    period={period}
                    isDisabled={isDisabled}
                    isProductOwner={isProductOwner}
                    joinMutation={joinMutation}
                    onJoin={handleJoinPeriodRequest}
                    onSelect={handleSelectPeriod}
                  />
                )
              })}
            </div>
          )
        )}

        {/* Child Forums Section */}
        {periodDetailId && (
          <div className="mt-8">
            <Tabs defaultValue="forums">
              <TabsBar
                items={[
                  { label: 'Forum', value: 'forums', icon: <LayoutGrid className="w-4 h-4" /> },
                  { label: 'Invitation', value: 'invitation', icon: <Ticket className="w-4 h-4" /> },
                ]}
              />

              <TabsContent value="forums">
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">Forum</h2>
                      <p className="text-xs text-muted-foreground">Daftar forum dalam period ini.</p>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      {!isProductOwner && (
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            className="bg-blue hover:bg-blue-light text-white flex items-center gap-2 w-full sm:w-auto"
                            disabled={!canManageSelectedPeriod}
                          >
                            <Plus className="w-4 h-4" /> Tambah Forum
                          </Button>
                        </DialogTrigger>
                      )}
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Buat Forum Child</DialogTitle>
                          <DialogDescription>Isi formulir berikut untuk membuat forum child di period ini.</DialogDescription>
                        </DialogHeader>
                        <CreateRoomForm
                          selectedPeriodId={selectedPeriodId}
                          onSuccess={() => {
                            setDialogOpen(false)
                            refetchChildForums()
                          }}
                        />
                        {isPeriodDeadlinePassed && (
                          <p className="text-xs text-amber-600 mt-2">Deadline period sudah lewat. Forum child hanya bisa dibaca.</p>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {childForumsError && (
                    <div className="p-4 mb-6 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between">
                      <span>
                        {isDeadlinePassedErrorMessage(childForumsErrorMessage)
                          ? 'Deadline periode sudah lewat. Notifikasi telah ditampilkan.'
                          : childForumsErrorMessage}
                      </span>
                      <Button variant="outline" size="sm" className="px-3 py-1" onClick={() => refetchChildForums()}>
                        Coba lagi
                      </Button>
                    </div>
                  )}
                  
                  {childForumsLoading ? (
                    <RoomsSkeleton />
                  ) : visibleChildForums.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground bg-white">
                      Belum ada forum di period ini.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {visibleChildForums.map((room) => (
                          <ChildForumCard key={room.id} room={room} />
                        ))}
                      </div>
                      {totalChildForumPages > 1 && (
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                          <Button
                            size="xs"
                            variant="outline"
                            className="px-3 py-1"
                            disabled={safeChildForumPage <= 1}
                            onClick={() => setChildForumPage((prev) => Math.max(1, prev - 1))}
                          >
                            Sebelumnya
                          </Button>
                          <span>{safeChildForumPage} / {totalChildForumPages}</span>
                          <Button
                            size="xs"
                            variant="outline"
                            className="px-3 py-1"
                            disabled={safeChildForumPage >= totalChildForumPages}
                            onClick={() => setChildForumPage((prev) => Math.min(totalChildForumPages, prev + 1))}
                          >
                            Berikutnya
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

            <TabsContent value="invitation">
              <InvitationTab 
                periodDetail={periodDetail}
                periodJoinRequests={periodJoinRequests}
                pendingJoinRequests={pendingJoinRequests}
                periodDetailId={periodDetailId}
                onRefresh={() => {
                  // Refresh data setelah approve/reject
                  refetchChildForums()
                }}
              />
            </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </MainLayout>
  )
}