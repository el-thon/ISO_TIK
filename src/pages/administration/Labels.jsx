import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Tag, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCreateLabel, useDeleteLabel, useLabels, useUpdateLabel } from '@/services/labelHooks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

// Color palette with better contrast
const PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#10b981', // Green
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#14b8a6', // Teal
]

const SCOPE_OPTIONS = [
  { value: 'global', label: 'Global (seluruh sistem)', description: 'Dapat digunakan di semua grup dan ruangan' },
  { value: 'group', label: 'Grup', description: 'Hanya tersedia dalam grup tertentu' },
  { value: 'room', label: 'Ruangan', description: 'Hanya tersedia dalam ruangan tertentu' },
]

const LABELS_BASE_QUERY_KEY = ['labels', JSON.stringify({})]
const getScopeLabel = (value) => SCOPE_OPTIONS.find((opt) => opt.value === value)?.label?.split(' (')[0] || 'Global'
const resolveLabelName = (data, fallback) => data?.label?.name || data?.name || fallback || 'Label'

const toKey = (value) => (value === null || value === undefined ? null : String(value))

const ensureCacheShape = (value) => {
  if (value && typeof value === 'object') {
    return {
      ...value,
      labels: Array.isArray(value.labels) ? value.labels : [],
    }
  }
  return { labels: [] }
}

const mergeLabelRecord = (data, fallback = {}) => {
  if (!data && !fallback) return null
  const raw = data?.label ?? data ?? {}
  const merged = {
    ...fallback,
    ...raw,
  }
  const id = raw.id ?? fallback.id
  if (id === null || id === undefined) return null
  return {
    ...merged,
    id,
    name: merged.name ?? 'Label',
    scope: merged.scope ?? 'global',
    color: merged.color ?? PALETTE[4],
  }
}

const DEFAULT_FORM = Object.freeze({
  name: '',
  scope: 'global',
  color: PALETTE[4],
})

const isValidHexColor = (value) => {
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  return /^#([0-9a-fA-F]{3}){1,2}$/.test(trimmed)
}

const normalizeColor = (value) => (typeof value === 'string' ? value.trim() : '')

