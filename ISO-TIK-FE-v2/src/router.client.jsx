import React from 'react'
import { createBrowserRouter } from 'react-router-dom'
import RootRedirect from './routes/RootRedirect'
import Login from './pages/auth/index'
import Dashboard from './pages/dashboard'
import CreateFormulir from './pages/formulir/CreateFormulir'
import FormulirDetail from './pages/formulir/detail'
import Profile from './pages/profile'
import Administration from './pages/administration'
import PeriodePage from './pages/periode'
import ForumsPage from './pages/forums'
import ForumDetailPage from './pages/forums/detail'
import NotFound from './pages/not-found'
import ProtectedRoute from '@/routes/ProtectedRoute'

export const router = createBrowserRouter(
  [
    { path: '/', element: <RootRedirect /> },
    { path: '/login', element: <Login /> },
    { path: '/beranda', element: (<ProtectedRoute><Dashboard /></ProtectedRoute>) },
    { path: '/forum', element: (<ProtectedRoute><ForumsPage /></ProtectedRoute>) },
    { path: '/forum/:id', element: (<ProtectedRoute><ForumDetailPage /></ProtectedRoute>) },
    { path: '/period', element: (<ProtectedRoute><PeriodePage /></ProtectedRoute>) },
    { path: '/administrasi', element: (<ProtectedRoute requireAdmin><Administration /></ProtectedRoute>) },
    { path: '/formulir/:id', element: (<ProtectedRoute><FormulirDetail /></ProtectedRoute>) },
    { path: '/formulir/buat', element: (<ProtectedRoute><CreateFormulir /></ProtectedRoute>) },
    { path: '/profil', element: (<ProtectedRoute><Profile /></ProtectedRoute>) },
    { path: '*', element: <NotFound /> },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
)

export default router
