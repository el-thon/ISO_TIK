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

// Debug: expose a small runtime check so we can see in the browser console whether
// the QueryClient instance has the expected methods (helps diagnose mismatched versions).
try {
  // eslint-disable-next-line no-console
  console.debug('queryClient.constructor.name=', queryClient.constructor?.name)
  // eslint-disable-next-line no-console
  console.debug('queryClient.keys=', Object.keys(queryClient))
  // eslint-disable-next-line no-console
  console.debug('queryClient.defaultMutationOptions=', typeof queryClient.defaultMutationOptions)
} catch (e) {
  // eslint-disable-next-line no-console
  console.debug('queryClient debug error', e)
}

export default queryClient
