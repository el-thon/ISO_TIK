import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useArchiveRoom, useLockRoom, useRestoreRoom, useUnlockRoom } from '@/services/roomHooks'

const formatVisibility = (value) => {
  switch (value) {
    case 'private':
      return 'Private'
    case 'org-wide':
      return 'Org-wide'
    case 'group-wide':
    default:
      return 'Group-wide'
  }
}

export default function SettingsTab({ room }) {
  const roomId = room?.id

  const lockMutation = useLockRoom(roomId)
  const unlockMutation = useUnlockRoom(roomId)
  const archiveMutation = useArchiveRoom(roomId)
  const restoreMutation = useRestoreRoom(roomId)

  const isActionPending =
    lockMutation.isPending ||
    unlockMutation.isPending ||
    archiveMutation.isPending ||
    restoreMutation.isPending

  const handleLockToggle = () => {
    if (!roomId) return
    if (room?.is_locked) {
      unlockMutation.mutate()
    } else {
      lockMutation.mutate()
    }
  }

  const handleArchiveToggle = () => {
    if (!roomId) return
    if (room?.is_archived) {
      restoreMutation.mutate()
    } else {
      archiveMutation.mutate()
    }
  }

  const infoItems = [
    { label: 'ID Ruangan', value: room?.id || '-' },
    { label: 'Visibility', value: formatVisibility(room?.visibility) },
    { label: 'Status', value: room?.is_locked ? 'Locked' : 'Unlocked' },
    { label: 'Arsip', value: room?.is_archived ? 'Archived' : 'Active' },
    { label: 'Peran Saya', value: room?.user_role || 'Tidak diketahui' },
  ]

  const errorMessage =
    lockMutation.error?.response?.data?.message ||
    unlockMutation.error?.response?.data?.message ||
    archiveMutation.error?.response?.data?.message ||
    restoreMutation.error?.response?.data?.message ||
    lockMutation.error?.message ||
    unlockMutation.error?.message ||
    archiveMutation.error?.message ||
    restoreMutation.error?.message

  return (
    <TabsContent value="settings" className="mt-4 space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Informasi Ruangan</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {infoItems.map((item) => (
            <div key={item.label} className="p-4 border rounded-md bg-white">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</div>
              <div className="mt-1 text-sm font-medium">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg">Tindakan</h3>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant={room?.is_locked ? 'outline' : 'default'}
            onClick={handleLockToggle}
            disabled={!roomId || isActionPending}
          >
            {(lockMutation.isPending || unlockMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {room?.is_locked ? 'Buka Kunci' : 'Kunci Ruangan'}
          </Button>
          <Button
            variant={room?.is_archived ? 'outline' : 'destructive'}
            onClick={handleArchiveToggle}
            disabled={!roomId || isActionPending}
          >
            {(archiveMutation.isPending || restoreMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {room?.is_archived ? 'Pulihkan' : 'Arsipkan'}
          </Button>
        </div>
        {errorMessage && (
          <div className="mt-3 text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-md p-2">
            {errorMessage}
          </div>
        )}
      </div>
    </TabsContent>
  )
}
