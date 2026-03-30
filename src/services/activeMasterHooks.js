import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export function useActiveDocumentMaster(options = {}) {
  return useQuery({
    queryKey: ['topicDocumentMaster', 'active'],
    queryFn: async () => {
      const res = await api.get('/topic-document-masters/active')
      return res?.data?.data ?? res?.data ?? null
    },
    staleTime: 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000,
    retry: 1,
    // keep data fresh when user returns to tab or reconnects
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    ...options,
  })
}

export default useActiveDocumentMaster
