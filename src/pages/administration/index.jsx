import React, { useMemo, useState } from 'react'
import { FileText, ShieldCheck, Users } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import Clauses from './Clauses'
import TopicDocumentMasters from './TopicDocumentMasters'
import UsersManagementTab from './UsersManagementTab'
import OtpLoginSettings from './OtpLoginSettings'
import { useMe } from '@/hooks/useAuth'
import { getUserData, getUserRoles } from '@/utils/auth'

export default function AdministrationPage() {
  const { data: meData } = useMe({ staleTime: 60_000 })
  const currentUser = meData?.data?.user ?? meData ?? getUserData()
  const roles = getUserRoles(currentUser)
  const isAdmin = roles.includes('admin') || roles.includes('super_admin')

  const [tab, setTab] = useState('clauses')

  const tabs = [
    { key: 'clauses', label: 'Klausul', Icon: FileText },
    { key: 'masters', label: 'Dokumen Header', Icon: FileText },
    { key: 'users', label: 'Manajemen Pengguna', Icon: Users },
    ...(isAdmin ? [{ key: 'otp-login', label: 'OTP Login', Icon: ShieldCheck }] : []),
  ]

  const safeTab = useMemo(() => {
    return tabs.some((item) => item.key === tab) ? tab : 'clauses'
  }, [tab, tabs])

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-heading-2 font-semibold">Administrasi</h1>
          <p className="text-body-md text-muted-foreground">Kelola pengaturan sistem dan peran organisasi</p>
        </div>

        <div className="border-b border-slate-100 mb-4 overflow-x-auto">
          <ul className="flex gap-6 min-w-max">
            {tabs.map((t) => {
              const Icon = t.Icon
              return (
                <li key={t.key}>
                  <button
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 pb-3 ${
                      safeTab === t.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-foreground'
                    }`}
                  >
                    <Icon className={`size-4 ${safeTab === t.key ? 'text-blue-600' : 'text-muted-foreground'}`} />
                    {t.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          {safeTab === 'clauses' && <Clauses />}
          {safeTab === 'masters' && <TopicDocumentMasters />}
          {safeTab === 'users' && <UsersManagementTab />}
          {safeTab === 'otp-login' && isAdmin && <OtpLoginSettings />}
        </div>
      </div>
    </MainLayout>
  )
}
