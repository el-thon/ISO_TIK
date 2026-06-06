import { useQuery } from '@tanstack/react-query'
import api from '@/services/api'

export function useActiveDocumentMaster(options = {}) {
  return useQuery({
    queryKey: ['topicDocumentMaster', 'active'],
    queryFn: async () => {
      const res = await api.get('/topic-document-masters/active')
      const payload = res?.data ?? null
      const master = payload?.data ?? payload?.topic_document_master ?? payload?.master ?? payload
      if (!master || (!master.id && !master.document_number && !master.published_at && !master.revision_number)) {
        return null
      }
      return master
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
