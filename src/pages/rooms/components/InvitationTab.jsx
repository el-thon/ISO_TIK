import React, { useState, useMemo } from 'react'
import { Users, UserCheck, Clock, CheckCircle, RefreshCw, Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  useForumPeriod, 
  usePeriodJoinRequests,
  useApprovePeriodJoinRequest, 
} from '@/services/forumPeriodHooks'
import { toast } from '@/components/ui/use-toast'

// Komponen MemberManagementDialog - Dialog lengkap untuk manage member & requests
function MemberManagementDialog({ isOpen, onClose, periodName, isOwner, members, joinRequests, onApprove, isActionPending, refetch }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('members')
  const itemsPerPage = 10

  // Filter members berdasarkan search
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members
    
    const searchLower = searchTerm.toLowerCase()
    return members.filter(member => {
      const name = (member.user?.name || member.user?.username || '').toLowerCase()
      const email = (member.user?.email || '').toLowerCase()
      return name.includes(searchLower) || email.includes(searchLower)
    })
  }, [members, searchTerm])

  // Filter pending requests
  const pendingRequests = useMemo(() => {
    return joinRequests.filter(
      (item) => String(item?.status || '').toLowerCase() === 'pending'
    )
  }, [joinRequests])

  // Filter pending requests berdasarkan search
  const filteredPendingRequests = useMemo(() => {
    if (!searchTerm.trim()) return pendingRequests
    
    const searchLower = searchTerm.toLowerCase()
    return pendingRequests.filter(request => {
      const name = (request?.requester?.name || request?.requester?.username || '').toLowerCase()
      const email = (request?.requester?.email || '').toLowerCase()
      return name.includes(searchLower) || email.includes(searchLower)
    })
  }, [pendingRequests, searchTerm])

  // Pagination untuk members
  const totalMemberPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredMembers.slice(start, start + itemsPerPage)
  }, [filteredMembers, currentPage])

  // Pagination untuk pending requests
  const totalPendingPages = Math.ceil(filteredPendingRequests.length / itemsPerPage)
  const paginatedPendingRequests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredPendingRequests.slice(start, start + itemsPerPage)
  }, [filteredPendingRequests, currentPage])

  // Reset page ketika search atau tab berubah
  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleTabChange = (value) => {
    setActiveTab(value)
    setSearchTerm('')
    setCurrentPage(1)
  }

  const currentData = activeTab === 'members' ? paginatedMembers : paginatedPendingRequests
  const totalPages = activeTab === 'members' ? totalMemberPages : totalPendingPages
  const totalItems = activeTab === 'members' ? filteredMembers.length : filteredPendingRequests.length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Manajemen Member & Request
          </DialogTitle>
          <DialogDescription>
            Kelola anggota dan permintaan join untuk periode: <span className="font-semibold">{periodName}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Anggota ({members.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Menunggu Persetujuan ({pendingRequests.length})
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 flex-1 overflow-hidden flex flex-col">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder={`Cari ${activeTab === 'members' ? 'anggota' : 'pemohon'} berdasarkan nama atau email...`}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm"
              />
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-auto space-y-2 pr-1">
              {currentData.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-12">
                  {activeTab === 'members' ? (
                    <>
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p>{searchTerm ? 'Anggota tidak ditemukan.' : 'Belum ada anggota yang bergabung.'}</p>
                    </>
                  ) : (
                    <>
                      <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p>{searchTerm ? 'Permintaan tidak ditemukan.' : 'Tidak ada permintaan join yang menunggu.'}</p>
                    </>
                  )}
                </div>
              ) : (
                activeTab === 'members' ? (
                  // Member List
                  paginatedMembers.map((member) => (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 text-sm">
                            {member.user?.name || member.user?.username || 'User'}
                          </span>
                          <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                            {member.role === 'owner' ? 'Owner' : 'Anggota'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {member.user?.email || member.user?.username || ''}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Pending Requests List with Actions
                  paginatedPendingRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="rounded-lg border border-amber-100 bg-amber-50/30 p-4 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">
                              {request?.requester?.name || request?.requester?.username || 'User'}
                            </span>
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Menunggu
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {request?.requester?.email}
                          </div>
                          {request?.created_at && (
                            <div className="text-xs text-muted-foreground mt-2">
                              Diminta pada: {new Date(request.created_at).toLocaleDateString('id-ID')}
                            </div>
                          )}
                        </div>
                        {isOwner && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={isActionPending}
                              onClick={() => onApprove(request.id)}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Setujui
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                <div className="text-xs text-muted-foreground">
                  Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-xs px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Tabs>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          {isOwner && activeTab === 'pending' && pendingRequests.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => refetch?.()}
              disabled={isActionPending}
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isActionPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Komponen InvitationTab utama
export default function InvitationTab({ periodDetailId }) {
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false)
  
  // Fetch period detail data
  const { data: periodDetail, isLoading: periodDetailLoading, refetch: refetchPeriod } = useForumPeriod(
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
  
  const members = periodDetail?.members ?? []

  // Approve mutation
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


  const isActionPending = approveMutation.isPending

  const handleApprove = (joinRequestId) => {
    if (!joinRequestId || isActionPending) return
    approveMutation.mutate({ joinRequestId })
  }


  const handleRefreshAll = () => {
    refetchJoinRequests()
    refetchPeriod()
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
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {/* LEFT COLUMN - Join Requests Summary */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-slate-800">Ringkasan Request Gabung</span>
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAll}
                disabled={isActionPending}
                className="h-8 px-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isActionPending ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          
          {/* Statistics Cards */}
          <div className="space-y-3">
            <div 
              className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-4 py-3 cursor-pointer hover:bg-amber-100 transition-colors"
              onClick={() => setIsManagementDialogOpen(true)}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-700">Menunggu Persetujuan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-700 text-lg">{pendingJoinRequests.length}</span>
                <Eye className="w-3.5 h-3.5 text-amber-500" />
              </div>
            </div>
            
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">Disetujui</span>
              </div>
              <span className="font-bold text-emerald-700 text-lg">{approvedCount}</span>
            </div>
          </div>

          {/* Quick preview of pending requests */}
          {isOwner && pendingJoinRequests.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs text-muted-foreground">
                {pendingJoinRequests.length} orang menunggu persetujuan. 
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 ml-1 text-xs"
                  onClick={() => setIsManagementDialogOpen(true)}
                >
                  Kelola sekarang
                </Button>
              </p>
            </div>
          )}

          {/* Message for non-owner */}
          {!isOwner && pendingJoinRequests.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-sm text-muted-foreground bg-slate-50 rounded-lg p-3 text-center">
                <Clock className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                Status request Anda akan diproses oleh owner.
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - Members Summary */}
        <div 
          className="rounded-xl border border-slate-200 bg-white p-5 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setIsManagementDialogOpen(true)}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-3 text-slate-700">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-semibold text-slate-800">Anggota Periode</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600">{members.length} orang</span>
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
          
          {/* Preview 3 members terbaru */}
          <div className="space-y-2">
            {members.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                Belum ada anggota.
              </div>
            ) : (
              <>
                {members.slice(0, 3).map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-700 text-sm truncate">
                        {member.user?.name || member.user?.username || 'User'}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {member.user?.email || member.user?.username || ''}
                      </div>
                    </div>
                    <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs shrink-0 ml-2">
                      {member.role === 'owner' ? 'Owner' : 'Anggota'}
                    </Badge>
                  </div>
                ))}
                {members.length > 3 && (
                  <div className="text-xs text-center text-slate-400 pt-2">
                    dan {members.length - 3} anggota lainnya
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Member & Request Management Dialog */}
      <MemberManagementDialog
        isOpen={isManagementDialogOpen}
        onClose={() => setIsManagementDialogOpen(false)}
        periodDetailId={periodDetailId}
        periodName={periodDetail?.name || 'Periode'}
        isOwner={isOwner}
        members={members}
        joinRequests={periodJoinRequests}
  onApprove={handleApprove}
        isActionPending={isActionPending}
        refetch={handleRefreshAll}
      />
    </>
  )
}