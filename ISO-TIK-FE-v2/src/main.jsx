import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@fontsource/inter/400.css"
import "@fontsource/inter/600.css"
import "@fontsource/inter/700.css"
import './style.css'
import App from './App.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
