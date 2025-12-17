import React from 'react'
import { TabsContent } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { members } from '@/pages/groups/mocks/data'

export default function ParticipantsTab() {
  return (
    <TabsContent value="participants">
      <div className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((m) => (
            <div key={m.email} className="flex items-center gap-3 p-3 border rounded-md bg-white">
              <Avatar>
                <AvatarFallback>{m.name.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{m.name}</div>
                <div className="text-sm text-muted-foreground">{m.unit} • {m.email}</div>
              </div>
              <div className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-muted-foreground">{m.role}</div>
            </div>
          ))}
        </div>
      </div>
    </TabsContent>
  )
}
