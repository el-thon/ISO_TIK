import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus, LogOut, Check, ChevronsUpDown, Search, X } from 'lucide-react'
import {
  useRoomParticipants,
  useAddRoomParticipant,
  useLeaveRoom,
} from '@/services/roomHooks'
import { useGroupMembers } from '@/services/groupHooks'
import { useMe } from '@/services/authHooks'
import { cn } from '@/lib/utils'

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

const formatRole = (role) => {
  if (!role) return 'participant'
  return role.replace(/_/g, ' ')
}

const getMemberId = (member) => member?.user?.id || member?.user_id || member?.id || ''

const getMemberDisplay = (member) => {
  const profile = member?.profile || member?.user?.profile || {}
  const name =
    profile.full_name ||
    profile.name ||
    member?.name ||
    member?.username ||
    member?.user?.username ||
    member?.email ||
    member?.user?.email ||
    'Pengguna'
  const username = member?.username || member?.user?.username || ''
  const email = member?.email || member?.user?.email || ''
  return { name, username, email }
}

const DEFAULT_INVITE_ROLE = 'auditee'
const roleOptions = [
  { value: 'auditor', label: 'Auditor' },
  { value: 'auditee', label: 'Auditee' },
]

const inviteSchema = z.object({
  userId: z.string().min(1, 'Pilih anggota yang ingin diundang'),
  role: z.enum(['auditor', 'auditee'], {
    required_error: 'Pilih peran peserta',
    invalid_type_error: 'Peran tidak valid',
  }),
})

const MANAGER_ROLES = new Set(['auditor', 'group_owner', 'super_admin'])

const normalizeRoleKey = (role) => {
  if (!role) return ''
  const cleaned = String(role).toLowerCase().replace(/[^a-z]/g, '')
  if (cleaned === 'auditoree') return 'auditor'
  if (cleaned === 'auditee') return 'auditee'
  if (cleaned === 'owner' || cleaned === 'groupowner') return 'group_owner'
  return cleaned
}

