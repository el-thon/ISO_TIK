import React from 'react'
import { TabsContent } from '@/components/ui/tabs'

export default function SettingsTab() {
  return (
    <TabsContent value="settings">
      <div className="mt-4 text-muted-foreground">Room settings will appear here (access control, visibility, join code, etc.).</div>
    </TabsContent>
  )
}
