import React, { useEffect, useState } from 'react'
import api from '@/services/api'
import { Button } from '@/components/ui/button'
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog'

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toISOString().slice(0,10) } catch(e) { return d }
}

function MastersList({ masters, onActivate, onEdit, onDelete }) {
  return (
    <div className="space-y-3">
      {masters.map(m => (
        <div key={m.id} className="p-3 border rounded flex items-center justify-between">
          <div>
            <div className="font-medium">{m.document_number || '—'}</div>
            <div className="text-xs text-muted-foreground">Published: {formatDate(m.published_at)} · Rev: {m.revision_number || '—'}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">{m.is_active ? 'Aktif' : 'Tidak aktif'}</div>
            <button className="text-sm px-2 py-1 border rounded" onClick={() => onActivate(m)}>{m.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
            <button className="text-sm px-2 py-1 border rounded" onClick={() => onEdit(m)}>Edit</button>
            <button className="text-sm px-2 py-1 border rounded text-red-600" onClick={() => onDelete(m)}>Hapus</button>
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
    try {
      if (form.id) {
        await api.put(`/admin/topic-document-masters/${form.id}`, form)
      } else {
        await api.post('/admin/topic-document-masters', form)
      }
      setShowCreate(false)
      fetchMasters()
    } catch (err) { console.error(err) }
  }

  const onActivate = async (m) => {
    try {
      await api.put(`/admin/topic-document-masters/${m.id}`, { ...m, is_active: !m.is_active })
      fetchMasters()
    } catch (e) { console.error(e) }
  }

  const onEdit = (m) => {
    setForm({ id: m.id, document_number: m.document_number || '', published_at: m.published_at || '', revision_number: m.revision_number || '', is_active: !!m.is_active })
    setShowCreate(true)
  }

  const onDelete = async (m) => {
    if (!confirm('Hapus master ini? Tindakan ini tidak dapat dibatalkan.')) return
    try {
      await api.delete(`/admin/topic-document-masters/${m.id}`)
      fetchMasters()
    } catch (e) { console.error(e) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-heading-3 font-semibold">Master Dokumen Formulir</h2>
          <p className="text-sm text-muted-foreground">Kelola nomor dokumen, tanggal terbit, dan nomor revisi yang digunakan saat membuat formulir.</p>
        </div>
        <div>
          <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={openCreate}>Buat Master Baru</button>
        </div>
      </div>

      {loading ? <div>Memuat…</div> : <MastersList masters={masters} onActivate={onActivate} onEdit={onEdit} onDelete={onDelete} />}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Nomor Dokumen</label>
              <input className="w-full border rounded p-2" value={form.document_number} onChange={(e)=>setForm({...form, document_number: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm">Tanggal Terbit</label>
              <input type="date" className="w-full border rounded p-2" value={form.published_at ? form.published_at.slice(0,10) : ''} onChange={(e)=>setForm({...form, published_at: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm">Nomor Revisi</label>
              <input className="w-full border rounded p-2" value={form.revision_number} onChange={(e)=>setForm({...form, revision_number: e.target.value})} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e)=>setForm({...form, is_active: e.target.checked})} />
              <label htmlFor="is_active" className="text-sm">Set aktif (hanya satu boleh aktif)</label>
            </div>
            <div className="flex items-center gap-3 justify-end">
              <button type="button" className="px-3 py-2 border rounded" onClick={()=>setShowCreate(false)}>Batal</button>
              <button type="submit" className="px-3 py-2 bg-blue-600 text-white rounded">Simpan</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
