import React, { useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import AssignedToMe from './AssignedToMe'
import AssignedByMe from './AssignedByMe'
import AllAssignments from './AllAssignments'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTopics } from '@/services/topicHooks'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua status' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'changes_requested', label: 'Changes Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'closed', label: 'Closed' },
]

const PER_PAGE = 8

export default function AssignmentsPage() {
  const [tab, setTab] = useState('assigned')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [tabPages, setTabPages] = useState({ assigned: 1, assigned_by: 1, all: 1 })

  const commonFilters = useMemo(
    () => ({
      per_page: PER_PAGE,
      search: search.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
    }),
    [search, statusFilter]
  )

  const assignedParams = useMemo(
    () => ({
      ...commonFilters,
      page: tabPages.assigned,
      assigned_to_me: true,
    }),
    [commonFilters, tabPages.assigned]
  )

  const assignedByParams = useMemo(
    () => ({
      ...commonFilters,
      page: tabPages.assigned_by,
      created_by_me: true,
    }),
    [commonFilters, tabPages.assigned_by]
  )

  const allParams = useMemo(
    () => ({
      ...commonFilters,
      page: tabPages.all,
    }),
    [commonFilters, tabPages.all]
  )

  const assignedQuery = useTopics(assignedParams, { keepPreviousData: true })
  const assignedByQuery = useTopics(assignedByParams, { keepPreviousData: true })
  const allQuery = useTopics(allParams, { keepPreviousData: true })

  const counts = {
    assigned: assignedQuery.isLoading && !assignedQuery.data ? '…' : assignedQuery.data?.pagination?.total ?? 0,
    assigned_by: assignedByQuery.isLoading && !assignedByQuery.data ? '…' : assignedByQuery.data?.pagination?.total ?? 0,
    all: allQuery.isLoading && !allQuery.data ? '…' : allQuery.data?.pagination?.total ?? 0,
  }

  const tabs = [
    { key: 'assigned', label: 'Assigned to Me', count: counts.assigned },
    { key: 'assigned_by', label: 'Assigned by Me', count: counts.assigned_by },
    { key: 'all', label: 'All Assignments', count: counts.all },
  ]

  const handlePageChange = (key, value) => {
    setTabPages((prev) => ({ ...prev, [key]: Math.max(1, value) }))
  }

  const resetPagination = () => {
    setTabPages({ assigned: 1, assigned_by: 1, all: 1 })
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-heading-2 font-semibold">Assignments</h1>
          <p className="text-body-md text-muted-foreground">Pantau seluruh jobdesk topik berdasarkan status penugasan.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <div className="md:col-span-2">
            <Label htmlFor="assignment-search" className="text-sm text-muted-foreground">
              Cari berdasarkan judul atau deskripsi
            </Label>
            <Input
              id="assignment-search"
              placeholder="Contoh: Upgrade Firewall"
              className="mt-2"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                resetPagination()
              }}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Status topik</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                resetPagination()
              }}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Semua status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          {tab === 'assigned' && (
            <AssignedToMe
              query={assignedQuery}
              page={tabPages.assigned}
              perPage={PER_PAGE}
              onPageChange={(nextPage) => handlePageChange('assigned', nextPage)}
            />
          )}
          {tab === 'assigned_by' && (
            <AssignedByMe
              query={assignedByQuery}
              page={tabPages.assigned_by}
              perPage={PER_PAGE}
              onPageChange={(nextPage) => handlePageChange('assigned_by', nextPage)}
            />
          )}
          {tab === 'all' && (
            <AllAssignments
              query={allQuery}
              page={tabPages.all}
              perPage={PER_PAGE}
              onPageChange={(nextPage) => handlePageChange('all', nextPage)}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}
