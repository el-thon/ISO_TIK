import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

// Services & Hooks - SEMUA dari profileHooks
import { useProfile, useProfilePhoto } from '@/services/profileHooks'

// Utils
import { getTabFromQuery } from '@/utils/profileUtils'

// Components
import { ProfileSidebar } from './components/ProfileSidebar'
import OverviewTab from './Overview'
import PersonalDataTab from './PersonalData'
import EmploymentTab from './Employment'
import SecurityTab from './Security'

const TabContent = ({ tab, profileData }) => {
  if (!profileData) return null
  
  switch (tab) {
    case 'overview':
      return <OverviewTab profileData={profileData} />
    case 'personal':
      return <PersonalDataTab profileData={profileData} />
    case 'employment':
      return <EmploymentTab userId={profileData?.id} employment={profileData?.employment} />
    case 'security':
      return <SecurityTab />
    default:
      return <OverviewTab profileData={profileData} />
  }
}

export default function ProfilePage() {
  const location = useLocation()
  const safeTab = useMemo(() => getTabFromQuery(location.search), [location.search])

  const { data: profileData, isLoading, isError, refetch } = useProfile()
  const avatarProps = useProfilePhoto(profileData, refetch)

  const displayName = useMemo(() => {
    return profileData?.profile?.full_name || profileData?.name || profileData?.username || 'Pengguna'
  }, [profileData])

  const faculty = useMemo(() => {
    return profileData?.employment?.faculty || 
           profileData?.employment?.department || 
           profileData?.profile?.department || 
           'Unknown unit'
  }, [profileData])

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-sm text-muted-foreground">Memuat data profil...</div>
    }

    if (isError) {
      return (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-red-600">Gagal memuat profil. Coba muat ulang.</p>
          <Button variant="outline" onClick={() => refetch()} className="w-fit flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" /> Muat ulang
          </Button>
        </div>
      )
    }

    return <TabContent tab={safeTab} profileData={profileData} />
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex items-start gap-6">
          {/* Left Column - Sidebar */}
          <div className="w-72">
            <ProfileSidebar
              currentTab={safeTab}
              displayName={displayName}
              faculty={faculty}
              status={profileData?.status}
              avatarProps={avatarProps}
              fileInputRef={avatarProps.fileInputRef}
              onFileChange={avatarProps.handleFileChange}
            />
          </div>

          {/* Right Column - Content */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-heading-2 font-semibold">Profile</h2>
                <p className="text-body-md text-muted-foreground">
                  Kelola informasi pribadi dan preferensi akun
                </p>
              </div>
            </div>
            {renderContent()}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}