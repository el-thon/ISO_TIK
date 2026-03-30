import { useQuery } from '@tanstack/react-query'
import api from './api'
import { listUsers, getStatistics as getUserStatistics } from './adminUsersService'
import { listForumPeriods, listForumPeriodForums } from './forumPeriodService'
import { listTopics } from './topicService'

const ensureArray = (data) => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (data.data && Array.isArray(data.data)) return data.data
  if (data.items && Array.isArray(data.items)) return data.items
  if (data.documents && Array.isArray(data.documents)) return data.documents
  return []
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats')
      return response.data?.data || {}
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useForumPeriods = () => {
  return useQuery({
    queryKey: ['forum-periods'],
    queryFn: async () => {
      const response = await api.get('/forum-periods')
      return response.data?.data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useChildForumDetails = (childId) => {
  return useQuery({
    queryKey: ['child-forum', childId, 'details'],
    queryFn: async () => {
      if (!childId) return null
      const response = await api.get(`/child-forums/${childId}/discrepancy-forms`)
      return response.data?.data || null
    },
    enabled: !!childId,
    staleTime: 2 * 60 * 1000,
  })
}

export const useDashboardData = () => {
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', 'list', 'dashboard'],
    queryFn: () => listUsers({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['users', 'statistics', 'dashboard'],
    queryFn: () => getUserStatistics(),
    staleTime: 5 * 60 * 1000,
  })

  const { data: periodsResp, isLoading: periodsLoading, error: periodsError } = useQuery({
    queryKey: ['forumPeriods', 'list', 'dashboard'],
    queryFn: async () => {
      const periodsResult = await listForumPeriods({ per_page: 1000 })
      const rawPeriods = ensureArray(periodsResult?.periods)

      const periodsWithForums = await Promise.all(
        rawPeriods.map(async (period) => {
          try {
            const forumResp = await listForumPeriodForums(period.id, { per_page: 1000 })

            const forums = ensureArray(forumResp?.forums).map((forum) => ({
              ...forum,
              created_at: forum?.created_at || forum?.createdAt || null,
              topics_count: Number(forum?.topics_count || forum?.document_count || 0),
              formulir_count: Number(forum?.topics_count || forum?.document_count || 0),
            }))

            return {
              ...period,
              created_at: period?.created_at || period?.createdAt || null,
              forums,
              forums_count: forums.length,
            }
          } catch (error) {
            console.error(`Gagal mengambil forum untuk period ${period.id}`, error)

            return {
              ...period,
              created_at: period?.created_at || period?.createdAt || null,
              forums: [],
              forums_count: 0,
            }
          }
        })
      )

      return { periods: periodsWithForums }
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: topicsData, isLoading: topicsLoading, error: topicsError } = useQuery({
    queryKey: ['topics', 'list', 'dashboard'],
    queryFn: () => listTopics({ per_page: 1000 }),
    staleTime: 5 * 60 * 1000,
  })

  const { data: adminMasters, isLoading: adminMastersLoading, error: adminMastersError } = useQuery({
    queryKey: ['adminTopicDocumentMasters', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/topic-document-masters')
      return res.data?.data || res.data || []
    },
    staleTime: 5 * 60 * 1000,
  })

  const usersArray = ensureArray(usersData?.users)
  const topicsArray = ensureArray(topicsData?.topics)
  const periodsRaw = ensureArray(periodsResp?.periods)
  const documentMasterArray = ensureArray(adminMasters)

  const userStats = {
    total: usersArray.length,
    active: usersArray.filter(
      (u) => u.status === 'active' || u.status === 'activated'
    ).length,
    inactive: usersArray.filter(
      (u) => u.status !== 'active' && u.status !== 'activated'
    ).length,
  }

  const topicsByPeriod = topicsArray.reduce((acc, topic) => {
    let periodId = null

    if (topic?.forum && (topic.forum?.forum_period_id || topic.forum?.forumPeriodId)) {
      periodId = topic.forum.forum_period_id || topic.forum.forumPeriodId
    }

    periodId = periodId || topic?.forum_period_id || topic?.forumPeriodId || null

    if (!periodId) return acc

    if (!acc[periodId]) acc[periodId] = []
    acc[periodId].push(topic)
    return acc
  }, {})

  const periodsArray = periodsRaw.map((period) => {
    const childForums = ensureArray(period?.forums)
    const topicsForPeriod = topicsByPeriod[period.id] || []

    const totalChildForums = Number(period?.forums_count || childForums.length || 0)

    const totalFormulirFromForums = childForums.reduce((sum, forum) => {
      return sum + Number(forum?.topics_count || forum?.formulir_count || 0)
    }, 0)

    const totalFormulirFromTopics = topicsForPeriod.length
    const totalFormulir = Math.max(totalFormulirFromForums, totalFormulirFromTopics)

    return {
      id: period?.id,
      name: period?.name,
      description: period?.description || null,
      status: period?.status,
      created_at: period?.created_at || period?.createdAt || null,
      forums_count: totalChildForums,
      formulir_count: totalFormulir,
      forums: childForums,
    }
  })

  const isLoading =
    usersLoading ||
    statsLoading ||
    periodsLoading ||
    topicsLoading ||
    adminMastersLoading

  const error =
    usersError ||
    statsError ||
    periodsError ||
    topicsError ||
    adminMastersError

  return {
    usersData: usersArray,
    userStats,
    statsData,
    periodsArray,
    documentMasterArray,
    isLoading,
    error,
  }
}

export default {
  useDashboardStats,
  useForumPeriods,
  useChildForumDetails,
  useDashboardData,
}