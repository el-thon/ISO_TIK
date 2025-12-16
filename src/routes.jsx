import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/auth/index'
import ForgotPassword from './pages/auth/ForgotPassword'
import NotFound from './pages/not-found'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/auth/forgot" element={<ForgotPassword />} />
  <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
