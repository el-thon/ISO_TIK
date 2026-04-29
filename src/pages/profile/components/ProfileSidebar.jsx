import React from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { User, Briefcase, Shield, FileText } from 'lucide-react'
import { ProfileAvatar } from './ProfileAvatar'

const navItemClass = (currentTab, tabName) =>
  `flex items-center gap-3 px-3 py-2 rounded-md ${
    currentTab === tabName ? 'bg-blue-50 text-blue-700' : 'text-foreground hover:bg-slate-50'
  }`

export const ProfileSidebar = ({
  currentTab,
  displayName,
  faculty,
  status,
  avatarProps,
  fileInputRef,
  onFileChange,
}) => {
  return (
    <Card>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
          disabled={avatarProps.isUploading}
        />
        
        <ProfileAvatar
          displayName={displayName}
          avatarSrc={avatarProps.avatarSrc}
          avatarError={avatarProps.avatarError}
          photoMessage={avatarProps.photoMessage}
          isUploading={avatarProps.isUploading}
          isDeleting={avatarProps.isDeleting}
          onSelectFile={avatarProps.handleSelectFile}
          onDeletePhoto={avatarProps.handleDeletePhoto}
          onRefreshPhoto={avatarProps.forceRefreshPhoto}
          onAvatarError={() => avatarProps.setAvatarError(true)}
        />

        <div className="mt-2 text-center">
          <div className="text-sm text-muted-foreground text-center">{faculty}</div>
          <div className="mt-2">
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full capitalize">
              {status || 'active'}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <nav className="flex flex-col gap-2">
            <Link to="/profil?tab=overview" className={navItemClass(currentTab, 'overview')}>
              <User className="w-4 h-4" /> Overview
            </Link>
            <Link to="/profil?tab=personal" className={navItemClass(currentTab, 'personal')}>
              <FileText className="w-4 h-4" /> Personal Data
            </Link>
            <Link to="/profil?tab=employment" className={navItemClass(currentTab, 'employment')}>
              <Briefcase className="w-4 h-4" /> Employment
            </Link>
            <Link to="/profil?tab=security" className={navItemClass(currentTab, 'security')}>
              <Shield className="w-4 h-4" /> Security & Privacy
            </Link>
          </nav>
        </div>
      </CardContent>
    </Card>
  )
}