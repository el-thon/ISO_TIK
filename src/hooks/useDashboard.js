import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'
import { listForumPeriods, listForumPeriodForums } from '@/services/forumPeriodService'
import { listTopics } from '@/services/topicService'

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
    queryKey: ['period'],
    queryFn: async () => {
      const response = await listForumPeriods({ per_page: 100 })
      return response?.periods || []
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

export const useDashboardData = ({ findingType } = {}) => {
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users', 'list', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/users', { params: { per_page: 100 } })
      return res.data?.data || res.data || {}
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['dashboard', 'statistics', 'dashboard', { findingType: findingType ?? null }],
    queryFn: async () => {
      const res = await api.get('/dashboard/statistics', {
        params: {
          finding_type: findingType || undefined,
        },
      })
      return res.data?.data || {}
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: periodsResp, isLoading: periodsLoading, error: periodsError } = useQuery({
    queryKey: ['forumPeriods', 'list', 'dashboard'],
    queryFn: async () => {
      const periodsResult = await listForumPeriods({ per_page: 100 })
      const rawPeriods = ensureArray(periodsResult?.periods)

      const periodsWithForums = await Promise.all(
        rawPeriods.map(async (period) => {
          try {
            const forumResp = await listForumPeriodForums(period.id, { per_page: 100 })

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
            const status = error?.response?.status
            if (status !== 401 && status !== 403) {
              console.error(`Gagal mengambil forum untuk period ${period.id}`, error)
            }

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
    queryFn: async () => {
      try {
        return await listTopics({ per_page: 100 })
      } catch (error) {
        const status = error?.response?.status
        if (status === 401 || status === 403) {
          return { topics: [] }
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const { data: adminMasters, isLoading: adminMastersLoading, error: adminMastersError } = useQuery({
    queryKey: ['adminTopicDocumentMasters', 'dashboard'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/topic-document-masters')
        return res.data?.data || res.data || []
      } catch (error) {
        // Endpoint ini memang khusus admin/product_owner; untuk member dashboard tetap harus bisa tampil.
        const status = error?.response?.status
        if (status === 401 || status === 403) {
          return []
        }
        throw error
      }
    },
    staleTime: 5 * 60 * 1000,
  })

  const usersArray = ensureArray(usersData?.users)
  const topicsArray = ensureArray(topicsData?.topics)
  const periodsRaw = ensureArray(periodsResp?.periods)
  const documentMasterArray = ensureArray(adminMasters)
  const statsForumsPerRoom = ensureArray(statsData?.statistics?.forums_per_room)
  const statsDiscrepancyFormsPerForum = ensureArray(statsData?.statistics?.discrepancy_forms_per_forum)

  const discrepancyFormsPerForumArray = statsDiscrepancyFormsPerForum.map((item, index) => ({
    id: item?.forum_id || `forum-${index}`,
    forum_id: item?.forum_id || null,
    forum_name: item?.forum_name || `Forum ${index + 1}`,
    room_id: item?.room_id || null,
  room_name: item?.room_name || 'No Period',
    forum_created_at: item?.forum_created_at || null,
    total_discrepancy_forms: Number(item?.total_discrepancy_forms || 0),
  }))

  const statsForumsPerRoomMap = new Map(
    statsForumsPerRoom
      .filter((item) => item?.room_id)
      .map((item) => [String(item.room_id), Number(item?.total_forum || 0)])
  )

  const statsForumsByRoomMap = statsDiscrepancyFormsPerForum.reduce((acc, item) => {
    const roomId = item?.room_id ? String(item.room_id) : null
    if (!roomId) return acc

    const roomForums = acc.get(roomId) || []
    roomForums.push({
      id: item?.forum_id,
      name: item?.forum_name || 'Forum',
      created_at: item?.forum_created_at || null,
      topics_count: Number(item?.total_discrepancy_forms || 0),
      formulir_count: Number(item?.total_discrepancy_forms || 0),
      total_discrepancy_forms: Number(item?.total_discrepancy_forms || 0),
    })
    acc.set(roomId, roomForums)
    return acc
  }, new Map())

  const usersSummaryFromStats = statsData?.statistics?.users || statsData?.users || null

  const normalizeUserStatus = (user) =>
    String(user?.status || user?.user?.status || 'active')
      .toLowerCase()
      .trim()

  const isActiveStatus = (status) => ['active', 'activated'].includes(status)

  const userStats = {
    total: Number(usersSummaryFromStats?.total ?? usersArray.length),
    active: Number(
      usersSummaryFromStats?.active ?? usersArray.filter((u) => isActiveStatus(normalizeUserStatus(u))).length
    ),
    inactive: Number(
      usersSummaryFromStats?.inactive ?? usersArray.filter((u) => !isActiveStatus(normalizeUserStatus(u))).length
    ),
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

  const topicsByForum = topicsArray.reduce((acc, topic) => {
    const forumId =
      topic?.forum_id ||
      topic?.forumId ||
      topic?.forum?.id ||
      null

    if (!forumId) return acc
    if (!acc[forumId]) acc[forumId] = []
    acc[forumId].push(topic)
    return acc
  }, {})

  const periodsArray = periodsRaw.map((period) => {
    const periodId = period?.id ? String(period.id) : null
    const childForumsRaw = ensureArray(period?.forums)
    const childForumsFromStats = periodId ? (statsForumsByRoomMap.get(periodId) || []) : []
    const childForumsSource = childForumsFromStats.length > 0 ? childForumsFromStats : childForumsRaw

    const childForums = childForumsSource.map((forum) => {
      const forumTopics = topicsByForum[forum?.id] || []
      const countedFromStats = Number(forum?.total_discrepancy_forms || 0)
      const countedFromForum = Number(forum?.topics_count || forum?.formulir_count || forum?.document_count || 0)
      const countedFromTopics = forumTopics.length
      const resolvedCount = Math.max(countedFromStats, countedFromForum, countedFromTopics)

      return {
        ...forum,
        created_at: forum?.created_at || forum?.createdAt || null,
        formulir_count: resolvedCount,
        topics_count: resolvedCount,
      }
    })
    const topicsForPeriod = topicsByPeriod[period.id] || []

    const statsTotalChildForums = periodId ? statsForumsPerRoomMap.get(periodId) : undefined

    const totalChildForums = Number.isFinite(statsTotalChildForums)
      ? Number(statsTotalChildForums)
      : Number(period?.forums_count || childForums.length || 0)

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
      start_date: period?.start_date || null,
      end_date: period?.end_date || null,
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
    discrepancyFormsPerForumArray,
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
