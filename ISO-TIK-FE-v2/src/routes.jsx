import React from 'react'
import { Routes, Route } from 'react-router-dom'
import RootRedirect from './routes/RootRedirect'
import Login from './pages/auth/index'
import NotFound from './pages/not-found'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
