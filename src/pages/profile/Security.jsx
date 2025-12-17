import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Security() {
  return (
    <div>
      <Card>
        <CardContent>
          <h3 className="text-lg font-medium mb-4">Security & Privacy</h3>

          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Two-factor Authentication</div>
              <div className="mt-1 text-sm text-muted-foreground">Not enabled</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Password</div>
              <Input placeholder="Change password" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Account Visibility</div>
              <div className="mt-1 text-sm text-muted-foreground">Public</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
