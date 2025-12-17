import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Employment() {
  return (
    <div>
      <Card>
        <CardContent>
          <h3 className="text-lg font-medium mb-4">Employment</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Position / Title</div>
              <Input defaultValue="Dosen" className="mt-1" />
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
              <div className="text-xs text-muted-foreground">Employee ID</div>
              <Input defaultValue="EMP-00123" className="mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
