import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { sampleRooms } from '@/pages/groups/mocks/data'
import { sampleTopics } from '@/pages/topics/mocks/data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import TabsBar from '@/components/mainComponents/tabsBar'
import { Tabs } from '@/components/ui/tabs'

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
          <Button size="sm" className="bg-blue-600 text-white flex items-center gap-2">
            <Plus /> Tambah Ruangan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sampleRooms.map((r) => {
          const slug = r.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          return (
            <Card key={r.title}>
              <Link to={`/rooms/${slug}`} className="block no-underline text-inherit">
                <CardContent>
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
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sampleRooms.map((r) => (
            <Card key={r.title}>
              <CardContent>
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
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
