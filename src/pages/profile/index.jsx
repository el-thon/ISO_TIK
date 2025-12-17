import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Edit3, User, Briefcase, Shield, FileText } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export default function ProfilePage() {
  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Left column */}
          <div className="w-72">
            <Card>
              <CardContent>
                <div className="flex flex-col items-center text-center gap-2">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback>BS</AvatarFallback>
                  </Avatar>
                  <div className="text-lg font-medium">Dr. Budi Santoso, M.Kom.</div>
                  <div className="text-sm text-muted-foreground">Teknik Informatika</div>
                  <div className="mt-2">
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">owner</span>
                  </div>
                </div>

                <div className="mt-6">
                  <nav className="flex flex-col gap-2">
                    <NavLink to="/profile" className="flex items-center gap-3 px-3 py-2 rounded-md bg-blue-50 text-blue-700">
                      <User className="w-4 h-4" /> Overview
                    </NavLink>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-slate-50">
                      <FileText className="w-4 h-4" /> Personal Data
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-slate-50">
                      <Briefcase className="w-4 h-4" /> Employment
                    </a>
                    <a className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-foreground hover:bg-slate-50">
                      <Shield className="w-4 h-4" /> Security & Privacy
                    </a>
                  </nav>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading-2 font-semibold">Profile</h2>
                <p className="text-body-md text-muted-foreground">Manage your personal information and settings</p>
              </div>
              <div>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> Edit
                </Button>
              </div>
            </div>

            <Card>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground">Full Name</div>
                    <div className="font-medium">Dr. Budi Santoso, M.Kom.</div>

                    <div className="mt-4 text-xs text-muted-foreground">Institutional Email</div>
                    <div className="font-medium">budi.santoso@university.ac.id</div>

                    <div className="mt-4 text-xs text-muted-foreground">Phone Number</div>
                    <div className="font-medium">+62812345678</div>

                    <div className="mt-4 text-xs text-muted-foreground">Department</div>
                    <div className="font-medium">Teknik Informatika</div>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Username</div>
                    <div className="font-medium">budi.santoso</div>

                    <div className="mt-4 text-xs text-muted-foreground">Personal Email</div>
                    <div className="font-medium">budi@gmail.com</div>

                    <div className="mt-4 text-xs text-muted-foreground">Faculty</div>
                    <div className="font-medium">Fakultas Teknik</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
