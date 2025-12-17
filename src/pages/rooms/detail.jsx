import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import TabsBar from '@/components/mainComponents/tabsBar'
import { Tabs } from '@/components/ui/tabs'
import RoomTabsContent from '@/pages/rooms/RoomTabsContent'
import { sampleRooms } from '@/pages/groups/mocks/data'
import { sampleTopics } from '@/pages/topics/mocks/data'
import { useParams, Link } from 'react-router-dom'

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function RoomDetail() {
  const { id } = useParams()
  const roomId = id || slugify(sampleRooms[0].title)
  const room = sampleRooms.find((r) => slugify(r.title) === roomId) || sampleRooms[0]

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="mb-6">
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-heading-3 font-semibold">{room.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground mt-1">{room.description}</CardDescription>

                <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Group:</span>
                    <Link to="/groups/tik-universitas" className="text-blue-600 font-medium">TIK Universitas</Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <span>Responsible:</span>
                    <div className="inline-flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm">SR</div>
                      <span className="text-sm">Siti Rahayu</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Restricted L1</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Private</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button size="sm" className="bg-blue-600 text-white">+ Create Topic</Button>
                <Button variant="outline" size="sm">Settings</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs (reuse TabsBar) */}
        <div className="mb-6">
          <Tabs defaultValue="topics">
            <div className="bg-white">
              <TabsBar items={[
                { label: 'Topics', value: 'topics', count: sampleTopics.length },
                { label: 'Participants', value: 'participants', count: 5 },
                { label: 'Timeline', value: 'timeline' },
                { label: 'Settings', value: 'settings' },
              ]} />
            </div>

            {/* Tabs content extracted to RoomTabsContent for reuse and clarity */}
            <RoomTabsContent />
          </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
