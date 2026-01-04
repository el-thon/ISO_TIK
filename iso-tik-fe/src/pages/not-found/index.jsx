import React from 'react'
import { Link } from 'react-router-dom'
import MainLayout from '@/layout/MainLayout'

export default function NotFound() {
  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center w-full">
        <div className="p-6 text-center">
          <h1 className="text-heading-2 font-semibold">404 — Halaman tidak ditemukan</h1>
          <p className="text-body-md text-muted-foreground mt-2">Halaman yang Anda cari tidak ditemukan.</p>
          <div className="mt-4">
            <Link to="/" className="text-primary hover:underline">Kembali ke beranda</Link>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
