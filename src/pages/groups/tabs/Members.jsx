import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { members } from '@/pages/groups/mocks/data'
import { Button } from '@/components/ui/button'
import { Plus, Trash, Crown } from 'lucide-react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function Members() {
  const [list, setList] = useState(members)
  const [openDelete, setOpenDelete] = useState(false)
  const [selected, setSelected] = useState(null)
  const [openAdd, setOpenAdd] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])

  // Mock of all users in the system — in real app this comes from API
  const allUsers = [
    { name: 'Budi Santoso', email: 'budi.santoso@university.ac.id', unit: 'Teknik Informatika' },
    { name: 'Siti Rahayu', email: 'siti.rahayu@university.ac.id', unit: 'Teknik Elektro' },
    { name: 'Ahmad Fauzi', email: 'ahmad.fauzi@university.ac.id', unit: 'Teknik Informatika' },
    { name: 'Rina Wijaya', email: 'rina.wijaya@university.ac.id', unit: 'Matematika' },
    { name: 'Administrator TIK', email: 'admin@university.ac.id', unit: 'IT Support' },
    { name: 'Dewi Sartika', email: 'dewi.sartika@university.ac.id', unit: 'Administrasi' },
    { name: 'Yoga Prasetyo', email: 'yoga.prasetyo@university.ac.id', unit: 'Teknik Sipil' },
  ]

  const availableToAdd = allUsers.filter((u) => !list.some((m) => m.email === u.email))

  function confirmDelete(member) {
    setSelected(member)
    setOpenDelete(true)
  }

  function handleConfirmDelete() {
    if (!selected) return
    setList((s) => s.filter((x) => x.email !== selected.email))
    setSelected(null)
    setOpenDelete(false)
  }

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Anggota ({list.length})</CardTitle>
          <div>
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 text-white flex items-center gap-2">
                  <Plus /> Tambah Anggota
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Anggota</DialogTitle>
                  <DialogDescription>Pilih satu atau lebih pengguna untuk ditambahkan ke grup.</DialogDescription>
                </DialogHeader>

                <div className="mt-4 max-h-64 overflow-y-auto">
                  {availableToAdd.length === 0 ? (
                    <div className="text-small text-muted-foreground">Tidak ada pengguna yang tersedia untuk ditambahkan.</div>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {availableToAdd.map((u) => (
                        <li
                          key={u.email}
                          className="flex items-center justify-between p-2 rounded hover:bg-slate-50 cursor-pointer"
                          onClick={(e) => {
                            // if the click originated from the actual checkbox input, ignore here
                            if (e.target && e.target.closest && e.target.closest('input[type="checkbox"]')) return
                            const exists = selectedUsers.includes(u.email)
                            if (exists) setSelectedUsers((s) => s.filter((e) => e !== u.email))
                            else setSelectedUsers((s) => [...s, u.email])
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback>{u.name.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{u.name}</div>
                              <div className="text-small text-muted-foreground">{u.email} • {u.unit}</div>
                            </div>
                          </div>
                          <div onClick={(ev) => ev.stopPropagation()}>
                            <label className="inline-flex items-center">
                              <Checkbox
                                checked={selectedUsers.includes(u.email)}
                                onCheckedChange={(val) => {
                                  if (val) setSelectedUsers((s) => [...s, u.email])
                                  else setSelectedUsers((s) => s.filter((e) => e !== u.email))
                                }}
                              />
                            </label>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <DialogClose asChild>
                    <Button variant="outline">Batal</Button>
                  </DialogClose>
                  <Button
                    onClick={() => {
                      if (selectedUsers.length === 0) return setOpenAdd(false)
                      const toAdd = allUsers.filter((u) => selectedUsers.includes(u.email)).map((u) => ({ ...u, role: 'participant' }))
                      setList((s) => [...toAdd, ...s])
                      setSelectedUsers([])
                      setOpenAdd(false)
                    }}
                  >
                    Tambah
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-3">
            {list.map((m) => (
              <li key={m.email} className="flex items-center justify-between p-3 bg-white rounded-md border">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>{m.name.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-body-md font-medium">{m.name}</div>
                      {m.role === 'owner' && (
                        <span className="text-yellow-600" title="Pemilik">
                          <Crown className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div className="text-small text-muted-foreground">{m.email}</div>
                    <div className="text-small text-muted-foreground">{m.unit}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.role === 'owner'
                        ? 'bg-green-light text-green-dark'
                        : m.role === 'responsible'
                        ? 'bg-blue-light text-blue-dark'
                        : m.role === 'reviewer'
                        ? 'bg-yellow-light text-yellow-dark'
                        : m.role === 'participant'
                        ? 'bg-gray-light text-gray-dark'
                        : 'bg-navy text-white'
                    }`}>{m.role}</span>
                    <button className="text-xs text-blue mt-2">Ubah Peran</button>
                  </div>
                  <button onClick={() => confirmDelete(m)} className="text-red p-1 rounded" aria-label={`Hapus ${m.name}`}>
                    <Trash className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus anggota</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus anggota ini dari grup? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 text-sm">{selected ? selected.name : ''}</div>
          <div className="mt-6 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Batalkan</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>Hapus</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
