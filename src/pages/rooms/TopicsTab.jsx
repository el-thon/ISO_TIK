import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { useRoomTopics } from '@/services/roomHooks'

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getInitials = (text) => {
  if (!text) return '??'
  return text
    .split(' ')
    .filter(Boolean)
    .map((t) => t[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function TopicsTab({ roomId }) {
  const { data, isLoading } = useRoomTopics(roomId, { per_page: 10 })
  const topics = data?.topics ?? []

  return (
    <TabsContent value="topics" className="mt-4">
      {isLoading && <TopicsSkeleton />}
      {!isLoading && topics.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-6 text-center">
          Belum ada formulir di forum ini.
        </div>
      )}
      {!isLoading && topics.length > 0 && (
        <div className="space-y-4">
          {topics.map((topic) => {
            const authorName = topic.created_by?.username || 'Anonim'
            return (
              <Card key={topic.id}>
                <Link to={`/formulir/${topic.id}`} className="block no-underline text-inherit">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-medium text-lg">{topic.title}</div>
                        <div className="text-sm text-muted-foreground mt-2 line-clamp-3">
                          {topic.description || 'Tidak ada ringkasan'}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
                          {topic.status && (
                            <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 uppercase">{topic.status}</span>
                          )}
                          {topic.priority && (
                            <span className="px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 uppercase">{topic.priority}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-4 text-sm">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>{getInitials(authorName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-xs text-muted-foreground">Dibuat oleh</div>
                            <div>{authorName}</div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div className="text-xs uppercase tracking-wide">Deadline</div>
                        <div>{formatDate(topic.deadline_at)}</div>
                        <div className="mt-4 text-xs">
                          {topic.stats?.comment_count ?? 0} komentar • {topic.stats?.routing_count ?? 0} routing
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </TabsContent>
  )
}

function TopicsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, idx) => (
        <Card key={idx}>
          <CardContent className="pt-4 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
