import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table'
import { auditLogs } from './mocks/data'
import { Download, Sliders, ChevronDown } from 'lucide-react'

export default function AuditPage() {
  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-heading-2 font-semibold">Audit Log</h1>
            <p className="text-body-md text-muted-foreground">Complete activity history and compliance trail</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant={null} className="bg-blue-600 text-white flex items-center gap-2"><Download className="w-4 h-4"/> Export Logs</Button>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1">
            <Input placeholder="Search by entity, action, or actor..." />
          </div>
          <Button variant={null} className="border bg-white"><Sliders className="w-4 h-4" /> Filters</Button>
        </div>

        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TIMESTAMP</TableHead>
                  <TableHead>ACTOR</TableHead>
                  <TableHead>ACTION</TableHead>
                  <TableHead>ENTITY</TableHead>
                  <TableHead>SECURITY</TableHead>
                  <TableHead>DETAILS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm text-muted-foreground">{l.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{l.actor.initials}</AvatarFallback>
                        </Avatar>
                        <div className="text-sm font-medium">{l.actor.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-cyan-100 text-cyan-700">{l.action.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.entity.type}<div className="text-xs text-muted-foreground">{l.entity.id}</div></TableCell>
                    <TableCell><span className="text-xs px-2 py-1 rounded-full bg-rose-50 text-rose-600">{l.security}</span></TableCell>
                    <TableCell className="text-right"><ChevronDown className="w-4 h-4 opacity-60" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
