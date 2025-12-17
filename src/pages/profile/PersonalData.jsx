import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function PersonalData() {
  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">Personal Data</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">First Name</div>
              <Input defaultValue="Budi" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Last Name</div>
              <Input defaultValue="Santoso" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Gender</div>
              <Select defaultValue="male">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Birth Place</div>
              <Input defaultValue="Jakarta" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Birth Date</div>
              <Input defaultValue="01/01/1980" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Marital Status</div>
              <Select defaultValue="single">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <hr className="my-6" />

          <h4 className="font-medium mb-2">Contact Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Phone Number</div>
              <Input defaultValue="+62812345678" className="mt-1" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Personal Email</div>
              <Input defaultValue="budi@gmail.com" className="mt-1" />
            </div>
          </div>

          <hr className="my-6" />

          <h4 className="font-medium mb-2">Address</h4>
          <div className="space-y-4">
            <div>
              <div className="text-xs text-muted-foreground">Address Line 1</div>
              <Input defaultValue="Jl. Sudirman No. 123" className="mt-1" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Address Line 2</div>
              <Input defaultValue="RT 001 / RW 005" className="mt-1" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-muted-foreground">City</div>
                <Input defaultValue="Jakarta" className="mt-1" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Province</div>
                <Input defaultValue="DKI Jakarta" className="mt-1" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Postal Code</div>
                <Input defaultValue="12345" className="mt-1" />
              </div>
            </div>
          </div>

          <hr className="my-6" />

          <h4 className="font-medium mb-2">Government IDs (Sensitive)</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">National ID (NIK)</div>
              <Input defaultValue="••••••••••••••••" className="mt-1" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Tax ID (NPWP)</div>
              <Input defaultValue="••••••••••••" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs text-muted-foreground">Passport Number</div>
              <Input placeholder="Optional" className="mt-1" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">BPJS Number</div>
              <Input placeholder="Optional" className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
