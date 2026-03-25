import React, { useState } from 'react'
import { FileText } from 'lucide-react'
import MainLayout from '@/layout/MainLayout'
import Clauses from './Clauses'

export default function AdministrationPage() {
  const [tab, setTab] = useState('clauses')

  const tabs = [
    { key: 'clauses', label: 'Klausul', Icon: FileText },
  ]

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-heading-2 font-semibold">Administrasi</h1>
          <p className="text-body-md text-muted-foreground">Kelola pengaturan sistem dan peran organisasi</p>
        </div>

        <div className="border-b border-slate-100 mb-4">
          <ul className="flex gap-6">
            {tabs.map((t) => {
              const Icon = t.Icon
              return (
                <li key={t.key}>
                  <button
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-2 pb-3 ${
                      tab === t.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-foreground'
                    }`}
                  >
                    <Icon className={`size-4 ${tab === t.key ? 'text-blue-600' : 'text-muted-foreground'}`} />
                    {t.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          {tab === 'clauses' && <Clauses />}
        </div>
      </div>
    </MainLayout>
  )
}
