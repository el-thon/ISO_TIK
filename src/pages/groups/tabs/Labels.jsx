import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Plus, Trash, Edit, Loader2 } from 'lucide-react'
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '@/services/labelHooks'

export default function Labels({ groupId }) {
  const { data, isLoading, isFetching, isError, error, refetch } = useLabels({ scope: 'group', group_id: groupId })
  const labels = useMemo(() => data?.labels ?? [], [data])

  const createLabel = useCreateLabel({
    onSuccess: () => {
      setOpenCreate(false)
      setName('')
      setColor('blue')
      refetch()
    },
  })
  const updateLabel = useUpdateLabel({
    onSuccess: () => {
      setOpenEdit(false)
      setSelected(null)
      setName('')
      setColor('blue')
      refetch()
    },
  })
  const deleteLabel = useDeleteLabel({
    onSuccess: () => {
      setOpenDelete(false)
      setSelected(null)
      refetch()
    },
  })

  const [openCreate, setOpenCreate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [selected, setSelected] = useState(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState('blue')
  const colorLabels = {
    red: 'Merah',
    yellow: 'Kuning',
    green: 'Hijau',
    blue: 'Biru',
    purple: 'Ungu',
  }

  function handleCreate(e) {
    e?.preventDefault()
    if (!name.trim()) return
    createLabel.mutate({ name: name.trim(), color, scope: 'group', group_id: groupId })
  }

  function handleDelete(id) {
    deleteLabel.mutate(id)
  }

  function openEditDialog(label) {
    setSelected(label)
    setName(label.name)
    setColor(label.color)
    setOpenEdit(true)
  }

  function handleUpdate(e) {
    e?.preventDefault()
    if (!selected) return
    updateLabel.mutate({
      labelId: selected.id,
      payload: { name: name.trim(), color, scope: 'group', group_id: groupId },
    })
  }

  function confirmDelete(id) {
    setSelected(labels.find((l) => l.id === id) || null)
    setOpenDelete(true)
  }

  function handleConfirmDelete() {
    if (!selected) return
    handleDelete(selected.id)
    setSelected(null)
  }

  // Keep selected label values in sync when opening dialogs
  useEffect(() => {
    if (selected && openEdit) {
      setName(selected.name)
      setColor(selected.color || 'blue')
    }
  }, [selected, openEdit])

  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Label Grup</CardTitle>
          <div>
            <Dialog open={openCreate} onOpenChange={setOpenCreate}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 text-white" disabled={isLoading || isFetching}>
                  <Plus />
                  Buat Label
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Buat label</DialogTitle>
                  <DialogDescription>Tambahkan label baru untuk grup ini.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="grid gap-3">
                  <label className="text-small">Nama</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama label" />

                  <label className="text-small">Warna</label>
                  <Select value={color} onValueChange={(v) => setColor(v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue>{colorLabels[color] || color}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">Merah</SelectItem>
                      <SelectItem value="yellow">Kuning</SelectItem>
                      <SelectItem value="green">Hijau</SelectItem>
                      <SelectItem value="blue">Biru</SelectItem>
                      <SelectItem value="purple">Ungu</SelectItem>
                    </SelectContent>
                  </Select>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Batal</Button>
                    </DialogClose>
                    <Button type="submit" disabled={createLabel.isPending}>
                      {createLabel.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Buat'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading || isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat label...
            </div>
          ) : isError ? (
            <div className="text-red-600 py-2">Gagal memuat label: {error?.message || 'Terjadi kesalahan'}</div>
          ) : labels.length === 0 ? (
            <div className="text-muted-foreground py-4">Belum ada label untuk grup ini.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {labels.map((l) => (
                <div key={l.id} className="p-4 border rounded-md bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            l.color === 'red'
                              ? 'bg-red'
                              : l.color === 'green'
                              ? 'bg-green'
                              : l.color === 'yellow'
                              ? 'bg-yellow'
                              : l.color === 'purple'
                              ? 'bg-purple'
                              : 'bg-blue'
                          }`}
                        />
                        <div className="font-medium">{l.name}</div>
                      </div>
                      <div className="mt-3">
                        <span className="text-xs bg-blue-light text-blue rounded-full px-3 py-1">{l.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <button onClick={() => openEditDialog(l)} className="text-sm text-muted-foreground flex items-center gap-2">
                        <Edit className="size-4" /> Ubah
                      </button>
                      <button onClick={() => confirmDelete(l.id)} className="text-sm text-red flex items-center gap-2">
                        <Trash className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah label</DialogTitle>
            <DialogDescription>Perbarui nama atau warna label.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="grid gap-3">
            <label className="text-small">Nama</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama label" />

            <label className="text-small">Warna</label>
            <Select value={color} onValueChange={(v) => setColor(v)}>
              <SelectTrigger className="w-48">
                <SelectValue>{colorLabels[color] || color}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="red">Merah</SelectItem>
                <SelectItem value="yellow">Kuning</SelectItem>
                <SelectItem value="green">Hijau</SelectItem>
                <SelectItem value="blue">Biru</SelectItem>
                <SelectItem value="purple">Ungu</SelectItem>
              </SelectContent>
            </Select>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Batal</Button>
              </DialogClose>
              <Button type="submit" disabled={updateLabel.isPending}>
                {updateLabel.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDelete} onOpenChange={setOpenDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus label</DialogTitle>
            <DialogDescription>Apakah Anda yakin ingin menghapus label ini? Tindakan ini tidak dapat dibatalkan.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Batalkan</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteLabel.isPending}>
              {deleteLabel.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Hapus'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
