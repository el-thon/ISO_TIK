import { Users, UserCheck, UserX, Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  useForumPeriod, 
  usePeriodJoinRequests,
  useApprovePeriodJoinRequest, 
  useRejectPeriodJoinRequest 
} from '@/services/forumPeriodHooks'
import { toast } from '@/components/ui/use-toast'

export default function InvitationTab({ periodDetailId }) {
  // Fetch period detail data
  const { data: periodDetail, isLoading: periodDetailLoading } = useForumPeriod(
    periodDetailId,
    { enabled: Boolean(periodDetailId) }
  )
  
  // Fetch join requests data (only enabled for owner)
  const { 
    data: periodJoinRequestsData, 
    isLoading: periodJoinRequestsLoading, 
    refetch: refetchJoinRequests 
  } = usePeriodJoinRequests(
    periodDetailId,
    { status: 'all' },
    { enabled: Boolean(periodDetailId) && periodDetail?.current_user_role === 'owner' }
  )

  const isOwner = periodDetail?.current_user_role === 'owner'
  const periodJoinRequests = periodJoinRequestsData?.requests ?? []
  const pendingJoinRequests = periodJoinRequests.filter(
    (item) => String(item?.status || '').toLowerCase() === 'pending'
  )
  const approvedCount = periodJoinRequests.filter(
    (item) => String(item?.status || '').toLowerCase() === 'approved'
  ).length
  const rejectedCount = periodJoinRequests.filter(
    (item) => String(item?.status || '').toLowerCase() === 'rejected'
  ).length
  const members = periodDetail?.members ?? []

  // Approve mutation
  const approveMutation = useApprovePeriodJoinRequest(periodDetailId, {
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Permintaan gabung periode berhasil disetujui.',
      })
      // Refetch to update UI immediately
      refetchJoinRequests()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal menyetujui permintaan.',
      })
    },
  })

  // Reject mutation
  const rejectMutation = useRejectPeriodJoinRequest(periodDetailId, {
    onSuccess: () => {
      toast({
        title: 'Berhasil',
        description: 'Permintaan gabung periode berhasil ditolak.',
      })
      // Refetch to update UI immediately
      refetchJoinRequests()
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Gagal',
        description: error?.response?.data?.message || 'Gagal menolak permintaan.',
      })
    },
  })

  const isActionPending = approveMutation.isPending || rejectMutation.isPending

  const handleApprove = (joinRequestId) => {
    if (!joinRequestId || isActionPending) return
    approveMutation.mutate({ joinRequestId })
  }

  const handleReject = (joinRequestId) => {
    if (!joinRequestId || isActionPending) return
    rejectMutation.mutate({ joinRequestId, payload: {} })
  }

  // Loading state
  if (periodDetailLoading || periodJoinRequestsLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Memuat data invitation...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* LEFT COLUMN - Join Requests Summary & Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3 text-slate-700 border-b border-slate-100 pb-3 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-slate-800">Ringkasan Request Gabung</span>
        </div>
        
        {/* Statistics Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">Pending</span>
            </div>
            <span className="font-bold text-amber-700 text-lg">{pendingJoinRequests.length}</span>
          </div>
          
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Approved</span>
            </div>
            <span className="font-bold text-emerald-700 text-lg">{approvedCount}</span>
          </div>
          
          <div className="flex items-center justify-between rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-medium text-rose-700">Rejected</span>
            </div>
            <span className="font-bold text-rose-700 text-lg">{rejectedCount}</span>
          </div>
        </div>

        {/* Pending Requests List with Actions (Owner Only) */}
        {isOwner && pendingJoinRequests.length > 0 && (
          <div className="mt-5 pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-600 mb-3 uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-3 h-3" /> Menunggu Persetujuan
            </p>
            <div className="space-y-3 max-h-64 overflow-auto">
              {pendingJoinRequests.map((request) => (
                <div key={request.id} className="bg-slate-50 rounded-lg border border-slate-100 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-800">
                        {request?.requester?.name || request?.requester?.username || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {request?.requester?.email}
                      </div>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">pending</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 py-1 h-8 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                      disabled={isActionPending}
                      onClick={() => handleReject(request.id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Tolak
                    </Button>
                    <Button
                      size="sm"
                      className="px-3 py-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={isActionPending}
                      onClick={() => handleApprove(request.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state for owner with no pending requests */}
        {isOwner && pendingJoinRequests.length === 0 && periodJoinRequests.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 text-center">
              <UserCheck className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
              Semua permintaan sudah diproses.
            </div>
          </div>
        )}

        {/* Message for non-owner */}
        {!isOwner && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 text-center">
              <Clock className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              Status request Anda akan muncul di sini setelah disetujui oleh owner.
            </div>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN - Members List */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-3 text-slate-700 border-b border-slate-100 pb-3 mb-4">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="font-semibold text-slate-800">Anggota Forum Periode</span>
          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full ml-auto">
            {members.length} orang
          </span>
        </div>
        
        <div className="space-y-2 max-h-[400px] overflow-auto pr-1">
          {members.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              Belum ada anggota.
            </div>
          ) : (
            members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-700 text-sm">
                    {member.user?.name || member.user?.username || 'User'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {member.user?.email || member.user?.username || ''}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  member.role === 'owner' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {member.role === 'owner' ? 'Owner' : 'Anggota'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}