import { RouterProvider } from 'react-router-dom'
import router from './router.client'
import { Toaster } from './components/ui/toaster'

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  )
}

export default App
