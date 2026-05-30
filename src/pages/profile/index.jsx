import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCcw } from 'lucide-react'

// Services & Hooks - SEMUA dari useProfile
import { useProfile, useProfilePhoto } from '@/hooks/useProfile'

// Utils
import { getTabFromQuery } from '@/utils/profileUtils'

// Components
import { ProfileSidebar } from './components/ProfileSidebar'
import OverviewTab from './Overview'
import PersonalDataTab from './PersonalData'
import EmploymentTab from './Employment'
import SecurityTab from './Security'

const TabContent = ({ tab, profileData, onRefetch }) => {
  if (!profileData) return null
  
  switch (tab) {
    case 'overview':
      return <OverviewTab profileData={profileData} onRefetch={onRefetch} />
    case 'personal':
      return <PersonalDataTab profileData={profileData} onRefetch={onRefetch} />
    case 'employment':
      return <EmploymentTab employment={profileData?.employment} onRefetch={onRefetch} />
    case 'security':
      return <SecurityTab />
    default:
      return <OverviewTab profileData={profileData} onRefetch={onRefetch} />
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

    return <TabContent tab={safeTab} profileData={profileData} onRefetch={refetch} />
  }

  return (
    <MainLayout>
      <div className="w-full max-w-full mx-auto px-0 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="flex flex-col items-stretch gap-6 lg:flex-row lg:items-start">
          {/* Left Column - Sidebar */}
          <div className="w-full lg:w-72 lg:shrink-0">
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
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
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
