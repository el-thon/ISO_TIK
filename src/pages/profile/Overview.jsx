import React from 'react'
import { Card, CardContent } from '@/components/ui/card'

export default function Overview() {
  return (
    <div>
      <Card>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted-foreground">Full Name</div>
              <div className="font-medium">Dr. Budi Santoso, M.Kom.</div>

              <div className="mt-4 text-xs text-muted-foreground">Institutional Email</div>
              <div className="font-medium">budi.santoso@university.ac.id</div>

              <div className="mt-4 text-xs text-muted-foreground">Phone Number</div>
              <div className="font-medium">+62812345678</div>

              <div className="mt-4 text-xs text-muted-foreground">Department</div>
              <div className="font-medium">Teknik Informatika</div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground">Username</div>
              <div className="font-medium">budi.santoso</div>

              <div className="mt-4 text-xs text-muted-foreground">Personal Email</div>
              <div className="font-medium">budi@gmail.com</div>

              <div className="mt-4 text-xs text-muted-foreground">Faculty</div>
              <div className="font-medium">Fakultas Teknik</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
