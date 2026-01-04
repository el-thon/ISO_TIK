import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Trash, Crown, RefreshCcw } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import {
  useAddGroupMember,
  useGroupMembers,
  useRemoveGroupMember,
  useUpdateMemberRole,
} from '@/services/groupHooks'

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function Members({ groupId, ownerId }) {
  const { data, isLoading, isError, refetch } = useGroupMembers(groupId, { enabled: Boolean(groupId) })
  const members = data?.members ?? []

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const addForm = useForm({ defaultValues: { user_id: '', role: 'member' } })
  const roleForm = useForm({ defaultValues: { role: 'member' } })

  const addMemberMutation = useAddGroupMember(groupId, {
    onSuccess: () => {
      addForm.reset()
      setIsAddOpen(false)
    },
  })
  const removeMemberMutation = useRemoveGroupMember(groupId, {
    onSuccess: () => {
      setIsDeleteOpen(false)
      setSelectedMember(null)
    },
  })
  const updateRoleMutation = useUpdateMemberRole(groupId, {
    onSuccess: () => {
      setIsRoleOpen(false)
      setSelectedMember(null)
    },
  })

  const submitAddMember = (values) => {
    addMemberMutation.mutate(values)
  }

  const submitUpdateRole = (values) => {
    if (!selectedMember) return
    updateRoleMutation.mutate({ userId: selectedMember.id || selectedMember.user_id, payload: { role: values.role } })
  }

  const confirmRemove = () => {
    if (!selectedMember) return
    removeMemberMutation.mutate(selectedMember.id || selectedMember.user_id)
  }

  const roleOptions = useMemo(() => [
    { label: 'Member', value: 'member' },
    { label: 'Manager', value: 'manager' },
  ], [])

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Anggota ({members.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading} className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" />
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 text-white flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tambah Anggota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah anggota</DialogTitle>
                  <DialogDescription>Masukkan ID pengguna dan peran untuk ditambahkan ke grup.</DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={addForm.handleSubmit(submitAddMember)}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User ID</label>
                    <Input placeholder="UUID pengguna" {...addForm.register('user_id', { required: true })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peran</label>
                    <Select value={addForm.watch('role')} onValueChange={(value) => addForm.setValue('role', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih peran" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                      Batal
                    </Button>
                    <Button type="submit" disabled={addMemberMutation.isPending}>
                      {addMemberMutation.isPending ? 'Menyimpan...' : 'Tambah'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Memuat anggota...</div>
          ) : isError ? (
            <div className="text-sm text-red-600">Gagal memuat anggota.</div>
          ) : members.length === 0 ? (
            <div className="text-sm text-muted-foreground">Belum ada anggota.</div>
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((member) => {
                const userName = member?.name || member?.user?.profile?.full_name || member?.user?.username || 'Pengguna'
                const userEmail = member?.email || member?.user?.email || '—'
                const userId = member.id || member.user_id
                const isOwner = member.role === 'owner' || userId === ownerId
                return (
                  <li key={userId} className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-body-md font-medium">{userName}</div>
                          {isOwner && (
                            <span className="text-yellow-600" title="Pemilik">
                              <Crown className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        <div className="text-small text-muted-foreground">{userEmail}</div>
                        <div className="text-small text-muted-foreground">{member.role}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          member.role === 'owner'
                            ? 'bg-green-light text-green-dark'
                            : member.role === 'manager'
                            ? 'bg-blue-light text-blue-dark'
                            : 'bg-gray-light text-gray-dark'
                        }`}>{member.role}</span>
                        {!isOwner && (
                          <button
                            className="text-xs text-blue mt-2"
                            onClick={() => {
                              setSelectedMember({ ...member, id: userId })
                              roleForm.reset({ role: member.role })
                              setIsRoleOpen(true)
                            }}
                          >
                            Ubah Peran
                          </button>
                        )}
                      </div>
                      {!isOwner && (
                        <button
                          onClick={() => {
                            setSelectedMember({ ...member, id: userId, displayName: userName })
                            setIsDeleteOpen(true)
                          }}
                          className="text-red p-1 rounded"
                          aria-label={`Hapus ${userName}`}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus anggota</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus anggota ini dari grup?</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{selectedMember?.displayName}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batalkan
            </Button>
            <Button variant="destructive" onClick={confirmRemove} disabled={removeMemberMutation.isPending}>
              {removeMemberMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah peran</DialogTitle>
            <DialogDescription>Pilih peran baru untuk anggota.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={roleForm.handleSubmit(submitUpdateRole)}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Peran</label>
              <Select value={roleForm.watch('role')} onValueChange={(value) => roleForm.setValue('role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih peran" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRoleOpen(false)}>
                Batalkan
              </Button>
              <Button type="submit" disabled={updateRoleMutation.isPending}>
                {updateRoleMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
