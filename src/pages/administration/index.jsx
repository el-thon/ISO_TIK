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
      <div className="w-full max-w-full mx-auto px-0 py-4 sm:px-4 sm:py-6 lg:px-6">
        <div className="mb-6">
          <h1 className="text-heading-2 font-semibold">Administrasi</h1>
          <p className="text-body-md text-muted-foreground">Kelola pengaturan sistem dan peran organisasi</p>
        </div>

        <div className="mb-4 overflow-x-auto border-b border-slate-100">
          <ul className="flex min-w-max gap-3 sm:gap-6">
            {tabs.map((t) => {
              const Icon = t.Icon
              return (
                <li key={t.key}>
                  <button
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 whitespace-nowrap px-1 pb-3 text-sm sm:text-base ${
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

        <div className="min-w-0">
          {safeTab === 'clauses' && <Clauses />}
          {safeTab === 'masters' && <TopicDocumentMasters />}
          {safeTab === 'users' && <UsersManagementTab />}
          {safeTab === 'otp-login' && isAdmin && <OtpLoginSettings />}
        </div>
      </div>
    </MainLayout>
  )
}
