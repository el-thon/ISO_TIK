import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import RootRedirect from './routes/RootRedirect'
import Login from './pages/auth/index'
import ForgotPassword from './pages/auth/ForgotPassword'
import SsoCallback from './pages/auth/SsoCallback'
import Dashboard from './pages/dashboard'
import Groups from './pages/groups'
import GroupsDetail from './pages/groups/detail'
import Rooms from './pages/rooms'
import RoomDetail from './pages/rooms/detail'
import Users from './pages/users'
import UserDetail from './pages/users/detail'
import CreateTopic from './pages/topics/CreateTopic'
import TopicDetail from './pages/topics/detail'
import Assignments from './pages/assignments'
import Profile from './pages/profile'
import Administration from './pages/administration'
import NotFound from './pages/not-found'
import ProtectedRoute from '@/routes/ProtectedRoute'

export const router = createBrowserRouter(
  [
    { path: '/', element: <RootRedirect /> },
    { path: '/login', element: <Login /> },
    { path: '/login/sso', element: <SsoCallback /> },
    { path: '/dashboard', element: (<ProtectedRoute><Dashboard /></ProtectedRoute>) },
  { path: '/groups', element: (<ProtectedRoute><Groups /></ProtectedRoute>) },
  { path: '/users', element: (<ProtectedRoute><Users /></ProtectedRoute>) },
  { path: '/users/:id', element: (<ProtectedRoute><UserDetail /></ProtectedRoute>) },
  { path: '/rooms', element: (<ProtectedRoute><Rooms /></ProtectedRoute>) },
  { path: '/rooms/:id', element: (<ProtectedRoute><RoomDetail /></ProtectedRoute>) },
  { path: '/assignments', element: (<ProtectedRoute><Assignments /></ProtectedRoute>) },
  { path: '/administration', element: (<ProtectedRoute><Administration /></ProtectedRoute>) },
  { path: '/topics/:id', element: (<ProtectedRoute><TopicDetail /></ProtectedRoute>) },
  { path: '/topics/create', element: (<ProtectedRoute><CreateTopic /></ProtectedRoute>) },
  { path: '/profile', element: (<ProtectedRoute><Profile /></ProtectedRoute>) },
  { path: '/groups/:id', element: (<ProtectedRoute><GroupsDetail /></ProtectedRoute>) },
    { path: '/auth/forgot', element: <ForgotPassword /> },
    { path: '*', element: <NotFound /> },
  ],
  {
    future: { v7_startTransition: true },
  },
)

export default router