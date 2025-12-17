import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Sliders } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sampleTopics } from './mocks/data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function TopicsPage() {
  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-heading-2 font-semibold">Topics</h1>
            <p className="text-body-md text-muted-foreground">Manage all submissions and topics</p>
          </div>

          <div className="flex items-center w-full">
            <div className="flex-1 w-full mr-4">
              <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-md px-3 py-2 shadow-sm">
                <Input placeholder="Search topics..." className="border-0 shadow-none p-0 w-full " />
                <Button size="sm" variant={null} className="bg-white border-0 shadow-none p-0 hover:bg-transparent">
                  Filters
                </Button>
                <button className="p-2 rounded-md hover:bg-gray-light">
                  <Sliders className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            <Link to="/topics/create">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-dark text-white px-4 h-10 rounded-md flex items-center gap-2">
                <Plus /> Tambah Topik
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {sampleTopics.map((t) => (
            <Card key={t.id}>
              <CardContent>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-lg font-medium">{t.title}</div>
                      <div className="text-xs px-2 py-1 rounded-md bg-slate-50 text-muted-foreground">{t.badge.label}</div>
                    </div>

                    <div className="text-sm text-muted-foreground mt-2">{t.description}</div>

                    <div className="flex items-center gap-3 mt-4 flex-wrap">
                      {t.tags.map((tag) => (
                        <span key={tag} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full">{tag}</span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
                      <Avatar>
                        <AvatarFallback>{t.author.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
                      </Avatar>
                      <div>{t.author} · {t.category} · Due {t.due}</div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="text-sm text-muted-foreground">Responsible:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-medium">{t.responsible.initials}</div>
                    </div>

                    <div className="text-xs text-muted-foreground">Updated {t.updated}</div>
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
