import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootRedirect from './routes/RootRedirect'
// Perbaikan: Import langsung dari file Login.jsx, bukan dari index.jsx
import Login from './pages/auth/index'
import Dashboard from './pages/dashboard'
import CreateTopic from './pages/topics/CreateTopic'
import TopicDetail from './pages/topics/detail'
import Profile from './pages/profile'
import Administration from './pages/administration'
import PeriodePage from './pages/periode'
import ForumsPage from './pages/forums'
import ForumDetailPage from './pages/forums/detail'
import NotFound from './pages/not-found'
import ProtectedRoute from '@/routes/ProtectedRoute'

// Opsional: Jika ada SSO callback yang akan diaktifkan nanti
// import SsoCallback from './pages/auth/SsoCallback'

export const router = createBrowserRouter(
  [
    { path: '/', element: <RootRedirect /> },
    { path: '/login', element: <Login /> },
    // { path: '/login/sso', element: <SsoCallback /> }, // SSO sementara dinonaktifkan
    { path: '/beranda', element: (<ProtectedRoute><Dashboard /></ProtectedRoute>) },
  { path: '/forum', element: (<ProtectedRoute><ForumsPage/></ProtectedRoute>) },
  { path: '/forum/:id', element: (<ProtectedRoute><ForumDetailPage /></ProtectedRoute>) },
  { path: '/period', element: (<ProtectedRoute><PeriodePage/></ProtectedRoute>) },
  { path: '/administrasi', element: (<ProtectedRoute requireAdmin><Administration /></ProtectedRoute>) },
    { path: '/formulir/:id', element: (<ProtectedRoute><TopicDetail /></ProtectedRoute>) },
    { path: '/formulir/buat', element: (<ProtectedRoute><CreateTopic /></ProtectedRoute>) },
    { path: '/profil', element: (<ProtectedRoute><Profile /></ProtectedRoute>) },
    { path: '*', element: <NotFound /> }, // Halaman tidak ditemukan
  ],
  {
    future: { 
      v7_startTransition: true,
      v7_relativeSplatPath: true // Tambahkan ini untuk future warning
    },
  }
)

export default router