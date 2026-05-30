import { QueryClient } from '@tanstack/react-query'

// Central QueryClient for the app. You can import this in your root and
// pass it to <QueryClientProvider client={queryClient}>.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

export default queryClient
