import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Link, useNavigate } from 'react-router-dom'

export default function CreateTopic() {
  const navigate = useNavigate()

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-6">
          <h1 className="text-heading-2 font-semibold">Create New Topic</h1>
          <p className="text-body-md text-muted-foreground mt-2">Build a flexible submission with custom content blocks</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-8 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">1</div>
            <div className="w-20 text-center text-sm text-blue-600">Basic Info</div>
          </div>
          <div className="w-24 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-muted-foreground flex items-center justify-center">2</div>
            <div className="w-20 text-center text-sm text-muted-foreground">Content Blocks</div>
          </div>
          <div className="w-24 h-1 bg-slate-200 rounded-full" />
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-muted-foreground flex items-center justify-center">3</div>
            <div className="w-20 text-center text-sm text-muted-foreground">Review & Publish</div>
          </div>
        </div>

        <Card>
          <CardContent>
            <CardTitle className="text-heading-3">Basic Information</CardTitle>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm block mb-1">Title</label>
                <Input placeholder="Enter topic title..." />
              </div>

              <div>
                <label className="text-sm block mb-1">Description</label>
                <textarea className="w-full border border-slate-200 rounded-md p-3 min-h-[120px] text-sm" placeholder="Describe the purpose and context of this topic..." />
              </div>

              <div>
                <label className="text-sm block mb-1">Room</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a room..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infrastruktur">Infrastruktur & Jaringan</SelectItem>
                    <SelectItem value="keamanan">Keamanan Siber</SelectItem>
                    <SelectItem value="pengembangan">Pengembangan Aplikasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="text-sm mb-2">Security Level</div>
                <div className="flex items-center gap-3">
                  <button className="px-4 py-2 rounded-md border bg-white text-sm">Internal L0</button>
                  <button className="px-4 py-2 rounded-md border bg-white text-sm">Restricted L1</button>
                  <button className="px-4 py-2 rounded-md border bg-white text-sm">Confidential L2</button>
                  <button className="px-4 py-2 rounded-md border bg-white text-sm">Critical L3</button>
                </div>
              </div>

              <div>
                <label className="text-sm block mb-1">Labels</label>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100">Urgent</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100">Bug</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100">Enhancement</span>
                </div>
              </div>

              <div>
                <label className="text-sm block mb-1">Deadline (Optional)</label>
                <Input placeholder="mm/dd/yyyy, --:-- --" />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" className="mr-3" onClick={() => navigate(-1)}>Cancel</Button>
              <Button onClick={() => navigate('/topics')}>Next: Add Content</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
