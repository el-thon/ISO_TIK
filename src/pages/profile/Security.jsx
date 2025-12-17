import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

export default function Security() {
  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium">Security & Privacy</h3>
            <Button variant="outline" size="sm">Change</Button>
          </div>

          <div className="space-y-6">
            {/* Password */}
            <div>
              <div className="text-xs text-muted-foreground">Password</div>
              <div className="mt-2">
                <Button variant="outline">Change Password</Button>
              </div>
            </div>

            {/* Two-factor Authentication */}
            <div>
              <div className="text-sm font-medium">Two-Factor Authentication</div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">2FA Status</div>
                  <div className="text-sm text-muted-foreground">Add an extra layer of security</div>
                </div>
                <div>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700">Not Enabled</span>
                </div>
              </div>

              <div className="mt-3">
                <Button className="bg-blue-600 text-white">Enable 2FA</Button>
              </div>
            </div>

            {/* Data Classification */}
            <div>
              <div className="text-sm font-medium mb-3">Data Classification</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">PII Sensitivity</div>
                  <Select defaultValue="low">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="text-xs text-muted-foreground">Data Classification</div>
                  <Select defaultValue="public">
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="internal">Internal</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <div className="text-sm font-medium mb-3">Notification Preferences</div>
              <div className="flex flex-col gap-3">
                <label className="inline-flex items-center gap-3">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Email notifications for assignments</span>
                </label>

                <label className="inline-flex items-center gap-3">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Email notifications for comments</span>
                </label>

                <label className="inline-flex items-center gap-3">
                  <Checkbox defaultChecked />
                  <span className="text-sm">Email notifications for security alerts (L2+)</span>
                </label>

                <label className="inline-flex items-center gap-3">
                  <Checkbox />
                  <span className="text-sm">Daily digest summary</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
