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

// Utility functions
const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || '')
    .slice(0, 2)
    .join('')
}

const extractMembers = (data) => {
  if (!data) return []

  const possiblePaths = [
    data.members,
    data.memberships,
    data.data?.members,
    data.items,
    data.data?.items,
    Array.isArray(data) ? data : undefined
  ]

  for (const members of possiblePaths) {
    if (Array.isArray(members) && members.length > 0) {
      return members
    }
  }
  return []
}

const getMemberDisplayName = (member) => {
  return (
    member?.name ||
    member?.user?.profile?.full_name ||
    member?.user?.username ||
    member?.displayName ||
    'Pengguna'
  )
}

const getMemberEmail = (member) => {
  return member?.email || member?.user?.email || '—'
}

const getMemberId = (member) => {
  return member.id || member.user_id || ''
}

export default function Members({ groupId, ownerId }) {
  // State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)

  // Forms
  const addForm = useForm({
    defaultValues: { user_id: '', role: 'member' }
  })
  
  const roleForm = useForm({
    defaultValues: { role: 'member' }
  })

  // API Hooks
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGroupMembers(groupId, { 
    params: { per_page: 1000 }, 
    enabled: Boolean(groupId) 
  })

  // Extract members dari memberships (sumber total), fallback ke members
  const members = useMemo(() => {
    if (Array.isArray(data?.memberships) && data?.memberships.length > 0) {
      return data.memberships
    }
    if (Array.isArray(data?.members) && data?.members.length > 0) {
      return data.members
    }
    return []
  }, [data])

  const addMemberMutation = useAddGroupMember(groupId, {
    onSuccess: () => {
      addForm.reset()
      setIsAddOpen(false)
      refetch()
    },
  })

  const removeMemberMutation = useRemoveGroupMember(groupId, {
    onSuccess: () => {
      setIsDeleteOpen(false)
      setSelectedMember(null)
      refetch()
    },
  })

  const updateRoleMutation = useUpdateMemberRole(groupId, {
    onSuccess: () => {
      setIsRoleOpen(false)
      setSelectedMember(null)
      refetch()
    },
  })

  // Handlers
  const handleSubmitAddMember = (values) => {
    if (!groupId) {
      console.error('groupId is required')
      return
    }
    console.log('Adding member:', values)
    addMemberMutation.mutate(values)
  }

  const handleSubmitUpdateRole = (values) => {
    if (!selectedMember || !groupId) {
      console.error('No member selected or groupId missing')
      return
    }
    
    const userId = getMemberId(selectedMember)
    if (!userId) {
      console.error('No user ID found for member:', selectedMember)
      return
    }

    console.log('Updating role:', { userId, role: values.role })
    updateRoleMutation.mutate({ 
      userId, 
      payload: { role: values.role } 
    })
  }

  const handleConfirmRemove = () => {
    if (!selectedMember || !groupId) {
      console.error('No member selected or groupId missing')
      return
    }
    
    const userId = getMemberId(selectedMember)
    if (!userId) {
      console.error('No user ID found for member:', selectedMember)
      return
    }

    console.log('Removing member:', userId)
    removeMemberMutation.mutate(userId)
  }

  const handleOpenRoleDialog = (member) => {
    setSelectedMember(member)
    roleForm.reset({ role: member.role })
    setIsRoleOpen(true)
  }

  const handleOpenDeleteDialog = (member) => {
    setSelectedMember({
      ...member,
      displayName: getMemberDisplayName(member)
    })
    setIsDeleteOpen(true)
  }

  // Role options
  const roleOptions = useMemo(() => [
    { label: 'Member', value: 'member' },
    { label: 'Manager', value: 'manager' },
  ], [])

  // Render role badge
  const renderRoleBadge = (role) => {
    const roleClasses = {
      owner: 'bg-green-light text-green-dark',
      manager: 'bg-blue-light text-blue-dark',
      member: 'bg-gray-light text-gray-dark',
    }

    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        roleClasses[role] || roleClasses.member
      }`}>
        {role}
      </span>
    )
  }


  return (
    <div className="space-y-4">
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Anggota ({members.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                console.log('Manual refetch triggered')
                refetch()
              }}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
            
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
                  className="bg-blue-600 text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> 
                  Tambah Anggota
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah anggota</DialogTitle>
                  <DialogDescription>
                    Masukkan ID pengguna dan peran untuk ditambahkan ke grup.
                  </DialogDescription>
                </DialogHeader>

                <form 
                  className="space-y-4" 
                  onSubmit={addForm.handleSubmit(handleSubmitAddMember)}
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium">User ID</label>
                    <Input 
                      placeholder="UUID pengguna" 
                      {...addForm.register('user_id', { required: true })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peran</label>
                    <Select 
                      value={addForm.watch('role')} 
                      onValueChange={(value) => addForm.setValue('role', value)}
                    >
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
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddOpen(false)}
                    >
                      Batal
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addMemberMutation.isPending}
                    >
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
            <div className="text-sm text-muted-foreground text-center py-4">
              Memuat anggota...
            </div>
          ) : isError ? (
            <div className="text-sm text-red-600 text-center py-4">
              Gagal memuat anggota. 
              <Button 
                variant="link" 
                onClick={() => refetch()}
                className="ml-2"
              >
                Coba lagi
              </Button>
            </div>
          ) : members.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Belum ada anggota dalam grup ini.
            </div>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => {
                const userName = getMemberDisplayName(member)
                const userEmail = getMemberEmail(member)
                const userId = getMemberId(member)
                const isOwner = member.role === 'owner' || userId === ownerId

                return (
                  <li 
                    key={userId} 
                    className="flex items-center justify-between p-3 bg-white rounded-md border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-body-md font-medium">
                            {userName}
                          </div>
                          {isOwner && (
                            <span className="text-yellow-600" title="Pemilik">
                              <Crown className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                        
                        <div className="text-small text-muted-foreground">
                          {userEmail}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {userId}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                        {renderRoleBadge(member.role)}
                        
                        {!isOwner && (
                          <button
                            className="text-xs text-blue-600 mt-2 hover:text-blue-800 transition-colors"
                            onClick={() => handleOpenRoleDialog(member)}
                          >
                            Ubah Peran
                          </button>
                        )}
                      </div>
                      
                      {!isOwner && (
                        <button
                          onClick={() => handleOpenDeleteDialog(member)}
                          className="text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
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

      {/* Delete Member Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus anggota</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggota ini dari grup?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2">
            <p className="font-medium">{selectedMember?.displayName}</p>
            <p className="text-sm text-muted-foreground">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteOpen(false)}
            >
              Batalkan
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRemove}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Role Dialog */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah peran</DialogTitle>
            <DialogDescription>
              Pilih peran baru untuk {selectedMember?.displayName}.
            </DialogDescription>
          </DialogHeader>
          
          <form 
            className="space-y-4" 
            onSubmit={roleForm.handleSubmit(handleSubmitUpdateRole)}
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Peran</label>
              <Select 
                value={roleForm.watch('role')} 
                onValueChange={(value) => roleForm.setValue('role', value)}
              >
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsRoleOpen(false)}
              >
                Batalkan
              </Button>
              <Button 
                type="submit" 
                disabled={updateRoleMutation.isPending}
              >
                {updateRoleMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}