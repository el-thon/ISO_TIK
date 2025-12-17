import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Employment() {
  return (
    <div>
      <Card>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium">Employment</h3>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Edit
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Employee ID (NIP)</div>
              <Input defaultValue="198001012005011001" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Lecturer ID (NIDN/NIDK)</div>
              <Input defaultValue="0001019801" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Faculty</div>
              <Input defaultValue="Fakultas Teknik" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Department</div>
              <Input defaultValue="Teknik Informatika" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Unit</div>
              <Input defaultValue="Direktorat TIK" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Office Location</div>
              <Input defaultValue="Gedung Rektorat Lt. 3" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Functional Position</div>
              <Select defaultValue="asisten">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asisten">Asisten Ahli</SelectItem>
                  <SelectItem value="lektor">Lektor</SelectItem>
                  <SelectItem value="gurubesar">Guru Besar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Employment Status</div>
              <Select defaultValue="permanent">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Start Date</div>
              <Input defaultValue="01/01/2005" className="mt-1" />
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Highest Education</div>
              <Select defaultValue="s1">
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s1">S1 - Bachelor</SelectItem>
                  <SelectItem value="s2">S2 - Master</SelectItem>
                  <SelectItem value="s3">S3 - Doctorate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
