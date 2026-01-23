import React, { useEffect, useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Users, Home, RefreshCcw, DoorOpen, Lock } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import TabsBar from '@/components/mainComponents/tabsBar'
import Overview from '@/pages/groups/tabs/Overview'
import Members from '@/pages/groups/tabs/Members'
import Rooms from '@/pages/groups/tabs/Rooms'
import Labels from '@/pages/groups/tabs/Labels'
import Settings from '@/pages/groups/tabs/Settings'
import { useParams, Link } from 'react-router-dom'
import { useGroup, useGroupRooms } from '@/services/groupHooks'
import { Skeleton } from '@/components/ui/skeleton'

const getInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('')
}

export default function GroupsDetail() {
  const { id: groupId } = useParams()
  const [tab, setTab] = useState('overview')
  const { data: group, isLoading, isError, error, refetch } = useGroup(groupId, { enabled: Boolean(groupId) })
  const isForbidden = group?.__forbidden || error?.response?.status === 403
  const { data: groupRoomsData } = useGroupRooms(groupId, { enabled: Boolean(groupId) && !isForbidden })
  const [unauthorizedOpen, setUnauthorizedOpen] = useState(false)
  const resolveRoomCountFromGroup = (currentGroup, roomsPayload) => {
    const sources = [
      roomsPayload?.total,
      Array.isArray(roomsPayload?.rooms) ? roomsPayload.rooms.length : undefined,
    ]
    if (currentGroup) {
      sources.push(
        currentGroup?.stats?.room_count,
        currentGroup?.room_count,
        currentGroup?.rooms_count,
        Array.isArray(currentGroup?.rooms) ? currentGroup.rooms.length : undefined,
      )
    }

    for (const value of sources) {
      if (typeof value === 'number' && !Number.isNaN(value)) {
        return value
      }
    }

    return 0
  }

  const [roomCount, setRoomCount] = useState(() => resolveRoomCountFromGroup(group, groupRoomsData))

  const ownerName = group?.owner?.profile?.full_name || group?.owner?.username || 'Tidak diketahui'

  const derivedRoomCount = useMemo(
    () => resolveRoomCountFromGroup(group, groupRoomsData),
    [group, groupRoomsData]
  )

  useEffect(() => {
    setRoomCount(derivedRoomCount)
  }, [derivedRoomCount])

  useEffect(() => {
    if (isForbidden) {
      setUnauthorizedOpen(true)
    }
  }, [isForbidden])

  const stats = group?.stats ?? {}
  
  const tabItems = useMemo(() => {
    const memberCount = stats.member_count ?? group?.members_count ?? group?.memberships?.length ?? 0
    
    return [
      { label: 'Overview', value: 'overview' },
      { 
        label: 'Members', 
        value: 'members', 
        count: memberCount 
      },
      { 
        label: 'Rooms', 
        value: 'rooms', 
        count: roomCount 
      },
      { label: 'Labels', value: 'labels' },
      { label: 'Settings', value: 'settings' },
    ]
  }, [stats.member_count, group?.members_count, group?.memberships, roomCount])

  const renderHeader = () => {
    if (isLoading) {
      return (
        <Card className="p-4 mt-6">
          <div className="space-y-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-16 w-full" />
          </div>
        </Card>
      )
    }

    if (isForbidden) {
      return (
        <Card className="p-4 mt-6 border-amber-200 bg-amber-50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-amber-700">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-heading-4">Akses ditolak</CardTitle>
                <CardDescription className="text-sm text-amber-700">
                  Anda tidak memiliki otorisasi untuk membuka grup ini.
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => refetch()}>
              <RefreshCcw className="w-4 h-4" /> Coba lagi
            </Button>
          </div>
        </Card>
      )
    }

    if (isError) {
      return (
        <Card className="p-4 mt-6">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-heading-4">Tidak dapat memuat grup</CardTitle>
              <CardDescription className="text-sm text-red-600">Terjadi kesalahan saat memuat data grup.</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => refetch()}>
              <RefreshCcw className="w-4 h-4" /> Coba lagi
            </Button>
          </div>
        </Card>
      )
    }

    if (!group) {
      return null
    }

    return (
      <Card className="p-4 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-heading-4 capitalize">{group.name}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">{group.description || 'Tidak ada deskripsi'}</CardDescription>
            <div className="mt-3 text-sm text-muted-foreground flex flex-wrap items-start gap-6">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-navy">{ownerName}</div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-light text-green-dark">Owner</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Dibuat {group.created_at_formatted || '—'}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{stats.member_count ?? group.members_count ?? group.memberships?.length ?? 0} anggota</span>
                </div>
                <div className="flex items-center gap-1">
                  <DoorOpen className="w-4 h-4" />
                  <span>{roomCount} ruangan</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="bg-blue-600 text-white" onClick={() => setTab('rooms')}>
              + Buat Ruangan
            </Button>
            <Button variant="outline" onClick={() => setTab('settings')}>
              Pengaturan
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="inline-flex items-center gap-2">
                  <Home className="w-4 h-4" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/groups">Groups</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbSeparator />

            <BreadcrumbItem>
              <BreadcrumbPage>{group?.name || 'Detail Grup'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {renderHeader()}

        <div className="mb-4 mt-6">
          {isForbidden ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 flex items-start gap-2">
              <Lock className="w-4 h-4 mt-0.5" />
              <span>Grup ini terkunci karena Anda tidak memiliki otorisasi akses.</span>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={setTab}>
              <div className="bg-white">
                <TabsBar items={tabItems} />
              </div>

              <TabsContent value="overview">
                <Overview groupId={groupId} group={group} onRoomCountChange={setRoomCount} />
              </TabsContent>
              <TabsContent value="members">
                <Members groupId={groupId} ownerId={group?.owner_user_id} />
              </TabsContent>
              <TabsContent value="rooms" forceMount>
                <Rooms 
                  groupId={groupId} 
                  onCountChange={setRoomCount}
                />
              </TabsContent>
              <TabsContent value="labels">
                <Labels groupId={groupId} />
              </TabsContent>
              <TabsContent value="settings">
                <Settings groupId={groupId} group={group} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      <Dialog open={unauthorizedOpen} onOpenChange={setUnauthorizedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Akses ditolak</DialogTitle>
            <DialogDescription>
              Anda tidak memiliki otorisasi untuk membuka grup ini. Silakan hubungi admin atau pemilik grup jika perlu akses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnauthorizedOpen(false)}>
              Tutup
            </Button>
            <Button onClick={() => refetch()}>
              Coba lagi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  )
}