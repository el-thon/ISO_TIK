import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Archive } from 'lucide-react'

const groups = [
  {
    title: 'TIK Universitas',
    desc: 'Grup utama untuk Teknologi Informasi dan Komunikasi',
    members: 24,
    rooms: 8,
    owner: 'Budi Santoso',
    initials: 'BS',
  },
  {
    title: 'Akademik',
    desc: 'Sistem akademik dan perkuliahan',
    members: 156,
    rooms: 15,
    owner: 'Siti Rahayu',
    initials: 'SR',
  },
  {
    title: 'Penelitian & Pengabdian',
    desc: 'Koordinasi penelitian dan pengabdian masyarakat',
    members: 89,
    rooms: 12,
    owner: 'Budi Santoso',
    initials: 'BS',
  },
]

export default function GroupsPage() {
  return (
    <MainLayout>
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-heading-2 font-semibold">Groups</h2>
            <p className="text-body-md text-muted-foreground">Manage organizational groups</p>
          </div>

          <Button className="bg-blue-600 text-white">+ Create Group</Button>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((g) => {
            const slug = g.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            return (
              <Link key={g.title} to={`/groups/${slug}`} className="no-underline">
                <Card className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-transform duration-150">
                
                <div className="px-6 pt-6">
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <CardTitle className="text-lg font-semibold">{g.title}</CardTitle>
                      <CardDescription className="mt-1 text-sm">{g.desc}</CardDescription>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{g.members}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4" />
                        <span className="font-medium">{g.rooms}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <CardContent className="pt-0">
                  <div className="mt-4 border-t pt-4 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Owner</div>
                      <div className="text-sm font-medium mt-1">{g.owner}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{g.initials}</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            )
          })}
          
        </section>
      </div>
    </MainLayout>
  )
}
