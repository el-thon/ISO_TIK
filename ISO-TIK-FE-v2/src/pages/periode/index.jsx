import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import TabsBar from '@/components/mainComponents/tabsBar'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Plus, ArrowLeft, LayoutGrid, Ticket } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import { toast } from '@/components/ui/use-toast'
import { getUserData, getUserRoles, isProductOwnerUser } from '@/utils/auth'
import {
  usePeriods,
  usePeriod,
  usePeriodForums,
  useJoinPeriod,
  usePeriodJoinRequests,
} from '@/hooks/usePeriod'
import { isForumRelated, formatDate } from './constants'
import PeriodSkeleton from './components/PeriodSkeleton'
import CreateForumForm from './components/CreateForumForm'
import CreatePeriodForm from './components/CreatePeriodForm'
import UpdatePeriodForm from './components/UpdatePeriodForm'
import PeriodCard from './components/PeriodCard'
import ChildForumCard from './components/ChildForumCard'
import InvitationTab from './components/InvitationTab'

export default function PeriodePage() {
  const [forumDialogOpen, setForumDialogOpen] = useState(false)
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [editPeriodDialogOpen, setEditPeriodDialogOpen] = useState(false)
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false)
  const [accessDeniedName, setAccessDeniedName] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [periodDetailId, setPeriodDetailId] = useState('')
  const [forumPage, setForumPage] = useState(1)
  const [localPendingJoinIds, setLocalPendingJoinIds] = useState([])

  const { data: periodsData, isLoading: periodsLoading } = usePeriods()
  const periods = periodsData?.periods ?? []

  const {
    data: periodDetail,
    isFetching: periodDetailLoading,
    isError: periodDetailError,
    error: periodDetailErr,
  } = usePeriod(periodDetailId, { enabled: Boolean(periodDetailId) })

  const isPeriodDeadlinePassed = Boolean(
    periodDetail?.period?.end_date && new Date(periodDetail.period.end_date) < new Date()
  )
  const canManageSelectedPeriod = !isPeriodDeadlinePassed

  const currentUser = getUserData()
  const isProductOwner = isProductOwnerUser(currentUser)
  const currentRoles = getUserRoles(currentUser)
  const shouldFilterForumsByRelation = !isProductOwner &&
    (currentRoles.includes('member') || currentRoles.includes('admin') || currentRoles.includes('administrator'))

  const {
    data: periodForumsData,
    isLoading: periodForumsLoading,
    isError: periodForumsError,
    error: periodForumsErr,
    refetch: refetchPeriodForums,
  } = usePeriodForums(
    periodDetailId,
    { page: 1, per_page: 1000 },
    { enabled: Boolean(periodDetailId) }
  )

  const forums = periodForumsData?.forums ?? []
  const relationFilteredForums = useMemo(() => {
    if (!shouldFilterForumsByRelation) return forums
    return forums.filter((forum) => isForumRelated(forum))
  }, [forums, shouldFilterForumsByRelation])

  const forumsPerPage = 6
  const totalForumPages = Math.max(1, Math.ceil(relationFilteredForums.length / forumsPerPage))
  const safeForumPage = Math.min(forumPage, totalForumPages)
  const visibleForums = useMemo(() => {
    const start = (safeForumPage - 1) * forumsPerPage
    const end = start + forumsPerPage
    return relationFilteredForums.slice(start, end)
  }, [relationFilteredForums, safeForumPage])

  const { data: periodJoinRequestsData } = usePeriodJoinRequests(
    periodDetailId,
    { status: 'all' },
    { enabled: Boolean(periodDetailId) && periodDetail?.current_user_role === 'owner' }
  )
  const periodJoinRequests = periodJoinRequestsData?.requests ?? []
  const pendingJoinRequests = useMemo(
    () => periodJoinRequests.filter((requestItem) => String(requestItem?.status || '').toLowerCase() === 'pending'),
    [periodJoinRequests]
  )

  const joinMutation = useJoinPeriod({
    onSuccess: () => {
      toast({
        title: 'Permintaan terkirim',
        description: 'Anda telah melakukan request join periode dan sedang menunggu persetujuan owner.',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Permintaan gagal',
        description: error?.response?.data?.message || error?.message || 'Gagal mengirim permintaan join.',
      })
    },
  })

  const handleJoinPeriodRequest = (period) => {
    const periodId = String(period?.id || '').trim()
    if (!periodId || joinMutation.isPending || localPendingJoinIds.includes(periodId)) return
    setLocalPendingJoinIds((prev) => (prev.includes(periodId) ? prev : [...prev, periodId]))
    joinMutation.mutate({ period_id: periodId })
  }

  const handleSelectPeriod = (period) => {
    const isDisabled = period?.is_related === false && !isProductOwner
    if (isDisabled) {
      setAccessDeniedName(period?.name || '')
      setAccessDeniedOpen(true)
      return
    }
    setSelectedPeriodId(String(period.id))
    setPeriodDetailId(String(period.id))
    setForumPage(1)
  }

  const periodDetailErrorMessage = periodDetailErr?.response?.data?.message || periodDetailErr?.message || 'Tidak dapat melihat detail periode ini.'
  const periodForumsErrorMessage = periodForumsErr?.response?.data?.message || periodForumsErr?.message || 'Gagal memuat forum.'
  const emptyState = !periodsLoading && periods.length === 0

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
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
                    <DialogDescription>Atur periode dan deadline untuk periode.</DialogDescription>
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

            <Dialog open={accessDeniedOpen} onOpenChange={setAccessDeniedOpen}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Akses ditolak</DialogTitle>
                  <DialogDescription>
                    Anda belum menjadi anggota Periode{accessDeniedName ? ` "${accessDeniedName}"` : ''}. Silakan join terlebih dahulu.
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" className="px-4 py-2 w-full" onClick={() => setAccessDeniedOpen(false)}>
                    Tutup
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {periodDetailId && (
          <div className="mb-6 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="text-xs text-muted-foreground">Detail Periode</span>
            </div>
            {periodDetailLoading && <span>Memuat detail periode...</span>}
            {periodDetailError && <span className="text-rose-600">{periodDetailErrorMessage}</span>}
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

        {!periodDetailId && (
          periodsLoading ? (
            <PeriodSkeleton />
          ) : emptyState ? (
            <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
              Belum ada Periode yang dapat ditampilkan. Tambahkan periode baru untuk memulai.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {periods.map((period) => {
                const isDisabled = period?.is_related === false && !isProductOwner
                const serverPending = String(period?.my_join_request?.status || '').toLowerCase() === 'pending'
                const isJoinPending = localPendingJoinIds.includes(String(period?.id || '')) || serverPending
                return (
                  <PeriodCard
                    key={period.id}
                    period={period}
                    isDisabled={isDisabled}
                    isProductOwner={isProductOwner}
                    isJoinPending={isJoinPending}
                    joinMutation={joinMutation}
                    onJoin={handleJoinPeriodRequest}
                    onSelect={handleSelectPeriod}
                  />
                )
              })}
            </div>
          )
        )}

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
                      <p className="text-xs text-muted-foreground">Daftar forum dalam periode ini.</p>
                    </div>
                    <Dialog open={forumDialogOpen} onOpenChange={setForumDialogOpen}>
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
                          <DialogTitle>Buat Forum</DialogTitle>
                          <DialogDescription>Isi formulir berikut untuk membuat forum pada periode ini.</DialogDescription>
                        </DialogHeader>
                        <CreateForumForm
                          selectedPeriodId={selectedPeriodId}
                          onSuccess={() => {
                            setForumDialogOpen(false)
                            refetchPeriodForums()
                          }}
                        />
                        {isPeriodDeadlinePassed && (
                          <p className="text-xs text-amber-600 mt-2">Deadline periode sudah lewat. Forum hanya bisa dibaca.</p>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>

                  {periodForumsError && (
                    <div className="p-4 mb-6 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between">
                      <span>{periodForumsErrorMessage}</span>
                      <Button variant="outline" size="sm" className="px-3 py-1" onClick={() => refetchPeriodForums()}>
                        Coba lagi
                      </Button>
                    </div>
                  )}

                  {periodForumsLoading ? (
                    <PeriodSkeleton />
                  ) : visibleForums.length === 0 ? (
                    <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground bg-white">
                      Belum ada forum di periode ini.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {visibleForums.map((forum) => (
                          <ChildForumCard key={forum.id} room={forum} />
                        ))}
                      </div>
                      {totalForumPages > 1 && (
                        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
                          <Button size="xs" variant="outline" className="px-3 py-1" disabled={safeForumPage <= 1} onClick={() => setForumPage((prev) => Math.max(1, prev - 1))}>
                            Sebelumnya
                          </Button>
                          <span>{safeForumPage} / {totalForumPages}</span>
                          <Button size="xs" variant="outline" className="px-3 py-1" disabled={safeForumPage >= totalForumPages} onClick={() => setForumPage((prev) => Math.min(totalForumPages, prev + 1))}>
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
                  onRefresh={refetchPeriodForums}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
