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
import { Label } from '@/components/ui/label'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus, UserMinus, LogOut } from 'lucide-react'
import {
  useRoomParticipants,
  useAddRoomParticipant,
  useUpdateRoomParticipant,
  useRemoveRoomParticipant,
  useLeaveRoom,
} from '@/services/roomHooks'
import { useGroupMembers } from '@/services/groupHooks'
import { useMe } from '@/services/authHooks'

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

const roleOptions = [
  { value: 'participant', label: 'Participant' },
  { value: 'reviewer', label: 'Reviewer' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'responsible', label: 'Responsible' },
]

const inviteSchema = z.object({
  userId: z.string().min(1, 'Pilih anggota yang ingin diundang'),
  role: z.enum(['participant', 'reviewer', 'moderator', 'responsible'], {
    required_error: 'Pilih peran peserta',
    invalid_type_error: 'Peran tidak valid',
  }),
})

const MANAGER_ROLES = new Set(['responsible', 'moderator'])

export default function ParticipantsTab({ roomId, room }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: me } = useMe({ staleTime: 60_000 })
  const currentUserId = me?.id ?? null

  const userRoleKey = (room?.user_role || '').toLowerCase()
  const canManageParticipants = MANAGER_ROLES.has(userRoleKey)

  const {
    data,
    isLoading,
    isError: participantsError,
    error: participantsErrorObj,
    refetch: refetchParticipants,
  } = useRoomParticipants(roomId, { per_page: 1000 })
  const participants = data?.participants ?? []
  const groupId = room?.group?.id || room?.group_id

  const myMembership = useMemo(() => {
    if (!currentUserId) return null
    return participants.find((p) => p.user_id === currentUserId) ?? null
  }, [participants, currentUserId])
  const canLeaveRoom = Boolean(myMembership)

  const leaveMutation = useLeaveRoom(roomId)
  const handleLeaveRoom = useCallback(() => {
    if (!roomId || leaveMutation.isPending) return
    leaveMutation.mutate()
  }, [leaveMutation, roomId])
  const leaveErrorMessage = leaveMutation.error?.response?.data?.message || leaveMutation.error?.message || null

  const shouldFetchMembers = dialogOpen && Boolean(groupId) && canManageParticipants
  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersError,
    error: membersErrorObj,
    refetch: refetchMembers,
  } = useGroupMembers(groupId, { enabled: shouldFetchMembers })

  const members = membersData?.members ?? []
  const availableMembers = useMemo(() => {
    if (!members?.length) return []
    const participantIds = new Set(participants.map((p) => p.user_id))
    return members.filter((member) => !participantIds.has(member.id))
  }, [members, participants])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { userId: '', role: 'participant' },
  })

  const inviteMutation = useAddRoomParticipant(roomId, {
    onSuccess: () => {
      reset({ userId: '', role: 'participant' })
      setDialogOpen(false)
    },
  })

  useEffect(() => {
    if (!dialogOpen) {
      reset({ userId: '', role: 'participant' })
    }
  }, [dialogOpen, reset])

  const onInvite = (values) => {
    inviteMutation.mutate({ user_id: values.userId, role: values.role })
  }

  const inviteError = inviteMutation.error?.response?.data?.message || inviteMutation.error?.message || null
  const inviteDisabled =
    !canManageParticipants ||
    !groupId ||
    membersLoading ||
    membersError ||
    availableMembers.length === 0 ||
    inviteMutation.isPending

  const participantsErrorMessage =
    participantsError && (participantsErrorObj?.response?.data?.message || participantsErrorObj?.message || 'Gagal memuat peserta ruangan.')

  return (
    <TabsContent value="participants" className="mt-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Daftar Peserta</h3>
          <p className="text-sm text-muted-foreground">Kelola anggota ruangan dan perannya.</p>
          {!canManageParticipants && (
            <p className="text-xs text-muted-foreground mt-1">Anda tidak memiliki akses untuk mengelola peserta.</p>
          )}
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="inline-flex items-center gap-2" disabled={!groupId}>
              <UserPlus className="w-4 h-4" /> Undang Peserta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Undang anggota ke ruangan</DialogTitle>
              <DialogDescription>Pilih anggota grup dan tentukan perannya.</DialogDescription>
            </DialogHeader>
            {!groupId && (
              <p className="text-sm text-rose-600">Ruangan belum terhubung dengan grup sehingga tidak dapat mengundang peserta.</p>
            )}
            {groupId && (
              <form onSubmit={handleSubmit(onInvite)} className="space-y-4">
                <div>
                  <Label>Anggota Grup</Label>
                  <Controller
                    name="userId"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={
                          membersLoading || membersError || inviteMutation.isPending || availableMembers.length === 0
                        }
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue
                            placeholder={
                              membersLoading
                                ? 'Memuat anggota...'
                                : availableMembers.length === 0
                                  ? 'Semua anggota sudah terdaftar'
                                  : 'Pilih anggota'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {availableMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.profile?.full_name || member.username || member.name || member.email}
                              {member.username && (
                                <span className="text-xs text-muted-foreground ml-2">@{member.username}</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.userId && <p className="text-xs text-rose-600 mt-1">{errors.userId.message}</p>}
                  {membersError && (
                    <p className="text-xs text-rose-600 mt-1">
                      {membersErrorObj?.response?.data?.message || membersErrorObj?.message || 'Gagal memuat anggota grup.'}
                      <button type="button" className="ml-2 underline" onClick={() => refetchMembers()}>
                        Coba lagi
                      </button>
                    </p>
                  )}
                </div>

                <div>
                  <Label>Peran Peserta</Label>
                  <Controller
                    name="role"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange} disabled={inviteMutation.isPending}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.role && <p className="text-xs text-rose-600 mt-1">{errors.role.message}</p>}
                </div>

                {availableMembers.length === 0 && !membersLoading && !membersError && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-md p-2">
                    Semua anggota grup sudah menjadi peserta ruangan ini.
                  </p>
                )}

                {inviteError && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">{inviteError}</p>
                )}

                <DialogFooter className="pt-2">
                  <Button type="submit" disabled={inviteDisabled}>
                    {inviteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Undang
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

function ParticipantCard({ participant, roomId, canManageParticipants, isCurrentUser, onLeave, leaveState }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const updateRoleMutation = useUpdateRoomParticipant(roomId, participant.id, {})
  const removeParticipantMutation = useRemoveRoomParticipant(roomId, participant.id, {
    onSuccess: () => setConfirmOpen(false),
  })

  const profileName = participant.user?.profile?.full_name || participant.user?.username || 'Pengguna'
  const roleUpdatePending = updateRoleMutation.isPending
  const removePending = removeParticipantMutation.isPending
  const inlineError =
    updateRoleMutation.error?.response?.data?.message ||
    removeParticipantMutation.error?.response?.data?.message ||
    updateRoleMutation.error?.message ||
    removeParticipantMutation.error?.message ||
    null

  const leaveError = isCurrentUser ? leaveState?.error : null

  const handleRoleChange = (value) => {
    if (!value || value === participant.role) return
    updateRoleMutation.mutate({ role: value })
  }

  const handleRemove = () => {
    removeParticipantMutation.mutate()
  }

  return (
    <div className="p-3 border rounded-md bg-white">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback>{getInitials(profileName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium">{profileName}</div>
          <div className="text-sm text-muted-foreground">{participant.user?.username || participant.user_id}</div>
          <div className="text-xs text-muted-foreground mt-1">Gabung: {participant.added_at || '—'}</div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {canManageParticipants ? (
            <Select
              value={participant.role}
              onValueChange={handleRoleChange}
              disabled={roleUpdatePending || removePending}
            >
              <SelectTrigger className="w-40 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="text-sm">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-muted-foreground capitalize">
              {formatRole(participant.role)}
            </div>
          )}

          {isCurrentUser ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onLeave}
              disabled={!onLeave || leaveState?.isPending}
            >
              {leaveState?.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              Keluar Ruangan
            </Button>
          ) : (
            canManageParticipants && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={removePending}
                >
                  {removePending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserMinus className="w-4 h-4 mr-2" />
                  )}
                  Hapus
                </Button>
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Hapus Peserta</DialogTitle>
                      <DialogDescription>
                        Peserta <span className="font-semibold">{profileName}</span> akan dihapus dari ruangan ini.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={removePending}>
                        Batal
                      </Button>
                      <Button variant="destructive" onClick={handleRemove} disabled={removePending}>
                        {removePending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Hapus Peserta
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )
          )}
        </div>
      </div>
      {roleUpdatePending && (
        <p className="text-xs text-muted-foreground mt-2">Menyimpan perubahan peran...</p>
      )}
      {inlineError && <p className="text-xs text-rose-600 mt-2">{inlineError}</p>}
      {leaveError && <p className="text-xs text-rose-600 mt-2">{leaveError}</p>}
    </div>
  )
}

function ParticipantsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 p-3 border rounded-md bg-white">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  )
}
