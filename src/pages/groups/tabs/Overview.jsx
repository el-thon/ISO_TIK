import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useGroupMembers, useGroupRooms } from '@/services/groupHooks'

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function Overview({ groupId }) {
  const { data: roomsData, isLoading: roomsLoading } = useGroupRooms(groupId, { enabled: Boolean(groupId) })
  const { data: membersData, isLoading: membersLoading } = useGroupMembers(groupId, { enabled: Boolean(groupId) })

  const recentRooms = roomsData?.rooms?.slice(0, 4) ?? []
  const activeMembers = membersData?.members?.slice(0, 5) ?? []

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Ruang Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {roomsLoading ? (
              <div className="text-sm text-muted-foreground">Memuat daftar ruangan...</div>
            ) : recentRooms.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada ruangan di grup ini.</div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentRooms.map((room) => (
                  <div key={room.id} className="p-4 border rounded-md bg-white">
                    <div className="flex items-center justify-between">
                      <div className="w-3/4">
                        <div className="font-medium">{room.name}</div>
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{room.description || 'Tidak ada deskripsi'}</div>

                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                          <div>Visibilitas: {room.visibility || room.type || 'group-wide'}</div>
                        </div>
                      </div>

                      <div>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {room.is_archived ? 'Arsip' : 'Aktif'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Anggota Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="text-sm text-muted-foreground">Memuat anggota...</div>
            ) : activeMembers.length === 0 ? (
              <div className="text-sm text-muted-foreground">Belum ada anggota yang terdaftar.</div>
            ) : (
              <ul className="flex flex-col gap-3">
                {activeMembers.map((member) => (
                  <li key={member.id || member.email} className="flex items-center justify-between p-3 bg-white rounded-md border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(member.name || member?.user?.profile?.full_name || member?.user?.username)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name || member?.user?.profile?.full_name || member?.user?.username || 'Pengguna'}</div>
                        <div className="text-small text-muted-foreground">{member.email || member?.user?.email || member.role}</div>
                      </div>
                    </div>

                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        member.role === 'owner'
                          ? 'bg-green-light text-green-dark'
                          : member.role === 'manager'
                          ? 'bg-blue-light text-blue-dark'
                          : 'bg-gray-light text-gray-dark'
                      }`}>{member.role}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
