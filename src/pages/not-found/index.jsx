import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 text-center">
        <h1 className="text-heading-2 font-semibold">404 — Halaman tidak ditemukan</h1>
        <p className="text-body-md text-muted-foreground mt-2">Halaman yang Anda cari tidak ditemukan.</p>
        <div className="mt-4">
          <Link to="/" className="text-primary hover:underline">Kembali ke beranda</Link>
        </div>
      </div>
    </div>
  )
}
