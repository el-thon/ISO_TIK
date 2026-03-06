import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus, Trash, Crown, RefreshCcw, Search, X } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useForm } from 'react-hook-form'
import { useAddGroupMember, useGroupMembers, useRemoveGroupMember, useUpdateMemberRole, useGroupUserSearch } from '@/services/groupHooks'
import { cn } from '@/lib/utils'

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
    data.members?.data,
    data.members?.items,
    data.members?.list,
    data.memberships,
    data.memberships?.data,
    data.data?.members,
    data.data?.members?.data,
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
  return member.user_id || member.user?.id || member.id || ''
}

export default function Members({ groupId, ownerId, readOnly = false }) {
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [userQuery, setUserQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const addForm = useForm({
    defaultValues: { user_id: '', role: 'member' }
  })
  
  const roleForm = useForm({
    defaultValues: { role: 'member' }
  })

  const {
    data: usersData,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
  } = useGroupUserSearch(
    groupId,
    { q: userQuery || undefined, limit: 50 },
    { enabled: isAddOpen && Boolean(groupId) }
  )

  const userOptions = useMemo(() => {
    return usersData?.users ?? []
  }, [usersData])

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGroupMembers(groupId, { 
    params: { per_page: 1000 }, 
    enabled: Boolean(groupId) 
  })

  const members = useMemo(() => extractMembers(data), [data])

  const addMemberMutation = useAddGroupMember(groupId, {
    onSuccess: () => {
      addForm.reset()
      setIsAddOpen(false)
      setUserQuery('')
      setSearchInput('')
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

  const handleSubmitAddMember = (values) => {
    if (!groupId || !values.user_id) return
    addMemberMutation.mutate(values)
  }

  const handleSubmitUpdateRole = (values) => {
    if (!selectedMember || !groupId) return
    const userId = getMemberId(selectedMember)
    updateRoleMutation.mutate({ userId, payload: { role: values.role } })
  }

  const handleConfirmRemove = () => {
    if (!selectedMember || !groupId) return
    const userId = getMemberId(selectedMember)
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

  const roleOptions = useMemo(() => [
    { label: 'Member', value: 'member' },
    { label: 'Manager', value: 'manager' },
  ], [])

  const renderRoleBadge = (role) => {
    const roleClasses = {
      owner: 'bg-green-100 text-green-700',
      manager: 'bg-blue-100 text-blue-700',
      member: 'bg-gray-100 text-gray-700',
    }
    return (
      <span className={cn(
        'text-xs px-2 py-0.5 rounded-full font-medium',
        roleClasses[role] || roleClasses.member
      )}>
        {role}
      </span>
    )
  }

  const renderUserOption = (user) => {
    const displayName = user.profile?.full_name || user.username
    const email = user.email
    return (
      <div className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer rounded-md">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{displayName}</div>
          {email && (
            <div className="text-xs text-muted-foreground truncate">{email}</div>
          )}
          <div className="text-xs text-gray-400">@{user.username}</div>
        </div>
      </div>
    )
  }

  const selectedUser = useMemo(() => {
    const userId = addForm.watch('user_id')
    if (!userId || !usersData?.users) return null
    return usersData.users.find(u => String(u.id) === String(userId))
  }, [addForm.watch('user_id'), usersData])

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
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
            {!readOnly && (
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
                
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Tambah Anggota</DialogTitle>
                    <DialogDescription>
                      Cari dan pilih pengguna untuk ditambahkan ke grup.
                    </DialogDescription>
                  </DialogHeader>

                  <form 
                    className="space-y-6" 
                    onSubmit={addForm.handleSubmit(handleSubmitAddMember)}
                  >
                  {/* User Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Pilih Pengguna</label>
                    
                    {/* Selected User Preview */}
                    {selectedUser && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-blue-600 mb-2">Pengguna dipilih:</div>
                        {renderUserOption(selectedUser)}
                      </div>
                    )}

                    {/* Dropdown Trigger */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={cn(
                          "w-full min-h-10.5 px-3 py-2 text-left border rounded-md",
                          "flex items-center justify-between",
                          "hover:bg-gray-50 transition-colors",
                          isDropdownOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-input"
                        )}
                      >
                        <span className={cn(
                          "text-sm",
                          !selectedUser && "text-muted-foreground"
                        )}>
                          {selectedUser 
                            ? selectedUser.profile?.full_name || selectedUser.username
                            : "Cari dan pilih pengguna..."
                          }
                        </span>
                        <Search className="w-4 h-4 text-muted-foreground" />
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsDropdownOpen(false)}
                          />
                          <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg">
                            {/* Search Input */}
                            <div className="p-2 border-b">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  placeholder="Cari nama atau email..."
                                  value={searchInput}
                                  onChange={(e) => {
                                    setSearchInput(e.target.value)
                                    setUserQuery(e.target.value)
                                  }}
                                  className="pl-9 pr-8"
                                  autoFocus
                                />
                                {searchInput && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSearchInput('')
                                      setUserQuery('')
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                  >
                                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* User List */}
                            <div className="max-h-80 overflow-y-auto p-2">
                              {isUsersLoading ? (
                                <div className="py-8 text-center text-muted-foreground">
                                  <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                                  <p className="text-sm">Memuat pengguna...</p>
                                </div>
                              ) : isUsersError ? (
                                <div className="py-8 text-center">
                                  <p className="text-sm text-red-600 mb-2">
                                    Gagal memuat data
                                  </p>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => refetchUsers()}
                                  >
                                    Coba Lagi
                                  </Button>
                                </div>
                              ) : userOptions.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground">
                                  <p className="text-sm">
                                    {searchInput 
                                      ? `Tidak ditemukan "${searchInput}"`
                                      : "Tidak ada pengguna"
                                    }
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  {userOptions.map((user) => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => {
                                        addForm.setValue('user_id', String(user.id))
                                        setIsDropdownOpen(false)
                                        setSearchInput('')
                                        setUserQuery('')
                                      }}
                                      className={cn(
                                        "w-full text-left rounded-md transition-colors",
                                        String(addForm.watch('user_id')) === String(user.id) 
                                          ? "bg-blue-50" 
                                          : "hover:bg-gray-50"
                                      )}
                                    >
                                      {renderUserOption(user)}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {isUsersError && (
                      <p className="text-xs text-red-600 mt-1">
                        {usersError?.message || 'Gagal memuat daftar pengguna'}
                      </p>
                    )}
                  </div>
                  
                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Peran</label>
                    <Select 
                      value={addForm.watch('role')} 
                      onValueChange={(value) => addForm.setValue('role', value)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Pilih peran" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-2">
                              <span>{role.label}</span>
                              <span className="text-xs text-muted-foreground">
                                ({role.value})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                    <DialogFooter className="gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsAddOpen(false)
                          setSearchInput('')
                          setUserQuery('')
                          addForm.reset()
                        }}
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!addForm.watch('user_id') || addMemberMutation.isPending}
                      >
                        {addMemberMutation.isPending ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                            Menambahkan...
                          </>
                        ) : 'Tambah Anggota'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              Memuat anggota...
            </div>
          ) : isError ? (
            <div className="text-sm text-red-600 text-center py-8">
              <p className="mb-2">Gagal memuat anggota</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Coba Lagi
              </Button>
            </div>
          ) : members.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
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
                    className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(userName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {userName}
                          </span>
                          {isOwner && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                          {!isOwner && renderRoleBadge(member.role)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          {userEmail}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {!isOwner && !readOnly && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRoleDialog(member)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            Ubah Peran
                          </Button>
                          
                          <button
                            onClick={() => handleOpenDeleteDialog(member)}
                            className="p-2 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            aria-label={`Hapus ${userName}`}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Anggota</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggota ini dari grup?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Avatar>
                <AvatarFallback>
                  {getInitials(selectedMember?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedMember?.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  Aksi ini tidak dapat dibatalkan
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmRemove}
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Menghapus...
                </>
              ) : 'Hapus Anggota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Role Dialog */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Peran</DialogTitle>
            <DialogDescription>
              Pilih peran baru untuk anggota ini.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
              <Avatar>
                <AvatarFallback>
                  {getInitials(selectedMember?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedMember?.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  Peran saat ini: {selectedMember?.role}
                </p>
              </div>
            </div>
            
            <form onSubmit={roleForm.handleSubmit(handleSubmitUpdateRole)}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Peran Baru</label>
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
                        <div className="flex items-center gap-2">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">
                            ({role.value})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter className="mt-6 gap-2">
                <Button type="button" variant="outline" onClick={() => setIsRoleOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateRoleMutation.isPending}>
                  {updateRoleMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Menyimpan...
                    </>
                  ) : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}