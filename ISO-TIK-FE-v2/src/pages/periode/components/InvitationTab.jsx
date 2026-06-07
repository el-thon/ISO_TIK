import React, { useMemo, useState } from 'react'
import { CheckCircle, Clock, RefreshCw, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  usePeriod,
  usePeriodJoinRequests,
  useApprovePeriodJoinRequest,
} from '@/hooks/usePeriod'
import { toast } from '@/components/ui/use-toast'

export default function InvitationTab({
  periodDetailId,
  periodDetail: initialPeriodDetail = null,
  periodJoinRequests: initialJoinRequests = [],
}) {
  const [showAllRequests, setShowAllRequests] = useState(false)

  const {
    data: fetchedPeriodDetail,
    isLoading: periodDetailLoading,
    refetch: refetchPeriod,
  } = usePeriod(periodDetailId, { enabled: Boolean(periodDetailId) })

  const periodDetail = fetchedPeriodDetail ?? initialPeriodDetail
  const isOwner = periodDetail?.current_user_role === 'owner'

  const {
    data: fetchedJoinRequestsData,
    isLoading: joinRequestsLoading,
    refetch: refetchJoinRequests,
  } = usePeriodJoinRequests(
    periodDetailId,
    { status: 'all' },
    { enabled: Boolean(periodDetailId) && isOwner }
  )

  const periodJoinRequests = fetchedJoinRequestsData?.requests ?? initialJoinRequests ?? []
  const pendingJoinRequests = useMemo(
    () => periodJoinRequests.filter((item) => String(item?.status || '').toLowerCase() === 'pending'),
    [periodJoinRequests]
  )
  const approvedCount = useMemo(
    () => periodJoinRequests.filter((item) => String(item?.status || '').toLowerCase() === 'approved').length,
    [periodJoinRequests]
  )
  const members = periodDetail?.members ?? []

  const approveMutation = useApprovePeriodJoinRequest(periodDetailId, {
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Permintaan gabung periode berhasil disetujui.',
      })
      refetchJoinRequests()
      refetchPeriod()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal menyetujui permintaan.',
      })
    },
  })

  const handleApprove = (joinRequestId) => {
    if (!joinRequestId || approveMutation.isPending) return
    approveMutation.mutate({ joinRequestId })
  }

  const handleRefreshAll = () => {
    refetchJoinRequests()
    refetchPeriod()
  }

  const visibleRequests = showAllRequests ? periodJoinRequests : pendingJoinRequests

  if (periodDetailLoading || joinRequestsLoading) {
    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-muted-foreground">
        Memuat data invitation...
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-xs text-muted-foreground">Anggota</div>
              <div className="text-lg font-semibold">{members.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <div>
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-lg font-semibold">{pendingJoinRequests.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-xs text-muted-foreground">Approved</div>
              <div className="text-lg font-semibold">{approvedCount}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">Permintaan Join Periode</h3>
          <p className="text-xs text-muted-foreground">Kelola permintaan join periode dari pengguna.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAllRequests((prev) => !prev)}>
            {showAllRequests ? 'Tampilkan Pending' : 'Tampilkan Semua'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {visibleRequests.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground bg-white">
          Tidak ada permintaan join yang ditampilkan.
        </div>
      ) : (
        <div className="space-y-3">
          {visibleRequests.map((request) => {
            const status = String(request?.status || 'pending').toLowerCase()
            const requester = request?.requester ?? request?.user ?? {}
            return (
              <Card key={request.id}>
                <CardContent className="pt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-medium text-slate-800">
                      {requester?.name || requester?.username || requester?.email || 'Pengguna'}
                    </div>
                    <div className="text-xs text-muted-foreground">{requester?.email || '-'}</div>
                    <Badge variant="outline" className="mt-2 capitalize">{status}</Badge>
                  </div>
                  {isOwner && status === 'pending' && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={approveMutation.isPending}
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Setujui
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
