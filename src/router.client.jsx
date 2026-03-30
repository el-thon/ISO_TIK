import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootRedirect from './routes/RootRedirect'
// Perbaikan: Import langsung dari file Login.jsx, bukan dari index.jsx
import Login from './pages/auth/index'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard'
import Users from './pages/users'
import UserDetail from './pages/users/detail'
import CreateTopic from './pages/topics/CreateTopic'
import TopicDetail from './pages/topics/detail'
import Assignments from './pages/assignments'
import Profile from './pages/profile'
import Administration from './pages/administration'
import RoomsPage from './pages/rooms'
import RoomDetail from './pages/rooms/detail'
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
    { path: '/pengguna', element: (<ProtectedRoute><Users /></ProtectedRoute>) },
    { path: '/pengguna/:id', element: (<ProtectedRoute><UserDetail /></ProtectedRoute>) },
    { path: '/tugas', element: (<ProtectedRoute><Assignments /></ProtectedRoute>) },
    { path: '/forum', element: (<ProtectedRoute><RoomsPage/></ProtectedRoute>) },
    { path: '/forum/:id', element: (<ProtectedRoute><RoomDetail /></ProtectedRoute>) },
  { path: '/administrasi', element: (<ProtectedRoute requireAdmin><Administration /></ProtectedRoute>) },
    { path: '/formulir/:id', element: (<ProtectedRoute><TopicDetail /></ProtectedRoute>) },
    { path: '/formulir/buat', element: (<ProtectedRoute><CreateTopic /></ProtectedRoute>) },
    { path: '/profil', element: (<ProtectedRoute><Profile /></ProtectedRoute>) },
    { path: '/auth/lupa-password', element: <ForgotPassword /> },
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