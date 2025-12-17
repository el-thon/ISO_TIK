import React, { useState, useEffect } from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Edit3, User, Briefcase, Shield, FileText } from 'lucide-react'
import Overview from './Overview'
import PersonalData from './PersonalData'
import Employment from './Employment'
import Security from './Security'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export default function ProfilePage() {
  const [tab, setTab] = useState('overview')
  const location = useLocation()
  const navigate = useNavigate()

  // Sync tab with ?tab= query param so links can control the active section
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('tab')
    if (q && ['overview', 'personal', 'employment', 'security'].includes(q)) {
      setTab(q)
    } else {
      // default to overview if none
      setTab('overview')
      // ensure URL has the tab param for shareable links
      if (!params.get('tab')) {
        params.set('tab', 'overview')
        navigate({ pathname: location.pathname, search: params.toString() }, { replace: true })
      }
    }
  }, [location.search])

  const navItemClass = (key) =>
    `flex items-center gap-3 px-3 py-2 rounded-md ${tab === key ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-slate-50'}`

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
                    <Link to="/profile?tab=overview" className={navItemClass('overview')}>
                      <User className="w-4 h-4" /> Overview
                    </Link>
                    <Link to="/profile?tab=personal" className={navItemClass('personal')}>
                      <FileText className="w-4 h-4" /> Personal Data
                    </Link>
                    <Link to="/profile?tab=employment" className={navItemClass('employment')}>
                      <Briefcase className="w-4 h-4" /> Employment
                    </Link>
                    <Link to="/profile?tab=security" className={navItemClass('security')}>
                      <Shield className="w-4 h-4" /> Security & Privacy
                    </Link>
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

            <div>
              {tab === 'overview' && <Overview />}
              {tab === 'personal' && <PersonalData />}
              {tab === 'employment' && <Employment />}
              {tab === 'security' && <Security />}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
