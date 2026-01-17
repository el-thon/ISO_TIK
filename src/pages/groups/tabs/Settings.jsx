import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Copy, RefreshCw, Archive as ArchiveIcon, ShieldOff, LogOut } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import {
  useArchiveGroup,
  useDeleteGroup,
  useDisableJoinCode,
  useGenerateJoinCode,
  useGroupJoinCode,
  useLeaveGroup,
  useRestoreGroup,
  useUpdateGroup,
} from '@/services/groupHooks'
import { useNavigate } from 'react-router-dom'

export default function Settings({ groupId, group }) {
  const navigate = useNavigate()
  const [hidden, setHidden] = useState(true)
  const { data: joinCodeData, isLoading: joinLoading, refetch: refetchJoinCode } = useGroupJoinCode(groupId, { enabled: Boolean(groupId) })
  const joinCode = joinCodeData?.join_code ?? group?.join_code ?? null

  const updateForm = useForm({
    defaultValues: {
      name: group?.name ?? '',
      description: group?.description ?? '',
    },
    values: {
      name: group?.name ?? '',
      description: group?.description ?? '',
    },
  })

  const updateGroupMutation = useUpdateGroup(groupId)
  const archiveMutation = useArchiveGroup(groupId)
  const restoreMutation = useRestoreGroup(groupId)
  const deleteMutation = useDeleteGroup(groupId, {
    onSuccess: () => navigate('/groups'),
  })
  const leaveMutation = useLeaveGroup(groupId, {
    onSuccess: () => navigate('/groups'),
  })
  const generateJoinCodeMutation = useGenerateJoinCode(groupId, {
    onSuccess: () => refetchJoinCode(),
  })
  const disableJoinCodeMutation = useDisableJoinCode(groupId, {
    onSuccess: () => refetchJoinCode(),
  })

  const onSubmitGroup = (values) => {
    updateGroupMutation.mutate(values)
  }

  const copyCode = () => {
    if (joinCode && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(joinCode)
    }
  }

  const statusBadge = useMemo(() => {
    if (!group) return null
    return group.is_active ? (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Aktif</span>
    ) : (
      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">Terarsip</span>
    )
  }, [group])

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Pengaturan Grup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <form className="space-y-4" onSubmit={updateForm.handleSubmit(onSubmitGroup)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-small font-medium text-muted-foreground">Status</div>
                <div className="mt-1">{statusBadge}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nama</label>
                <Input placeholder="Nama grup" {...updateForm.register('name')} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deskripsi</label>
                <Input placeholder="Deskripsi" {...updateForm.register('description')} />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={updateGroupMutation.isPending}>
                {updateGroupMutation.isPending ? 'Menyimpan...' : 'Simpan perubahan'}
              </Button>
            </div>
          </form>

          <div>
            <div className="mb-2 text-small font-medium">Kode Bergabung</div>
            <div className="text-small text-muted-foreground mb-3">Izinkan pengguna bergabung menggunakan kode berikut.</div>
            <div className="p-4 border rounded-md bg-white space-y-4">
              {joinLoading ? (
                <div className="text-sm text-muted-foreground">Memuat kode...</div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 border rounded-md px-4 py-2 font-mono text-sm">
                      {joinCode ? (hidden ? '••••••••' : joinCode) : <span className="text-muted-foreground">Tidak aktif</span>}
                    </div>
                    <div className="text-small text-muted-foreground">
                      {joinCodeData?.is_join_code_active ? 'Aktif' : 'Tidak aktif'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setHidden((prev) => !prev)} className="text-muted-foreground flex items-center gap-1 text-sm">
                      {hidden ? <Eye /> : <EyeOff />} {hidden ? 'Tampilkan' : 'Sembunyikan'}
                    </button>
                    <button onClick={copyCode} disabled={!joinCode} className="text-muted-foreground flex items-center gap-1 text-sm">
                      <Copy /> Salin
                    </button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={generateJoinCodeMutation.isPending}
                  onClick={() => generateJoinCodeMutation.mutate({})}
                >
                  <RefreshCw className="w-4 h-4" /> {generateJoinCodeMutation.isPending ? 'Membuat...' : 'Generate baru'}
                </Button>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  disabled={disableJoinCodeMutation.isPending || !joinCode}
                  onClick={() => disableJoinCodeMutation.mutate()}
                >
                  <ShieldOff className="w-4 h-4" /> Nonaktifkan kode
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 text-small font-medium">Zona Berbahaya</div>
            <div className="p-4 bg-red-light rounded-md space-y-4">
              <div className="p-4 bg-white rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Arsipkan Grup</div>
                  <div className="text-small text-muted-foreground mt-1">Arsipkan grup ini sementara. Dapat dipulihkan kapan saja.</div>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => (group?.is_active ? archiveMutation.mutate() : restoreMutation.mutate())}
                  disabled={archiveMutation.isPending || restoreMutation.isPending}
                >
                  <ArchiveIcon className="w-4 h-4" /> {group?.is_active ? 'Arsipkan' : 'Pulihkan'}
                </Button>
              </div>

              <div className="p-4 bg-white rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Keluar dari Grup</div>
                  <div className="text-small text-muted-foreground mt-1">Anda akan kehilangan akses ke seluruh konten grup.</div>
                </div>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 text-red-600"
                  onClick={() => leaveMutation.mutate()}
                  disabled={leaveMutation.isPending}
                >
                  <LogOut className="w-4 h-4" /> {leaveMutation.isPending ? 'Memproses...' : 'Keluar Grup'}
                </Button>
              </div>

              <div className="p-4 bg-white rounded-md flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Hapus Grup</div>
                  <div className="text-small text-muted-foreground mt-1">Tindakan ini tidak dapat dibatalkan.</div>
                </div>
                <Button
                  className="bg-red-600 text-white"
                  onClick={() => deleteMutation.mutate()}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Menghapus...' : 'Hapus Grup'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
