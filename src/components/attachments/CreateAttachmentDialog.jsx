import React, { useState } from 'react'
import { X as XIcon, Upload, Loader2, AlertCircle, FileText, User, ChevronDown, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTopics, useCreateAttachment } from '@/services/topicHooks'
import { useAdminUsersList } from '@/services/adminUsersHooks'
import { cn } from '@/lib/utils'

/**
 * CreateAttachmentDialog
 * Dialog untuk membuat attachment dengan dropdown topic dan recipient (user)
 */
export default function CreateAttachmentDialog({ open, onOpenChange, onSuccess }) {
  const [selectedTopicId, setSelectedTopicId] = useState('')
  const [selectedRecipientId, setSelectedRecipientId] = useState('')
  const [file, setFile] = useState(null)
  const [label, setLabel] = useState('')
  const [error, setError] = useState(null)

  // Fetch topics untuk dropdown
  const { data: topicsData, isLoading: topicsLoading } = useTopics(
    { page: 1, per_page: 100 }, 
    { enabled: open }
  )
  
  // Fetch users untuk dropdown
  const { data: usersData, isLoading: usersLoading } = useAdminUsersList(
    { page: 1, per_page: 100 }, 
    { enabled: open }
  )

  // Create attachment mutation
  const createAttachmentMutation = useCreateAttachment({
    onSuccess: (data) => {
      setError(null)
      resetForm()
      if (onSuccess) onSuccess(data)
      onOpenChange(false)
    },
    onError: (err) => {
      const message = err?.response?.data?.message || err?.message || 'Gagal membuat attachment'
      setError(message)
    },
  })

  const resetForm = () => {
    setSelectedTopicId('')
    setSelectedRecipientId('')
    setFile(null)
    setLabel('')
    setError(null)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-set label dari filename jika label kosong
      if (!label) {
        setLabel(selectedFile.name)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!selectedTopicId) {
      setError('Pilih topic terlebih dahulu')
      return
    }
    if (!selectedRecipientId) {
      setError('Pilih recipient terlebih dahulu')
      return
    }
    if (!file) {
      setError('Pilih file untuk diupload')
      return
    }

    // Prepare FormData
    const formData = new FormData()
    formData.append('file', file)
    formData.append('topic_id', selectedTopicId)
    formData.append('recipient_id', selectedRecipientId)
    if (label) formData.append('label', label)

    // Submit
    createAttachmentMutation.mutate(formData)
  }

  const topics = topicsData?.topics ?? []
  const users = usersData?.users ?? []

  const isLoading = topicsLoading || usersLoading || createAttachmentMutation.isLoading

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) resetForm()
      onOpenChange(isOpen)
    }}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Buat Attachment Baru
          </DialogTitle>
          <DialogDescription>
            Upload file dan pilih topic serta recipient untuk attachment.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Topic Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Topic <span className="text-rose-600">*</span>
            </Label>
            <Select
              value={selectedTopicId}
              onValueChange={setSelectedTopicId}
              disabled={topicsLoading}
            >
              <SelectTrigger 
                id="topic" 
                className="h-11 bg-white border-gray-300 hover:border-blue-400 focus:border-blue-500 transition-colors"
              >
                <SelectValue placeholder={
                  topicsLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat topics...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pilih topic untuk attachment</span>
                  )
                } />
              </SelectTrigger>
              <SelectContent 
                className="w-full max-w-117.5 h-75 overflow-y-auto"
                position="popper"
                sideOffset={5}
                align="start"
              >
                {topics.length === 0 && !topicsLoading && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Tidak ada topic tersedia
                  </div>
                )}
                {topics.map((topic) => (
                  <SelectItem 
                    key={topic.id} 
                    value={topic.id}
                    className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-3"
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {topic.title || `Topic ${topic.id}`}
                        </div>
                        {topic.description && (
                          <div className="text-xs text-muted-foreground truncate mt-0.5">
                            {topic.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient (User) Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="recipient" className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-emerald-600" />
              Recipient (Penerima) <span className="text-rose-600">*</span>
            </Label>
            <Select
              value={selectedRecipientId}
              onValueChange={setSelectedRecipientId}
              disabled={usersLoading}
            >
              <SelectTrigger 
                id="recipient"
                className="h-11 bg-white border-gray-300 hover:border-emerald-400 focus:border-emerald-500 transition-colors"
              >
                <SelectValue placeholder={
                  usersLoading ? (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Memuat users...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pilih penerima attachment</span>
                  )
                } />
              </SelectTrigger>
              <SelectContent 
                className="w-full max-w-117.5 h-75 overflow-y-auto"
                position="popper"
                sideOffset={5}
                align="start"
              >
                {users.length === 0 && !usersLoading && (
                  <div className="p-4 text-sm text-muted-foreground text-center">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    Tidak ada user tersedia
                  </div>
                )}
                {users.map((user) => {
                  // Display username dari berbagai kemungkinan field
                  const displayName = user.username || user.name || user.email || `User ${user.id}`
                  const displayEmail = user.email
                  const initials = displayName.substring(0, 2).toUpperCase()
                  
                  return (
                    <SelectItem 
                      key={user.id} 
                      value={user.id}
                      className="cursor-pointer hover:bg-emerald-50 focus:bg-emerald-50 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {displayName}
                          </div>
                          {displayEmail && (
                            <div className="text-xs text-muted-foreground truncate">
                              {displayEmail}
                            </div>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">
              File <span className="text-rose-600">*</span>
            </Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            {file && (
              <div className="text-xs text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          {/* Label (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="label">Label (Opsional)</Label>
            <Input
              id="label"
              type="text"
              placeholder="Deskripsi atau label untuk file"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createAttachmentMutation.isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !selectedTopicId || !selectedRecipientId || !file}
            >
              {createAttachmentMutation.isLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Buat Attachment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
