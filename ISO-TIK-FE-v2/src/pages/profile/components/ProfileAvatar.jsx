import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Upload, Trash2, RefreshCcw } from 'lucide-react'
import { getInitials } from '@/utils/profileUtils'

export const ProfileAvatar = ({
  displayName,
  avatarSrc,
  avatarError,
  photoMessage,
  isUploading,
  isDeleting,
  onSelectFile,
  onDeletePhoto,
  onRefreshPhoto,
  onAvatarError,
}) => {
  const isPositiveMessage = photoMessage?.includes('berhasil') || photoMessage?.includes('Memuat')
  
  return (
    <div className="flex flex-col items-center text-center gap-2">
      <Avatar className="w-20 h-20">
        {avatarSrc && !avatarError ? (
          <AvatarImage
            src={avatarSrc}
            alt={displayName}
            onError={onAvatarError}
            className="object-cover"
          />
        ) : null}
        <AvatarFallback className="bg-slate-100 text-slate-600">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>
      
      <div className="text-lg font-medium text-center line-clamp-2">{displayName}</div>
      
      <div className="flex flex-col gap-2 mt-4 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 justify-center"
          onClick={onSelectFile}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Mengunggah...' : 'Ganti foto'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 justify-center text-red-600 hover:text-red-700"
          onClick={onDeletePhoto}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
          {isDeleting ? 'Menghapus...' : 'Hapus foto'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 justify-center"
          onClick={onRefreshPhoto}
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh foto
        </Button>
        
        {photoMessage && (
          <p className={`text-xs ${isPositiveMessage ? 'text-green-600' : 'text-red-600'}`}>
            {photoMessage}
          </p>
        )}
      </div>
    </div>
  )
}