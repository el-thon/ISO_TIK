import React, { useEffect, useState } from 'react'
import api from '@/services/api'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { getUserData, isProductOwnerUser } from '@/utils/auth'

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toISOString().slice(0,10) } catch(e) { return d }
}

function MastersList({ masters, onActivate, onEdit, onDelete, readOnly = false }) {
  if (!masters || masters.length === 0) {
    return <div className="text-sm text-muted-foreground">Belum ada master dibuat.</div>
  }

  return (
    <div className="grid gap-3">
      {masters.map((m, idx) => (
        <div
          key={m.id}
          className={`p-4 rounded-lg border bg-background shadow-sm animate-in fade-in-0 slide-in-from-bottom-2`}
          style={{ animationDelay: `${idx * 40}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="text-sm font-semibold truncate">{m.document_number || '—'}</div>
                {m.is_active && <div className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Aktif</div>}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Tanggal terbit: {formatDate(m.published_at)} · Revisi: {m.revision_number || '—'}</div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onActivate(m)} disabled={readOnly}>
                {m.is_active ? 'Nonaktifkan' : 'Aktifkan'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(m)} disabled={readOnly}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => onDelete(m)} disabled={readOnly}>Hapus</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TopicDocumentMasters() {
  const [masters, setMasters] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ document_number: '', published_at: '', revision_number: '', is_active: false, id: null })
  const queryClient = useQueryClient()
  const isProductOwner = isProductOwnerUser(getUserData())

  const fetchMasters = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/topic-document-masters')
      setMasters(res.data?.data || res.data || [])
    } catch (e) {
      console.error(e)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchMasters() }, [])

  const openCreate = () => { setForm({ document_number: '', published_at: '', revision_number: '', is_active: false, id: null }); setShowCreate(true) }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (isProductOwner) return
    try {
      let res
      if (form.id) {
        res = await api.put(`/admin/topic-document-masters/${form.id}`, form)
      } else {
        res = await api.post('/admin/topic-document-masters', form)
      }
      // invalidate active master so other components refresh immediately
      try { 
        queryClient.invalidateQueries({ queryKey: ['topicDocumentMaster', 'active'] }) 
        queryClient.invalidateQueries({ queryKey: ['adminTopicDocumentMasters'] })
      } catch (e) { /* ignore */ }
      setShowCreate(false)
      fetchMasters()
    } catch (err) { console.error(err) }
  }

  const onActivate = async (m) => {
    if (isProductOwner) return
    try {
      await api.put(`/admin/topic-document-masters/${m.id}`, { ...m, is_active: !m.is_active })
      try { 
        queryClient.invalidateQueries({ queryKey: ['topicDocumentMaster', 'active'] }) 
        queryClient.invalidateQueries({ queryKey: ['adminTopicDocumentMasters'] })
      } catch (e) { }
      fetchMasters()
    } catch (e) { console.error(e) }
  }

  const onEdit = (m) => {
    if (isProductOwner) return
    setForm({ id: m.id, document_number: m.document_number || '', published_at: m.published_at || '', revision_number: m.revision_number || '', is_active: !!m.is_active })
    setShowCreate(true)
  }

  const onDelete = async (m) => {
    if (isProductOwner) return
    if (!confirm('Hapus master ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      await api.delete(`/admin/topic-document-masters/${m.id}`)
      try { 
        queryClient.invalidateQueries({ queryKey: ['topicDocumentMaster', 'active'] }) 
        queryClient.invalidateQueries({ queryKey: ['adminTopicDocumentMasters'] })
      } catch (e) { }
      fetchMasters()
    } catch (e) { console.error(e) }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Dokumen Header</CardTitle>
        {!isProductOwner && (
          <div>
            <Button onClick={openCreate}>Buat Master Baru</Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="mb-4 text-sm text-muted-foreground">Kelola nomor dokumen, tanggal terbit, dan nomor revisi yang akan otomatis terisi saat membuat formulir.</div>
        {/* Visual read-only banner intentionally removed for product_owner per UX request. */}
        {loading ? (
          <div className="text-center py-6">Memuat…</div>
        ) : (
          <MastersList masters={masters} onActivate={onActivate} onEdit={onEdit} onDelete={onDelete} readOnly={isProductOwner} />
        )}

        <Dialog open={!isProductOwner && showCreate} onOpenChange={setShowCreate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{form.id ? 'Edit Master' : 'Buat Master Dokumen'}</DialogTitle>
              <DialogDescription>Isi informasi header dokumen yang akan digunakan saat membuat formulir.</DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit} className="space-y-3 mt-2">
              <div>
                <label className="block text-sm">Nomor Dokumen</label>
                <input className="w-full border rounded p-2" value={form.document_number} onChange={(e)=>setForm({...form, document_number: e.target.value})} required disabled={isProductOwner} />
              </div>
              <div>
                <label className="block text-sm">Tanggal Terbit</label>
                <input type="date" className="w-full border rounded p-2" value={form.published_at ? form.published_at.slice(0,10) : ''} onChange={(e)=>setForm({...form, published_at: e.target.value})} disabled={isProductOwner} />
              </div>
              <div>
                <label className="block text-sm">Nomor Revisi</label>
                <input className="w-full border rounded p-2" value={form.revision_number} onChange={(e)=>setForm({...form, revision_number: e.target.value})} disabled={isProductOwner} />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e)=>setForm({...form, is_active: e.target.checked})} disabled={isProductOwner} />
                <label htmlFor="is_active" className="text-sm">Set aktif (hanya satu boleh aktif)</label>
              </div>
              <DialogFooter>
                <div className="flex items-center gap-3 justify-end w-full">
                  <Button variant="outline" onClick={()=>setShowCreate(false)}>Batal</Button>
                  <Button type="submit" disabled={isProductOwner}>Simpan</Button>
                </div>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
