import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import Login from './pages/auth/index'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard'
import NotFound from './pages/not-found'

export const router = createBrowserRouter(
  [
  { path: '/auth', element: <Login /> },
  { path: '/', element: <Dashboard /> },
  { path: '/auth/forgot', element: <ForgotPassword /> },
    { path: '*', element: <NotFound /> },
  ],
  {
    future: { v7_startTransition: true },
  },
)

export default router
