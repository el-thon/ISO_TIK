import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { sampleRooms } from './mocks/data'
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
          <Button size="sm" className="bg-blue hover:bg-blue-light text-white hover:text-black flex items-center gap-2">
            <Plus /> Tambah Ruangan
          </Button>
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
