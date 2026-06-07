import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { User, ChevronsUpDown, Loader2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Komponen MultiSelect untuk memilih peserta (mirip dengan MultiSelect klausul)
function ParticipantMultiSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Pilih peserta...',
  loading = false,
  getOptionLabel 
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  
  const selected = new Set(value)

  const toggle = (val) => {
    if (selected.has(val)) {
      onChange(value.filter((item) => item !== val))
    } else {
      onChange([...value, val])
    }
  }

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) => 
      getOptionLabel(option).toLowerCase().includes(normalized)
    )
  }, [options, query, getOptionLabel])

  // Get selected users display names
  const selectedUsers = useMemo(() => {
    return options.filter(opt => value.includes(String(opt.value)))
  }, [options, value])

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between h-10"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="truncate flex items-center gap-2 flex-1">
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1 truncate">
              {selectedUsers.slice(0, 2).map((user) => (
                <Badge key={user.value} variant="secondary" className="text-xs">
                  {user.label}
                </Badge>
              ))}
              {selectedUsers.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{selectedUsers.length - 2}
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Pilih Peserta</DialogTitle>
            <DialogDescription>
              Cari dan pilih peserta yang akan diundang ke forum ini.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-4">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama atau email..."
              className="w-full"
            />
          </div>

          <div className="max-h-[60vh] overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                Tidak ada peserta tersedia
              </div>
            ) : (
              <div className="space-y-2">
                {filteredOptions.map((option) => {
                  const isSelected = selected.has(String(option.value))
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-md text-sm border cursor-pointer hover:bg-accent",
                        isSelected && "bg-accent"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(String(option.value))}
                        className="mt-0.5 h-4 w-4 rounded border-gray-300"
                      />
                      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium truncate">{option.label}</span>
                        {option.email && (
                          <span className="text-xs text-muted-foreground truncate">
                            {option.email}
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <DialogFooter className="px-6 pb-6">
            <div className="flex flex-wrap gap-2 justify-between w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange([])
                  setOpen(false)
                }}
              >
                Hapus semua
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Selesai
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Komponen utama InviteParticipantDialog
export default function InviteParticipantDialog({
  open,
  onOpenChange,
  candidates,
  onInvite,
  isPending,
  roomName,
}) {
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [role, setRole] = useState('auditee')

  // Reset selection when dialog opens/closes
  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      setSelectedUserIds([])
      setRole('auditee')
    }
    onOpenChange(newOpen)
  }

  const options = useMemo(() => {
    return candidates.map((member) => ({
      value: String(member.user_id),
      label: member?.user?.name || member?.user?.profile?.full_name || member?.user?.username || 'Pengguna',
      email: member?.user?.email,
    }))
  }, [candidates])

  const getOptionLabel = (option) => option.label

  const handleSubmit = () => {
    if (selectedUserIds.length === 0 || isPending) return
    onInvite(selectedUserIds, role)
    setSelectedUserIds([])
    setRole('auditee')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={candidates.length === 0}>
          Undang Peserta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Undang Peserta Forum</DialogTitle>
          <DialogDescription>
            {roomName ? `Undang anggota periode ke forum "${roomName}"` : 'Pilih peserta yang akan diundang ke forum ini.'}
            <br />
            <span className="text-xs text-muted-foreground">
              Peserta yang diundang harus sudah menjadi anggota periode yang sama.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pilih Peserta</Label>
            <ParticipantMultiSelect
              options={options}
              value={selectedUserIds}
              onChange={setSelectedUserIds}
              placeholder={candidates.length ? 'Cari dan pilih peserta...' : 'Tidak ada kandidat'}
              loading={false}
              getOptionLabel={getOptionLabel}
            />
            {candidates.length === 0 && (
              <p className="text-xs text-amber-600">
                Tidak ada anggota periode yang belum diundang.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auditor">Auditor</SelectItem>
                <SelectItem value="auditee">Auditee</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Auditor: bertugas melakukan audit dan review. <br />
              Auditee: bertugas menyediakan data dan dokumen yang diperlukan.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Batal
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedUserIds.length === 0 || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengundang...
              </>
            ) : (
              `Undang (${selectedUserIds.length})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}