import React, { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAdminClauses, useCreateClause, useDeleteClause } from '@/hooks/useAdminClause'
import { getUserData, isProductOwnerUser } from '@/utils/auth'

export default function Clauses() {
  const [search, setSearch] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const params = useMemo(() => ({
    search: search.trim() || undefined,
    per_page: 50,
  }), [search])

  const { data, isLoading, isError, error, refetch } = useAdminClauses(params)
  const clauses = data?.clauses ?? []

  const createMutation = useCreateClause({
    onSuccess: () => {
      setCode('')
      setName('')
      setDescription('')
      setIsActive(true)
    },
  })

  const deleteMutation = useDeleteClause()
  const isProductOwner = isProductOwnerUser(getUserData())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isProductOwner) return
    if (!code.trim() || !name.trim()) return
    createMutation.mutate({
      code: code.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      is_active: isActive,
    })
  }

  const errorMessage = error?.response?.data?.message || error?.message
  const createError = createMutation.error?.response?.data?.message || createMutation.error?.message

  return (
    <div className={`grid min-w-0 gap-6 ${isProductOwner ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)]'}`}>
      {!isProductOwner && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold mb-4">Tambah Klausul</h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label>Kode</Label>
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: A.5.33" />
              </div>
              <div>
                <Label>Nama</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Judul klausul" />
              </div>
              <div>
                <Label>Deskripsi (opsional)</Label>
                <textarea
                  rows={3}
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Aktif</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              {createError && <p className="text-xs text-rose-600">{createError}</p>}
              <Button type="submit" disabled={createMutation.isPending} className="w-full">
                {createMutation.isPending ? 'Menyimpan...' : 'Simpan Klausul'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Daftar Klausul</h3>
              <p className="text-xs text-muted-foreground">Hanya admin yang bisa mengelola klausul.</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Input
                placeholder="Cari klausul..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Button variant="outline" size="sm" onClick={() => refetch()} className="w-full sm:w-auto">
                Refresh
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full" />
              ))}
            </div>
          )}

          {isError && (
            <div className="text-sm text-rose-600">
              {errorMessage || 'Gagal memuat klausa.'}
            </div>
          )}

          {!isLoading && !isError && clauses.length === 0 && (
            <div className="text-sm text-muted-foreground">Belum ada klausul.</div>
          )}

          {!isLoading && !isError && clauses.length > 0 && (
            <div className="space-y-3">
              {clauses.map((clause) => (
                <div key={clause.id} className="border rounded-md p-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{clause.code} - {clause.name}</div>
                    {clause.description && (
                      <div className="text-xs text-muted-foreground mt-1">{clause.description}</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {clause.is_active ? 'Aktif' : 'Nonaktif'}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isProductOwner || deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(clause.id)}
                    className="self-end text-rose-600 sm:self-auto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
