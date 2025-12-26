import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { sampleTopics } from '@/pages/topics/mocks/data'

export default function TopicsTab() {
  return (
    <TabsContent value="topics">
      <div className="mt-4">
        {sampleTopics.map((t) => (
          <Card className="mb-4" key={t.id}>
            <Link to={`/topics/${t.id}`} className="block no-underline text-inherit">
              <CardContent>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-lg">{t.title}</div>
                    <div className="text-sm text-muted-foreground mt-2">{t.description}</div>

                    <div className="flex items-center gap-3 mt-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">{t.tags[0] || 'Status'}</span>
                      <div className="flex items-center gap-2">
                        <Avatar>
                          <AvatarFallback>{t.author.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm">{t.author}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-4">
                    <div className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{t.badge.label}</div>
                    <div className="text-sm text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" className="inline-block w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> Jatuh Tempo {t.due}</div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </TabsContent>
  )
}
