import React from 'react'
import MainLayout from '@/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-heading-1 font-semibold">Selamat Datang, Dr. Budi Santoso</h1>
          <p className="text-body-md text-muted-foreground">Berikut adalah ringkasan aktivitas sistem Anda hari ini.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <Card className="bg-blue-light">
              <CardHeader>
                <CardTitle>My Assignments</CardTitle>
                <CardDescription>0</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div>
            <Card className="bg-yellow-50">
              <CardHeader>
                <CardTitle>Needs Attention</CardTitle>
                <CardDescription>3</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div>
            <Card className="bg-red-50">
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
                <CardDescription>2</CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div>
            <Card className="bg-green-50">
              <CardHeader>
                <CardTitle>Total Topics</CardTitle>
                <CardDescription>6</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-navy text-white">+ Create Group</Button>
                <Button className="bg-navy text-white">+ Create Room</Button>
                <Button className="bg-navy text-white">+ New Submission</Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>My Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 text-center text-muted-foreground">No pending assignments</div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Topics Needing Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-3">
                  <li className="p-3 bg-slate-50 rounded">Upgrade Firewall Sistem Utama</li>
                  <li className="p-3 bg-slate-50 rounded">Maintenance Server Database</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </MainLayout>
  )
}
