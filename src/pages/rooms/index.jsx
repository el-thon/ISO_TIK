import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { sampleRooms } from './mocks/data'
import { defaultGroup } from './mocks/data'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'


export default function RoomsPage() {
  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-heading-2 font-semibold">Rooms</h1>
          <p className="text-body-md text-muted-foreground">Manage topic rooms and workspaces</p>
        </div>
        <div>
          {/* Dialog trigger for create room overlay */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue hover:bg-blue-light text-white hover:text-black flex items-center gap-2">
                <Plus /> Tambah Ruangan
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Ruangan Baru</DialogTitle>
                <DialogDescription>Isi formulir untuk membuat ruangan baru</DialogDescription>
              </DialogHeader>

              <CreateRoomForm />

              <DialogFooter />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleRooms.map((r) => {
          const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          const initials = r.owner.split(' ').map((n) => n[0]).slice(0, 2).join('')
          const securityClass = r.security && r.security.includes('Critical') ? 'bg-rose-50 text-rose-600' : r.security && r.security.includes('Restricted') ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-600'

          return (
            <Card key={r.title}>
              <Link to={`/rooms/${slug}`} className="block no-underline text-inherit">
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-lg">{r.title}</div>
                        {r.security && (
                          <span className={`text-xs px-2 py-1 rounded-full ${securityClass}`}>{r.security}</span>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">{r.groupTitle}</div>
                      <div className="text-sm text-muted-foreground mt-3">{r.description}</div>

                      <div className="mt-4">
                        {r.privacy && (
                          <span className="text-xs inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700">{r.privacy}</span>
                        )}
                      </div>

                      <div className="border-t my-4" />

                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-xs text-muted-foreground">Responsible</div>
                          <div className="text-sm">{r.owner}</div>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-3">Created {r.createdAt}</div>
                    </div>

                    <div className="text-right">
                      {/* placeholder for action badges */}
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>
      </div>
    </MainLayout>
  )
}

function CreateRoomForm() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [group, setGroup] = useState("")
  const [visibility, setVisibility] = useState("")

  // derive options from sampleRooms + defaultGroup
  const groupSet = Array.from(new Set(sampleRooms.map((r) => r.groupTitle)))
  const groups = [defaultGroup.title, ...groupSet.filter((g) => g !== defaultGroup.title)]

  const securitySet = Array.from(new Set(sampleRooms.map((r) => r.security))).filter(Boolean)
  const visibilitySet = Array.from(new Set(sampleRooms.map((r) => r.privacy))).filter(Boolean)

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      title: name,
      description,
      groupTitle: group || defaultGroup.title,
      security: security || securitySet[0] || "Internal L0",
      privacy: visibility || visibilitySet[0] || "Public",
      createdAt: new Date().toLocaleDateString(),
    }

    // Untuk demo: log payload dan tutup modal. Di aplikasi nyata, panggil API.
    // eslint-disable-next-line no-console
    console.log('Payload pembuatan ruangan:', payload)
    // Let the DialogClose on the button close the dialog
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-2">Nama Ruangan</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama ruangan" />
      </div>

      <div className="mb-4">
        <label className="text-sm text-muted-foreground mb-2">Deskripsi</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-200 rounded-md p-3 min-h-30 text-sm" placeholder="Jelaskan tujuan ruangan" />
      </div>

      <div className="mb-4">
        <div>
          <label className="text-sm text-muted-foreground mb-2">Grup</label>
          <Select onValueChange={(v) => setGroup(v)} defaultValue="">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih grup" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g} value={g}>{g}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

      </div>

      <div className="mb-6">
        <label className="text-sm text-muted-foreground mb-2">Visibilitas</label>
        <Select onValueChange={(v) => setVisibility(v)} defaultValue="">
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih visibilitas" />
          </SelectTrigger>
          <SelectContent>
            {visibilitySet.map((v) => (
              <SelectItem key={v} value={v}>{v === 'Public' ? 'Publik - Terlihat untuk semua anggota grup' : v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button variant="outline" type="button">Batal</Button>
        </DialogClose>

        <DialogClose asChild>
          <Button type="submit">Buat Ruangan</Button>
        </DialogClose>
      </div>
    </form>
  )
}
