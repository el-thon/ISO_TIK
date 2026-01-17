import React, { useMemo, useState } from 'react'
import MainLayout from '@/layout/MainLayout'
import AssignedToMe from './AssignedToMe'
import AssignedByMe from './AssignedByMe'
import AllAssignments from './AllAssignments'
import AssignmentCreateDialog from './AssignmentCreateDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAssignments } from '@/services/assignmentsHooks'
import { useMe } from '@/services/authHooks'

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
  const [page, setPage] = useState(1)
  const { data: meData } = useMe({ staleTime: 1000 * 60 * 5 })
  const currentUser = meData?.data?.user ?? meData?.user ?? meData ?? null

  const commonFilters = useMemo(
    () => ({
      per_page: PER_PAGE,
      search: search.trim() || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      page,
    }),
    [search, statusFilter, page]
  )

  const baseQuery = useAssignments(commonFilters)

  const filteredAssignments = useMemo(() => {
    const list = baseQuery.data?.assignments ?? []
    if (!currentUser?.id) {
      return {
        assignedToMe: list,
        assignedByMe: list,
        all: list,
      }
    }

    const assignedToMe = list.filter((item) => item.to_user_id === currentUser.id)
    const assignedByMe = list.filter((item) => item.from_user_id === currentUser.id)
    return {
      assignedToMe,
      assignedByMe,
      all: list,
    }
  }, [baseQuery.data?.assignments, currentUser?.id])

  const counts = {
    assigned: baseQuery.isLoading && !baseQuery.data ? '…' : filteredAssignments.assignedToMe.length,
    assigned_by: baseQuery.isLoading && !baseQuery.data ? '…' : filteredAssignments.assignedByMe.length,
    all: baseQuery.isLoading && !baseQuery.data ? '…' : filteredAssignments.all.length,
  }

  const tabs = [
    { key: 'assigned', label: 'Assigned to Me', count: counts.assigned },
    { key: 'assigned_by', label: 'Assigned by Me', count: counts.assigned_by },
    { key: 'all', label: 'All Assignments', count: counts.all },
  ]

  const handlePageChange = (value) => {
    setPage(Math.max(1, value))
  }

  const resetPagination = () => {
    setPage(1)
  }

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-heading-2 font-semibold">Assignments</h1>
            <p className="text-body-md text-muted-foreground">Pantau seluruh jobdesk topik berdasarkan status penugasan.</p>
          </div>
          <AssignmentCreateDialog />
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
              query={{ ...baseQuery, data: baseQuery.data ? { ...baseQuery.data, assignments: filteredAssignments.assignedToMe } : baseQuery.data }}
              page={page}
              perPage={PER_PAGE}
              onPageChange={(nextPage) => handlePageChange(nextPage)}
              currentUser={currentUser}
            />
          )}
          {tab === 'assigned_by' && (
            <AssignedByMe
              query={{ ...baseQuery, data: baseQuery.data ? { ...baseQuery.data, assignments: filteredAssignments.assignedByMe } : baseQuery.data }}
              page={page}
              perPage={PER_PAGE}
              onPageChange={(nextPage) => handlePageChange(nextPage)}
              currentUser={currentUser}
            />
          )}
          {tab === 'all' && (
            <AllAssignments
              query={{ ...baseQuery, data: baseQuery.data ? { ...baseQuery.data, assignments: filteredAssignments.all } : baseQuery.data }}
              page={page}
              perPage={PER_PAGE}
              onPageChange={(nextPage) => handlePageChange(nextPage)}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>
    </MainLayout>
  )
}
