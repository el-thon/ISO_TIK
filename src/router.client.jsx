import React from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import Login from './pages/auth/index'
import ForgotPassword from './pages/auth/ForgotPassword'
import Dashboard from './pages/dashboard'
import Groups from './pages/groups'
import GroupsDetail from './pages/groups/detail'
import Rooms from './pages/rooms'
import RoomDetail from './pages/rooms/detail'
import Topics from './pages/topics'
import CreateTopic from './pages/topics/CreateTopic'
import Assignments from './pages/assignments'
import AuditPage from './pages/audits'
import Profile from './pages/profile'
import Administration from './pages/administration'
import NotFound from './pages/not-found'

export const router = createBrowserRouter(
  [
    { path: '/auth', element: <Login /> },
    { path: '/', element: <Navigate to="/auth" replace /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/groups', element: <Groups /> },
  { path: '/rooms', element: <Rooms /> },
  { path: '/rooms/:id', element: <RoomDetail /> },
  { path: '/assignments', element: <Assignments /> },
  { path: '/audit', element: <AuditPage /> },
  { path: '/administration', element: <Administration /> },
  { path: '/topics', element: <Topics /> },
  { path: '/topics/create', element: <CreateTopic /> },
  { path: '/profile', element: <Profile /> },
  { path: '/groups/:id', element: <GroupsDetail /> },
    { path: '/auth/forgot', element: <ForgotPassword /> },
    { path: '*', element: <NotFound /> },
  ],
  {
    future: { v7_startTransition: true },
  },
)

export default router