export default function ParticipantsTab({ roomId, room }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [memberSearch, setMemberSearch] = useState('')
  const [memberPopoverOpen, setMemberPopoverOpen] = useState(false)
  
  const { data: me } = useMe({ staleTime: 60_000 })
  const currentUserId = me?.id ?? null

  const {
    data,
    isLoading,
    isError: participantsError,
    error: participantsErrorObj,
    refetch: refetchParticipants,
  } = useRoomParticipants(roomId, { per_page: 1000 })
  
  const participants = data?.participants ?? []
  const groupId = room?.group?.id || room?.group_id

  const {
    data: groupData,
    isLoading: groupMembersLoading,
    isError: groupMembersError,
    error: groupMembersErrorObj,
    refetch: refetchGroupMembers,
  } = useGroupMembers(groupId, { 
    enabled: Boolean(groupId) && dialogOpen,
    staleTime: 30_000,
  })

  const allGroupMembers = groupData?.members ?? []

  const availableMembers = useMemo(() => {
    if (!allGroupMembers?.length) return []
    
    const participantUserIds = new Set(participants.map((p) => p.user_id))
    
    return allGroupMembers.filter((member) => {
      const memberId = getMemberId(member)
      if (!memberId) return false
      return !participantUserIds.has(memberId)
    })
  }, [allGroupMembers, participants])

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return availableMembers
    
    const search = memberSearch.toLowerCase()
    return availableMembers.filter((member) => {
      const { name, username, email } = getMemberDisplay(member)
      return name.toLowerCase().includes(search) ||
             username.toLowerCase().includes(search) ||
             email.toLowerCase().includes(search)
    })
  }, [availableMembers, memberSearch])

  const myMembership = useMemo(() => {
    if (!currentUserId) return null
    return participants.find((p) => p.user_id === currentUserId) ?? null
  }, [participants, currentUserId])
  
  const canLeaveRoom = Boolean(myMembership)
  const userRoleKey = normalizeRoleKey(room?.user_role || myMembership?.role || me?.role)
  const canManageParticipants = MANAGER_ROLES.has(userRoleKey)
  const leaveMutation = useLeaveRoom(roomId)
  
  const handleLeaveRoom = useCallback(() => {
    if (!roomId || leaveMutation.isPending) return
    leaveMutation.mutate()
  }, [leaveMutation, roomId])
  
  const leaveErrorMessage = leaveMutation.error?.response?.data?.message || leaveMutation.error?.message || null

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { userId: '', role: DEFAULT_INVITE_ROLE },
  })

  const selectedUserId = watch('userId')
  const selectedMember = useMemo(() => {
    if (!selectedUserId || !availableMembers.length) return null
    return availableMembers.find(m => String(getMemberId(m)) === String(selectedUserId))
  }, [selectedUserId, availableMembers])

  const inviteMutation = useAddRoomParticipant(roomId, {
    onSuccess: () => {
      reset({ userId: '', role: DEFAULT_INVITE_ROLE })
      setMemberSearch('')
      setMemberPopoverOpen(false)
      setDialogOpen(false)
      setTimeout(() => refetchParticipants(), 300)
    },
  })

  useEffect(() => {
    if (!dialogOpen) {
      reset({ userId: '', role: DEFAULT_INVITE_ROLE })
      setMemberSearch('')
      setMemberPopoverOpen(false)
    }
  }, [dialogOpen, reset])

  const onInvite = (values) => {
    const payload = { user_id: values.userId, role: values.role }
    console.log('[ParticipantsTab] Invite payload:', payload)
    inviteMutation.mutate(payload)
  }

  const inviteError = inviteMutation.error?.response?.data?.message || inviteMutation.error?.message || null
  
  const inviteDisabled =
    !groupId ||
    groupMembersLoading ||
    groupMembersError ||
    availableMembers.length === 0 ||
    inviteMutation.isPending ||
    !selectedUserId

  const participantsErrorMessage =
    participantsError && (participantsErrorObj?.response?.data?.message || participantsErrorObj?.message || 'Gagal memuat peserta ruangan.')

  const renderSelectedMember = () => {
    if (!selectedMember) return null
    
    const { name, username, email } = getMemberDisplay(selectedMember)
    
    return (
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-sm font-medium text-blue-900">{name}</div>
          <div className="text-xs text-blue-700">@{username}</div>
          {email && <div className="text-xs text-blue-600">{email}</div>}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
          onClick={() => {
            setValue('userId', '')
            setMemberSearch('')
          }}
        >
          Ganti
        </Button>
      </div>
    )
  }

  return (
    <TabsContent value="participants" className="mt-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Daftar Peserta</h3>
          <p className="text-sm text-muted-foreground">Kelola anggota ruangan dan perannya.</p>
          {!canManageParticipants && (
            <p className="text-xs text-muted-foreground mt-1">
              Anda tidak memiliki akses untuk mengelola peserta.
            </p>
          )}
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              className="inline-flex items-center gap-2" 
              disabled={!groupId}
            >
              <UserPlus className="w-4 h-4" /> 
              Undang Peserta
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Undang anggota ke ruangan</DialogTitle>
              <DialogDescription>
                Pilih anggota grup dan tentukan perannya.
              </DialogDescription>
            </DialogHeader>
            
            {!groupId && (
              <p className="text-sm text-rose-600">
                Ruangan belum terhubung dengan grup sehingga tidak dapat mengundang peserta.
              </p>
            )}
            
            {groupId && (
              <form onSubmit={handleSubmit(onInvite)} className="space-y-6">
                {/* Member Selection with Custom Popover */}
                <div className="space-y-2">
                  <Label>Anggota Grup</Label>
                  
                  {renderSelectedMember()}
                  
                  <Controller
                    name="userId"
                    control={control}
                    render={({ field }) => (
                      <Popover open={memberPopoverOpen} onOpenChange={setMemberPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={memberPopoverOpen}
                            className={cn(
                              "w-full justify-between h-auto min-h-10 py-2",
                              !field.value && "text-muted-foreground",
                              errors.userId && "border-rose-500"
                            )}
                            disabled={
                              groupMembersLoading || 
                              groupMembersError || 
                              inviteMutation.isPending ||
                              availableMembers.length === 0
                            }
                          >
                            {field.value && selectedMember ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(getMemberDisplay(selectedMember).name)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate">
                                  {getMemberDisplay(selectedMember).name}
                                </span>
                              </div>
                            ) : (
                              <span>
                                {groupMembersLoading
                                  ? 'Memuat anggota grup...'
                                  : groupMembersError
                                  ? 'Error memuat anggota'
                                  : availableMembers.length === 0
                                  ? 'Semua anggota sudah menjadi peserta'
                                  : 'Cari dan pilih anggota...'}
                              </span>
                            )}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        
                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                          <div className="border-b">
                            <div className="flex items-center px-3 py-2">
                              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                              <Input
                                placeholder="Cari nama atau email..."
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                              />
                              {memberSearch && (
                                <button
                                  type="button"
                                  onClick={() => setMemberSearch('')}
                                  className="ml-2"
                                >
                                  <X className="h-4 w-4 opacity-50 hover:opacity-100" />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="max-h-64 overflow-y-auto">
                            {groupMembersLoading ? (
                              <div className="py-8 text-center">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Memuat anggota...</p>
                              </div>
                            ) : filteredMembers.length === 0 ? (
                              <div className="py-8 text-center">
                                <p className="text-sm text-muted-foreground">
                                  {memberSearch 
                                    ? `Tidak ditemukan "${memberSearch}"`
                                    : 'Tidak ada anggota tersedia'
                                  }
                                </p>
                              </div>
                            ) : (
                              <div className="p-1">
                                {filteredMembers.map((member) => {
                                  const memberId = getMemberId(member)
                                  const { name, username, email } = getMemberDisplay(member)
                                  const isSelected = field.value === memberId
                                  
                                  return (
                                    <button
                                      key={memberId}
                                      type="button"
                                      className={cn(
                                        "w-full text-left px-3 py-2 rounded-md flex items-center gap-3",
                                        "hover:bg-gray-100 transition-colors",
                                        isSelected && "bg-blue-50"
                                      )}
                                      onClick={() => {
                                        field.onChange(memberId)
                                        setMemberPopoverOpen(false)
                                        setMemberSearch('')
                                      }}
                                    >
                                      <Avatar className="h-8 w-8">
                                        <AvatarFallback className="text-xs">
                                          {getInitials(name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{name}</div>
                                        <div className="text-xs text-muted-foreground truncate">
                                          @{username}
                                        </div>
                                        {email && (
                                          <div className="text-xs text-muted-foreground truncate">
                                            {email}
                                          </div>
                                        )}
                                      </div>
                                      {isSelected && (
                                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  
                  {errors.userId && (
                    <p className="text-xs text-rose-600 mt-1">{errors.userId.message}</p>
                  )}
                  
                  {groupMembersError && (
                    <p className="text-xs text-rose-600 mt-1">
                      {groupMembersErrorObj?.response?.data?.message || 
                       groupMembersErrorObj?.message || 
                       'Gagal memuat anggota grup.'}
                      <button 
                        type="button" 
                        className="ml-2 underline hover:text-rose-800" 
                        onClick={() => refetchGroupMembers()}
                      >
                        Coba lagi
                      </button>
                    </p>
                  )}
                </div>

                {/* Role Selection */}
                <div className="space-y w-full">
                  <Label>Peran Peserta</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange} 
                        disabled={inviteMutation.isPending || !selectedUserId}
                      >
                        <SelectTrigger className={cn(errors.role && "border-rose-500")}>
                          <SelectValue placeholder="Pilih peran peserta" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <span>{option.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({option.value})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && (
                    <p className="text-xs text-rose-600 mt-1">{errors.role.message}</p>
                  )}
                </div>

                {availableMembers.length === 0 && !groupMembersLoading && !groupMembersError && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md p-3">
                    Semua anggota grup sudah menjadi peserta ruangan ini.
                  </p>
                )}

                {inviteError && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-3">
                    <span className="font-medium">Error: </span>
                    {inviteError}
                  </p>
                )}

                <DialogFooter className="pt-2 gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)} 
                    disabled={inviteMutation.isPending}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={inviteDisabled}>
                    {inviteMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {inviteMutation.isPending ? 'Mengundang...' : 'Undang Peserta'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {participantsErrorMessage && (
        <div className="mb-4 p-4 border border-rose-100 bg-rose-50 rounded-md flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-rose-700">{participantsErrorMessage}</p>
          <Button variant="outline" size="sm" onClick={() => refetchParticipants()}>
            Coba lagi
          </Button>
        </div>
      )}

      {isLoading && <ParticipantsSkeleton />}
      
      {!isLoading && participants.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">
          Belum ada peserta yang terdaftar di ruangan ini.
        </div>
      )}
      
      {!isLoading && participants.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              roomId={roomId}
              canManageParticipants={canManageParticipants}
              isCurrentUser={participant.user_id === currentUserId}
              onLeave={participant.user_id === currentUserId && canLeaveRoom ? handleLeaveRoom : null}
              leaveState={{ isPending: leaveMutation.isPending, error: leaveErrorMessage }}
            />
          ))}
        </div>
      )}
    </TabsContent>
  )
}

function ParticipantCard({ 
  participant, 
  roomId, 
  canManageParticipants, 
  isCurrentUser, 
  onLeave, 
  leaveState 
}) {
  const profileName = participant.user?.profile?.full_name || participant.user?.username || 'Pengguna'
  const leaveError = isCurrentUser ? leaveState?.error : null

  return (
    <div className="p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(profileName)}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{profileName}</div>
          <div className="text-sm text-muted-foreground truncate">
            {participant.user?.username || participant.user_id}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Gabung: {participant.added_at || '—'}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="text-xs px-2 py-1 rounded-full bg-slate-100 text-muted-foreground capitalize">
            {formatRole(participant.role)}
          </div>

          {isCurrentUser && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              disabled={!onLeave || leaveState?.isPending}
              className="w-full"
            >
              {leaveState?.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Keluar
            </Button>
          )}
        </div>
      </div>

      {leaveError && (
        <p className="text-xs text-rose-600 mt-2">{leaveError}</p>
      )}
    </div>
  )
}

function ParticipantsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-4 border rounded-lg bg-white">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}