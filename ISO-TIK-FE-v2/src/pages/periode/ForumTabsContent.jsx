import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useForumParticipants, useForumForms, useAddForumParticipant } from '@/hooks/useForum'
import InviteParticipantDialog from '@/pages/periode/components/InviteParticipantDialog'
import { toast } from '@/components/ui/use-toast'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import forumService from '@/services/forumService'
import { usePeriod } from '@/hooks/usePeriod'
import AttachmentsTab from './tabs/AttachmentsTab'
import SettingsTab from './tabs/SettingsTab'
import { formatDate } from '@/pages/periode/constants'

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function ForumTabsContent({ forumId, forum, isForumOwner, currentUserId }) {
  const page = 1
  const perPage = 10
  const periodId = forum?.forum_period_id

  const {
    data: formsData,
    isLoading: formsLoading,
    isError: formsError,
    error: formsErr,
    refetch: refetchForms,
  } = useForumForms(forumId, { page, per_page: perPage }, { enabled: Boolean(forumId) })

  const {
    data: participantsData,
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErr,
    refetch: refetchParticipants,
  } = useForumParticipants(forumId, { per_page: 200 }, { enabled: Boolean(forumId) })

  const { data: periodDetail } = usePeriod(periodId, { enabled: Boolean(periodId) })
  const canManageParticipants = Boolean(isForumOwner)
  const queryClient = useQueryClient()

  const updateParticipant = useMutation({
    mutationFn: ({ participantId, payload }) => forumService.updateForumParticipant(forumId, participantId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forums', forumId, 'participants'] })
      queryClient.invalidateQueries({ queryKey: ['forums', forumId] })
      refetchParticipants?.()
      toast({ title: 'Berhasil', description: 'Perubahan peserta tersimpan.' })
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Gagal', description: err?.response?.data?.message || 'Gagal memperbarui peserta.' })
    },
  })

  const forms = formsData?.forms ?? formsData?.topics ?? []
  const participants = participantsData?.participants ?? []
  const periodMembers = periodDetail?.members ?? []

  const candidates = useMemo(() => {
    const existing = participants.map((participant) => String(participant?.user_id ?? participant?.user?.id ?? ''))
    return periodMembers.filter((member) => {
      const id = String(member?.user_id ?? member?.user?.id ?? '')
      return id && !existing.includes(id)
    })
  }, [periodMembers, participants])

  const formsErrorMessage = formsErr?.response?.data?.message || formsErr?.message || 'Gagal memuat daftar formulir.'
  const participantsErrorMessage = participantsErr?.response?.data?.message || participantsErr?.message || 'Gagal memuat daftar peserta.'

  const resolvedParticipants = useMemo(() => {
    const base = [...participants]
    const ownerId = forum?.responsible_user_id
    const hasOwner = ownerId && base.some((participant) => String(participant?.user_id) === String(ownerId))
    if (ownerId && !hasOwner) {
      const ownerUser = forum?.responsible_user
      base.push({
        id: `owner-${ownerId}`,
        user_id: ownerId,
        role: 'owner',
        is_responsible_user: true,
        user: ownerUser || {
          id: ownerId,
          username: ownerUser?.username,
          email: ownerUser?.email,
          profile: ownerUser?.profile || { full_name: ownerUser?.name },
        },
      })
    }
    return base
  }, [participants, forum])

  const orderedParticipants = useMemo(() => {
    return [...resolvedParticipants].sort((a, b) => {
      const aName = a?.user?.profile?.full_name || a?.user?.username || a?.user?.email || ''
      const bName = b?.user?.profile?.full_name || b?.user?.username || b?.user?.email || ''
      return aName.localeCompare(bName)
    })
  }, [resolvedParticipants])

  const addParticipantMutation = useAddForumParticipant(forumId, {
    onSuccess: () => {
      refetchParticipants()
      toast({ title: 'Berhasil', description: 'Peserta berhasil diundang.' })
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Gagal', description: error?.response?.data?.message || 'Gagal mengundang peserta.' })
    },
  })

  const [inviteOpen, setInviteOpen] = useState(false)

  const handleInvite = async (selectedUserIds = [], role = 'auditee') => {
    if (!selectedUserIds?.length || addParticipantMutation.isPending) return
    try {
      await Promise.all(selectedUserIds.map((userId) => addParticipantMutation.mutateAsync({ user_id: String(userId), role })))
      setInviteOpen(false)
    } catch {
      // onError will show toast
    } finally {
      refetchParticipants()
    }
  }

  return (
    <>
      <TabsContent value="forms" className="mt-4 space-y-4 w-full">
        {formsError && (
          <div className="p-4 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between gap-2">
            <span>{formsErrorMessage}</span>
            <Button variant="outline" size="sm" onClick={() => refetchForms()}>Coba lagi</Button>
          </div>
        )}

        {formsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <Card key={`forum-form-skeleton-${idx}`}>
                <CardContent className="pt-6 space-y-3">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : forms.length === 0 ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground bg-white">
            Belum ada formulir di forum ini.
          </div>
        ) : (
          <div className="space-y-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <Link to={`/formulir/${form.id}`} className="block no-underline text-inherit">
                  <CardContent className="pt-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-lg font-semibold">{form.title || 'Formulir Ketidaksesuaian'}</div>
                          {form.status && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-50 text-slate-600">
                              {String(form.status).replace('_', ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {form.description || 'Belum ada deskripsi'}
                        </p>
                        {form.security_level && (
                          <span className="inline-block mt-3 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            {form.security_level}
                          </span>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Dibuat {formatDate(form.created_at)}</div>
                        <div className="text-xs mt-2">Diperbarui {formatDate(form.updated_at)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <AttachmentsTab roomId={forumId} />

      <TabsContent value="participants" className="mt-4 space-y-4 w-full">
        {participantsError && (
          <div className="p-4 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between gap-2">
            <span>{participantsErrorMessage}</span>
            <Button variant="outline" size="sm" onClick={() => refetchParticipants()}>Coba lagi</Button>
          </div>
        )}

        {participantsLoading ? (
          <Card className="w-full">
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
            </CardContent>
          </Card>
        ) : orderedParticipants.length === 0 ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground bg-white">
            Belum ada peserta di forum ini.
          </div>
        ) : (
          <Card className="w-full">
            <CardContent className="pt-6 space-y-4">
              {canManageParticipants && (
                <div className="mb-2 flex justify-end">
                  <InviteParticipantDialog
                    open={inviteOpen}
                    onOpenChange={setInviteOpen}
                    candidates={candidates}
                    onInvite={handleInvite}
                    isPending={addParticipantMutation.isPending}
                    roomName={forum?.name}
                  />
                </div>
              )}
              {orderedParticipants.map((participant) => {
                const user = participant?.user ?? {}
                const displayName = user?.profile?.full_name || user?.username || user?.email || 'Pengguna'
                const isOwner = String(participant?.user_id) === String(forum?.responsible_user_id) || participant?.is_responsible_user === true
                const roleLabel = participant?.role || (isOwner ? 'auditor' : 'member')
                const isCurrentUser = currentUserId && String(participant?.user_id) === String(currentUserId)
                return (
                  <div key={participant.id || participant.user_id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {displayName}
                          {isCurrentUser && <span className="ml-2 text-xs text-blue-600">(Anda)</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">{user?.email || '-'}</div>
                      </div>
                    </div>
                    <div>
                      {canManageParticipants && !String(participant.id).startsWith('owner-') ? (
                        <Select
                          value={participant?.role || 'auditee'}
                          onValueChange={(val) => {
                            if (!participant?.id) return
                            updateParticipant.mutate({ participantId: participant.id, payload: { role: val } })
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={participant?.role || 'member'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auditor">Auditor</SelectItem>
                            <SelectItem value="auditee">Auditee</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isOwner ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {isForumOwner && <SettingsTab room={forum} />}
    </>
  )
}