export default function Labels() {
  const { data, isLoading, isFetching, isError, error, refetch } = useLabels()
  const labels = useMemo(() => data?.labels ?? [], [data])
  const labelsSupported = data?.meta?.supported ?? true
  const labelsSupportMessage = 'Fitur label belum tersedia pada backend ini. Hubungi tim backend untuk mengaktifkannya.'
  const queryClient = useQueryClient()

  const updateLabelsCache = useCallback(
    (transformer) => {
      queryClient.setQueryData(LABELS_BASE_QUERY_KEY, (prev) => {
        const base = ensureCacheShape(prev)
        const nextLabels = transformer(base.labels) ?? base.labels
        return { ...base, labels: nextLabels }
      })
    },
    [queryClient]
  )

  const upsertLabelCache = useCallback(
    (label) => {
      if (!label) return
      const labelKey = toKey(label.id)
      if (!labelKey) return
      updateLabelsCache((prev) => {
        const filtered = prev.filter((item) => toKey(item.id) !== labelKey)
        return [label, ...filtered]
      })
    },
    [updateLabelsCache]
  )

  const removeLabelCache = useCallback(
    (labelId) => {
      const labelKey = toKey(labelId)
      if (!labelKey) return
      updateLabelsCache((prev) => prev.filter((item) => toKey(item.id) !== labelKey))
    },
    [updateLabelsCache]
  )

  // State
  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [openDelete, setOpenDelete] = useState(false)
  const [toDelete, setToDelete] = useState(null)
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }))
  const [formErrors, setFormErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Reset all states when labels support is disabled
  useEffect(() => {
    if (!labelsSupported) {
      setOpenCreate(false)
      setOpenDelete(false)
      setEditing(null)
      setToDelete(null)
    }
  }, [labelsSupported])

  // Mutation hooks with callbacks
  const createLabel = useCreateLabel({
    onSuccess: (data, variables) => {
      const labelName = resolveLabelName(data, variables?.name)
      const fallbackRecord = variables ? { ...variables } : {}
      const mergedRecord = mergeLabelRecord(data, fallbackRecord)
      if (mergedRecord) upsertLabelCache(mergedRecord)
      setOpenCreate(false)
      resetForm()
      setSuccessMessage(`Label "${labelName}" berhasil ditambahkan!`)
      refetch()
    },
    onError: () => {
      // ignore create error
    },
  })

  const updateLabel = useUpdateLabel({
    onSuccess: (data, variables) => {
      const fallbackName = variables?.payload?.name
      const labelName = resolveLabelName(data, fallbackName)
      const fallbackRecord = {
        id: variables?.labelId,
        ...(variables?.payload ?? {}),
      }
      const mergedRecord = mergeLabelRecord(data, fallbackRecord)
      if (mergedRecord) upsertLabelCache(mergedRecord)
      setOpenCreate(false)
      resetForm()
      setSuccessMessage(`Label "${labelName}" berhasil diperbarui!`)
      refetch()
    },
    onError: () => {
      // ignore update error
    },
  })

  const deleteLabel = useDeleteLabel({
    onSuccess: () => {
      const deletedName = toDelete?.name || `ID ${toDelete?.id}`
      if (toDelete?.id) removeLabelCache(toDelete.id)
      setOpenDelete(false)
      setToDelete(null)
      setSuccessMessage(`Label "${deletedName}" berhasil dihapus!`)
      refetch()
    },
    onError: () => {
      // ignore delete error
    },
  })

  // Form handling
  const resetForm = () => {
  setForm({ ...DEFAULT_FORM })
    setEditing(null)
    setFormErrors({})
  }

  const handleOpenCreate = (open) => {
    if (!open) {
      resetForm()
      createLabel.reset()
      updateLabel.reset()
    }
    setOpenCreate(open)
  }

  const openCreateModal = () => {
    if (!labelsSupported) return
    resetForm()
    setOpenCreate(true)
  }

  const openEditModal = (label) => {
    setForm({
      name: label.name || '',
      scope: label.scope || 'global',
  color: label.color || PALETTE[4],
    })
    setEditing(label)
    setFormErrors({})
    setOpenCreate(true)
  }

  const validateForm = () => {
    const errors = {}
    
    if (!form.name.trim()) {
      errors.name = 'Nama label wajib diisi'
    } else if (form.name.trim().length < 2) {
      errors.name = 'Nama label minimal 2 karakter'
    } else if (form.name.trim().length > 50) {
      errors.name = 'Nama label maksimal 50 karakter'
    }

    const chosenColor = normalizeColor(form.color)
    if (!chosenColor) {
      errors.color = 'Warna label wajib diisi'
    } else if (!PALETTE.includes(chosenColor) && !isValidHexColor(chosenColor)) {
      errors.color = 'Gunakan warna palet atau kode hex yang valid (contoh: #3b82f6)'
    }

    return errors
  }

  const handleSave = () => {
    const errors = validateForm()
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setFormErrors({})
    
    const payload = {
      name: form.name.trim(),
      scope: form.scope,
      color: normalizeColor(form.color) || PALETTE[4],
    }

    if (editing?.id) {
      updateLabel.mutate({ labelId: editing.id, payload })
    } else {
      createLabel.mutate(payload)
    }
  }

  const confirmDelete = (label) => {
    setToDelete(label)
    setOpenDelete(true)
  }

  const handleDelete = () => {
    if (!toDelete?.id) return
    deleteLabel.mutate(toDelete.id)
  }

  const handleOpenDelete = (open) => {
    if (!open) {
      setToDelete(null)
      deleteLabel.reset()
    }
    setOpenDelete(open)
  }

  // Get error messages
  const getMutationError = () => {
    const error = createLabel.error || updateLabel.error || deleteLabel.error
    return error?.response?.data?.message || error?.message || ''
  }

  const mutationError = getMutationError()

  return (
    <div className="max-w-full mx-auto px-6 py-6">
      <div className="mb-6">
        <h1 className="text-heading-2 font-semibold flex items-center gap-2">
          <Tag className="w-6 h-6" />
          Label Sistem
        </h1>
        <p className="text-body-md text-muted-foreground">
          Kelola label untuk mengkategorikan dan mengorganisir konten
        </p>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {isError && (
        <Alert className="mb-4 border-red-200 bg-red-50 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error?.response?.data?.message || error?.message || 'Gagal memuat label.'}
            <Button 
              type="button"
              size="sm" 
              variant="outline" 
              className="ml-3"
              onClick={() => refetch()}
            >
              Muat ulang
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Daftar Label</CardTitle>
            <CardDescription>
              {!labelsSupported 
                ? labelsSupportMessage 
                : isLoading 
                  ? 'Memuat...' 
                  : `${labels.length} label tersedia`
              }
            </CardDescription>
          </div>
          {isFetching && !isLoading && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Menyegarkan data
            </span>
          )}
          <Button 
            type="button"
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={openCreateModal} 
            disabled={!labelsSupported || isLoading}
          >
            <Tag className="w-4 h-4" />
            Tambah Label
          </Button>
        </CardHeader>
        
        <CardContent>
          {!labelsSupported ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
              <AlertCircle className="w-6 h-6 mx-auto mb-2" />
              {labelsSupportMessage}
            </div>
          ) : isLoading ? (
            <LabelsSkeleton />
          ) : labels.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
              <Tag className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm text-muted-foreground mb-3">Belum ada label yang terdaftar</p>
              <Button 
                type="button"
                variant="outline" 
                size="sm"
                onClick={openCreateModal}
              >
                Buat Label Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {labels.map((label) => (
                <Card key={label.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-6 h-6 rounded-md border shadow-sm"
                          style={{ backgroundColor: label.color }}
                        />
                        <div>
                          <h3 className="font-semibold text-sm">{label.name}</h3>
                          <Badge variant="outline" className="text-xs mt-1">
                            {getScopeLabel(label.scope)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditModal(label)}
                          title="Edit label"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => confirmDelete(label)}
                          title="Hapus label"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className="text-xs font-normal px-2 py-1"
                          style={{
                            backgroundColor: `${label.color}15`,
                            color: label.color,
                            borderColor: `${label.color}30`
                          }}
                        >
                          {label.name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ID: {label.id}
                        </span>
                      </div>
                      {label.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {label.description}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {labelsSupported && (
        <Dialog open={openCreate} onOpenChange={handleOpenCreate}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editing ? <Edit className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                {editing ? 'Edit Label' : 'Tambah Label Baru'}
              </DialogTitle>
              <DialogDescription>
                {editing 
                  ? 'Perbarui informasi label' 
                  : 'Buat label baru untuk mengkategorikan konten'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="label-name">Nama Label *</Label>
                <Input
                  id="label-name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Contoh: Bug, Feature, Urgent"
                  className={formErrors.name ? 'border-red-300' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-600">{formErrors.name}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Nama yang deskriptif untuk label
                </p>
              </div>

              {/* Scope Field */}
              <div className="space-y-2">
                <Label htmlFor="label-scope">Scope</Label>
                <Select 
                  value={form.scope} 
                  onValueChange={(value) => setForm(prev => ({ ...prev, scope: value }))}
                >
                  <SelectTrigger id="label-scope">
                    <SelectValue placeholder="Pilih scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <div className="font-medium">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Field */}
              <div className="space-y-2">
                <Label>Warna Label</Label>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {PALETTE.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, color }))}
                      className={`h-8 w-8 rounded-md border-2 transition-all ${
                        form.color === color 
                          ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Pilih warna ${color}`}
                      title={`Warna: ${color}`}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-color">Kode Warna Kustom</Label>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-md border"
                      style={{ backgroundColor: form.color }}
                    />
                    <Input
                      id="custom-color"
                      value={form.color}
                      onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                  {formErrors.color && (
                    <p className="text-xs text-red-600">{formErrors.color}</p>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div className="pt-4 border-t">
                <Label>Preview</Label>
                <div className="mt-2 flex items-center gap-3">
                  <Badge 
                    className="px-3 py-1.5"
                    style={{
                      backgroundColor: `${form.color}15`,
                      color: form.color,
                      borderColor: `${form.color}30`
                    }}
                  >
                    {form.name || 'Label Preview'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Scope: <span className="font-medium">{getScopeLabel(form.scope)}</span>
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {mutationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{mutationError}</AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Batal</Button>
              </DialogClose>
              <Button 
                type="button"
                onClick={handleSave} 
                disabled={createLabel.isPending || updateLabel.isPending}
                className="gap-2"
              >
                {(createLabel.isPending || updateLabel.isPending) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {editing ? 'Simpan Perubahan' : 'Tambah Label'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {labelsSupported && toDelete && (
        <Dialog open={openDelete} onOpenChange={handleOpenDelete}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Hapus Label
              </DialogTitle>
              <DialogDescription>
                Aksi ini tidak dapat dibatalkan. Label akan dihapus secara permanen.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  Konfirmasi Penghapusan
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-6 h-6 rounded-md"
                    style={{ backgroundColor: toDelete.color }}
                  />
                  <div>
                    <p className="font-semibold">{toDelete.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ID: {toDelete.id} • Scope: {getScopeLabel(toDelete.scope)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-red-700">
                  {typeof toDelete.usage_count === 'number'
                    ? `Label ini sedang digunakan di ${toDelete.usage_count} konten. Menghapus label akan melepasnya dari semua konten tersebut.`
                    : 'Jumlah penggunaan label ini tidak tersedia. Menghapus label akan melepasnya dari seluruh konten yang terkait.'}
                </p>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={deleteLabel.isPending}>
                  Batal
                </Button>
              </DialogClose>
              <Button 
                type="button"
                variant="destructive" 
                onClick={handleDelete} 
                disabled={deleteLabel.isPending}
                className="gap-2"
              >
                {deleteLabel.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Ya, Hapus Label
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function LabelsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="overflow-hidden">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-6 rounded-md" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-6 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}