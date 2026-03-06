import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Plus, Trash, Edit, Loader2 } from 'lucide-react'
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '@/services/labelHooks'

const COLOR_OPTIONS = {
  red: 'Merah',
  yellow: 'Kuning',
  green: 'Hijau',
  blue: 'Biru',
  purple: 'Ungu',
}

const COLOR_CLASSES = {
  red: 'bg-red-100 text-red-700 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
}

const INITIAL_FORM = { name: '', color: 'blue' }

export default function Labels({ groupId }) {
  const { data, isLoading, isError, error, refetch } = useLabels({ scope: 'group', scope_id: groupId })
  
  const createLabel = useCreateLabel({ onSuccess: handleSuccess })
  const updateLabel = useUpdateLabel({ onSuccess: handleSuccess })
  const deleteLabel = useDeleteLabel({ onSuccess: handleSuccess })

  const [dialogs, setDialogs] = useState({
    create: false,
    edit: false,
    delete: false
  })
  const [selectedLabel, setSelectedLabel] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [validationError, setValidationError] = useState('')

  function handleSuccess() {
    refetch()
    closeAllDialogs()
    setValidationError('')
  }

  function closeAllDialogs() {
    setDialogs({ create: false, edit: false, delete: false })
    setSelectedLabel(null)
    setForm(INITIAL_FORM)
    setValidationError('')
  }

  function handleCreate(e) {
    e.preventDefault()
    setValidationError('')
    
    if (!form.name.trim()) {
      setValidationError('Nama label wajib diisi')
      return
    }

    if (!groupId) {
      setValidationError('ID grup tidak valid')
      return
    }

    createLabel.mutate({
      name: form.name.trim(),
      color: form.color,
      scope: 'group',
      scope_id: groupId
    })
  }

  function handleUpdate(e) {
    e.preventDefault()
    setValidationError('')
    
    if (!selectedLabel) return
    if (!form.name.trim()) {
      setValidationError('Nama label wajib diisi')
      return
    }

    updateLabel.mutate({
      labelId: selectedLabel.id,
      payload: {
        name: form.name.trim(),
        color: form.color,
        scope: 'group',
        scope_id: groupId
      }
    })
  }

  function handleDelete() {
    if (!selectedLabel) return
    deleteLabel.mutate(selectedLabel.id)
  }

  function openEditDialog(label) {
    setSelectedLabel(label)
    setForm({ name: label.name, color: label.color })
    setDialogs(prev => ({ ...prev, edit: true }))
    setValidationError('')
  }

  function openDeleteDialog(label) {
    setSelectedLabel(label)
    setDialogs(prev => ({ ...prev, delete: true }))
  }

  // Filter labels berdasarkan group
  const labels = data?.labels?.filter(label => {
    if (!groupId) return false
    if (label.scope !== 'group') return false
    return String(label.scope_id) === String(groupId)
  }) || []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memuat label...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            Gagal memuat label: {error?.message || 'Terjadi kesalahan'}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Label Grup</CardTitle>
          <Button 
            size="sm" 
            className="bg-blue-600 text-white"
            onClick={() => setDialogs(prev => ({ ...prev, create: true }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            Buat Label
          </Button>
        </CardHeader>
        
        <CardContent>
          {labels.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Belum ada label untuk grup ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {labels.map(label => (
                <div 
                  key={label.id} 
                  className={`p-4 border rounded-lg hover:shadow-sm transition-shadow ${COLOR_CLASSES[label.color] || 'bg-blue-100 text-blue-700'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full bg-${label.color}-500`} />
                        <span className="font-medium">{label.name}</span>
                      </div>
                      
                      <span className={`inline-block text-xs px-3 py-1 rounded-full border ${COLOR_CLASSES[label.color] || 'bg-blue-100 text-blue-700'}`}>
                        {label.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditDialog(label)}
                        className="p-2 text-muted-foreground hover:text-blue-600 transition-colors"
                        title="Ubah label"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(label)}
                        className="p-2 text-muted-foreground hover:text-red-600 transition-colors"
                        title="Hapus label"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={dialogs.create} onOpenChange={(open) => !open && closeAllDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buat Label Baru</DialogTitle>
            <DialogDescription>
              Tambahkan label untuk mengelompokkan item di grup ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Label</label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Bug, Feature, Dokumentasi"
                className={validationError ? 'border-red-500' : ''}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Warna</label>
              <Select 
                value={form.color} 
                onValueChange={(color) => setForm(prev => ({ ...prev, color }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${form.color}-500`} />
                      <span>{COLOR_OPTIONS[form.color]}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COLOR_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${value}-500`} />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Label */}
            {form.name && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${COLOR_CLASSES[form.color]}`}>
                    {form.name}
                  </span>
                </div>
              </div>
            )}

            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAllDialogs}>
                Batal
              </Button>
              <Button type="submit" disabled={createLabel.isPending}>
                {createLabel.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : 'Buat Label'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={dialogs.edit} onOpenChange={(open) => !open && closeAllDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ubah Label</DialogTitle>
            <DialogDescription>
              Perbarui informasi label sesuai kebutuhan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Label</label>
              <Input
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className={validationError ? 'border-red-500' : ''}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Warna</label>
              <Select 
                value={form.color} 
                onValueChange={(color) => setForm(prev => ({ ...prev, color }))}
              >
                <SelectTrigger>
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full bg-${form.color}-500`} />
                      <span>{COLOR_OPTIONS[form.color]}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COLOR_OPTIONS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${value}-500`} />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview Label */}
            {form.name && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preview</label>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${COLOR_CLASSES[form.color]}`}>
                    {form.name}
                  </span>
                </div>
              </div>
            )}

            {validationError && (
              <p className="text-sm text-red-600">{validationError}</p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAllDialogs}>
                Batal
              </Button>
              <Button type="submit" disabled={updateLabel.isPending}>
                {updateLabel.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : 'Simpan Perubahan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogs.delete} onOpenChange={(open) => !open && closeAllDialogs()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Label</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus label "{selectedLabel?.name}"?
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeAllDialogs}>
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteLabel.isPending}
            >
              {deleteLabel.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : 'Hapus Label'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}