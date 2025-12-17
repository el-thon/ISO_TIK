import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { sampleRooms, members } from '@/pages/groups/mocks/data'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function Overview() {
  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {sampleRooms.map((r) => (
                <div key={r.title} className="p-4 border rounded-md bg-white">
                  <div className="flex items-center justify-between">
                    <div className="w-3/4">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{r.description}</div>

                      <div className="flex items-center gap-3 mt-3">
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-3">
              {members.map((m) => (
                <li key={m.email} className="flex items-center justify-between p-3 bg-white rounded-md border">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{m.name.split(' ').map(n => n[0]).slice(0,2).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-small text-muted-foreground">{m.unit}</div>
                    </div>
                  </div>

                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.role === 'owner'
                        ? 'bg-green-light text-green-dark'
                        : m.role === 'responsible'
                        ? 'bg-blue-light text-blue-dark'
                        : m.role === 'reviewer'
                        ? 'bg-yellow-light text-yellow-dark'
                        : m.role === 'participant'
                        ? 'bg-gray-light text-gray-dark'
                        : 'bg-navy text-white'
                    }`}>{m.role}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
