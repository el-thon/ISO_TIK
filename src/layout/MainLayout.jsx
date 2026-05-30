import React, { useState } from 'react'
import Sidebar from '../components/mainComponents/Sidebar'
import { Menu } from 'lucide-react'

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-dvh flex bg-slate-50">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 flex-1 flex flex-col">
        {/* Mobile header with hamburger */}
        <header className="md:hidden bg-white border-b border-slate-100 p-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-sm font-semibold">Sistem TIK</div>
          <div />
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
