import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { sampleRooms } from '@/pages/groups/mocks/data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function Rooms() {
  return (
    <div>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Ruangan ({sampleRooms.length})</CardTitle>
          <Button size="sm" className="bg-blue-600 text-white flex items-center gap-2">
            <Plus /> Buat Ruangan
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sampleRooms.map((r) => (
              <div key={r.title} className="p-4 border rounded-md bg-white">
                <div className="flex items-center justify-between">
                  <div className="w-3/4">
                    <div className="font-medium text-lg">{r.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{r.description}</div>

                    <div className="flex items-center gap-3 mt-4">
                      <Avatar>
                        <AvatarFallback>{r.owner.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-muted-foreground">{r.owner}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Aktif</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
