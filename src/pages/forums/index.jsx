import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import MainLayout from '@/layout/MainLayout'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import api from '@/services/api'
import { getUserData, getUserRoles, isProductOwnerUser } from '@/utils/auth'
import { MessageSquare, Users, Lock, Archive, RefreshCcw } from 'lucide-react'

const normalizeArray = (value) => (Array.isArray(value) ? value : value ? [value] : [])

const toNumber = (value, fallback = 0) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export default function ForumsPage() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['forums', 'list', 'ui'],
    queryFn: async () => {
      const response = await api.get('/forums', { params: { per_page: 1000 } })
      const payload = response?.data?.data ?? response?.data ?? {}
      const rawForums = normalizeArray(
        payload?.forums ?? payload?.items ?? payload?.data ?? payload?.results ?? payload?.list ?? []
      )

      const currentUser = getUserData()
      const isProductOwner = isProductOwnerUser(currentUser)
      const roles = getUserRoles(currentUser)
      const shouldFilterByRelation =
        !isProductOwner &&
        (roles.includes('member') || roles.includes('admin') || roles.includes('administrator'))

      const visible = rawForums
        .map((forum) => ({
          ...forum,
          participant_count: toNumber(forum?.participant_count, 0),
          topics_count: toNumber(forum?.topics_count ?? forum?.formulir_count, 0),
        }))
        .filter((f) => {
        if (!shouldFilterByRelation) return true
        if (f?.is_related === false) return false
  const relationRole = f?.current_user_role ?? f?.user_role
  if (relationRole && String(relationRole).toLowerCase() === 'outsider') return false
        return true
        })

      return { forums: visible }
    },
    staleTime: 30_000,
  })

  const forums = data?.forums ?? []

  return (
    <MainLayout>
      <div className="max-w-full mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-heading-2 font-semibold">Forum</h1>
          <p className="text-body-md text-muted-foreground">Forum Anda.</p>
        </div>

        {isError && (
          <div className="mb-4 p-4 rounded-md bg-rose-50 border border-rose-100 text-sm text-rose-700 flex items-center justify-between gap-2">
            <span>{error?.response?.data?.message || error?.message || 'Gagal memuat daftar forum.'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Coba lagi
            </Button>
          </div>
        )}

        {isLoading ? (
          <ForumListSkeleton />
        ) : forums.length === 0 ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
            Anda belum masuk forum.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {forums.map((forum) => (
              <Card key={forum.id} className="transition-shadow hover:shadow-md">
                <Link to={`/forum/${forum.id}`} className="block no-underline text-inherit">
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-base md:text-lg text-slate-800 truncate">{forum.name}</div>
                          {forum.is_locked && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                              <Lock className="w-3 h-3" /> Locked
                            </span>
                          )}
                          {forum.is_archived && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 inline-flex items-center gap-1">
                              <Archive className="w-3 h-3" /> Archived
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{forum.description || 'Belum ada deskripsi'}</p>
                        {forum?.period_name && (
                          <p className="text-xs text-muted-foreground mt-1">Periode: {forum.period_name}</p>
                        )}
                        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                            <Users className="w-3 h-3" /> {forum.participant_count ?? 0} peserta
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                            <MessageSquare className="w-3 h-3" /> {forum.topics_count ?? 0} formulir
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}

function ForumListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx}>
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
