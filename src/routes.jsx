import React from 'react'
import { Routes, Route } from 'react-router-dom'
import RootRedirect from './routes/RootRedirect'
import Login from './pages/auth/index'
import ForgotPassword from './pages/auth/ForgotPassword'
import NotFound from './pages/not-found'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/auth/forgot" element={<ForgotPassword />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
