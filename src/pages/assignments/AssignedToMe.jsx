import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { sampleAssignments, currentUser } from './mocks/data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

function AssignmentCard({ a }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-lg font-medium">{a.title}</div>
            <div className="text-sm text-muted-foreground">{a.category}</div>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>{a.from.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{a.from.name}</span>
              </div>

              <div className="text-sm text-muted-foreground">→</div>

              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback>{a.to.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{a.to.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{a.tag}</span>
              <div className="text-sm text-red-600">Due in -{Math.abs(daysUntil(a.due))} days</div>
            </div>

            <div className="mt-4 bg-slate-50 p-3 rounded">{a.note}</div>
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            <span className={`text-xs px-2 py-1 rounded-full ${a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
            <div className="text-xs text-muted-foreground">{a.due}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function daysUntil(dateStr) {
  const now = new Date()
  const d = new Date(dateStr)
  const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24))
  return diff
}

export default function AssignedToMe() {
  const items = sampleAssignments.filter((a) => a.to.email === currentUser.email)

  if (items.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="min-h-[90px] flex items-center justify-center text-muted-foreground">No assignments found</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {items.map((a) => (
        <AssignmentCard key={a.id} a={a} />
      ))}
    </div>
  )
}
