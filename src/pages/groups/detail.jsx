import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Users, Archive, Settings as SettingsIcon, Plus, Home } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import TabsBar from '@/components/mainComponents/tabsBar'
import Overview from '@/pages/groups/tabs/Overview'
import Members from '@/pages/groups/tabs/Members'
import Rooms from '@/pages/groups/tabs/Rooms'
import Labels from '@/pages/groups/tabs/Labels'
import Settings from '@/pages/groups/tabs/Settings'
import { useParams, Link } from 'react-router-dom'


export default function GroupsDetail() {
  const { id } = useParams()
  const title = id ? id.replace(/-/g, ' ') : 'TIK Universitas'

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
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

        <div className="mb-6  mt-6">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-heading-4 capitalize">{title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">Grup utama untuk Teknologi Informasi dan Komunikasi</CardDescription>
                <div className="mt-3 text-sm text-muted-foreground flex items-start gap-6">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>BS</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-semibold text-navy">Budi Santoso</div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-light text-green-dark">Owner</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Group owner • Joined 15/1/2024</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div>24 members</div>
                    <div>8 rooms</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button className="bg-blue-600 text-white">+ Buat Ruangan</Button>
                <Button variant="outline">Pengaturan</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs bar sticky to top of page when scrolling */}
        <div className="mb-4">
          <Tabs defaultValue="overview">
            <div className="bg-white">{/* background so sticky area covers beneath header */}
              {/* Use shared TabsBar component for consistent appearance with Rooms */}
              <TabsBar />
            </div>

            <TabsContent value="overview">
              <Overview />
            </TabsContent>
            <TabsContent value="members">
              <Members />
            </TabsContent>
            <TabsContent value="rooms">
              <Rooms />
            </TabsContent>
            <TabsContent value="labels">
              <Labels />
            </TabsContent>
            <TabsContent value="settings">
              <Settings />
            </TabsContent>
          </Tabs>
        </div>
        {/* TabsContent components above render full content for each tab */}
      </div>
    </MainLayout>
  )
}
