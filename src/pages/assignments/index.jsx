import React, { useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import AssignedToMe from './AssignedToMe'
import AssignedByMe from './AssignedByMe'
import AllAssignments from './AllAssignments'
import { sampleAssignments, currentUser } from './mocks/data'

export default function AssignmentsPage() {
  const [tab, setTab] = useState('assigned')

  const counts = {
    assigned: sampleAssignments.filter((a) => a.to.email === currentUser.email).length,
    assigned_by: sampleAssignments.filter((a) => a.from.email === currentUser.email).length,
    all: sampleAssignments.length,
  }

  const tabs = [
    { key: 'assigned', label: 'Assigned to Me', count: counts.assigned },
    { key: 'assigned_by', label: 'Assigned by Me', count: counts.assigned_by },
    { key: 'all', label: 'All Assignments', count: counts.all },
  ]

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-heading-2 font-semibold">Assignments</h1>
          <p className="text-body-md text-muted-foreground">Track all topic assignments and routing</p>
        </div>

        <div className="border-b border-slate-100">
          <ul className="flex gap-6">
            {tabs.map((t) => (
              <li key={t.key}>
                <button
                  onClick={() => setTab(t.key)}
                  className={`pb-3 ${tab === t.key ? 'text-blue-600 border-b-2 border-blue-600' : 'text-foreground'} `}
                >
                  {t.label} ({t.count})
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4">
          {tab === 'assigned' && <AssignedToMe />}
          {tab === 'assigned_by' && <AssignedByMe />}
          {tab === 'all' && <AllAssignments />}
        </div>
      </div>
    </MainLayout>
  )
}
