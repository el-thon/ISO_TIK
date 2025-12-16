import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Users, Columns, BookOpen, ClipboardList, Bell, Archive, Settings, LogOut } from 'lucide-react'

const navItems = [
  { name: 'Dashboard', to: '/', icon: Home },
  { name: 'Groups', to: '/groups', icon: Users },
  { name: 'Rooms', to: '/rooms', icon: Columns },
  { name: 'Topics', to: '/topics', icon: BookOpen },
  { name: 'Assignments', to: '/assignments', icon: ClipboardList },
  { name: 'Notifications', to: '/notifications', icon: Bell },
  { name: 'Audit', to: '/audit', icon: Archive },
  { name: 'Administration', to: '/administration', icon: Settings },
]

function SidebarInner({ location }) {
  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-navy rounded flex items-center justify-center text-white font-bold">SI</div>
          <div>
            <div className="text-sm font-semibold">Sistem TIK</div>
            <div className="text-xs text-muted-foreground">Universitas Internal</div>
          </div>
        </div>

        <nav>
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to
              const Icon = item.icon
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-r-lg ${
                      active ? 'bg-navy/95 text-white' : 'text-foreground hover:bg-slate-50'
                    }`}
                  >
                    {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-navy" />}
                    <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-600'}`} />
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-3 px-3 py-3 rounded hover:bg-slate-50">
          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">BS</div>
          <div className="flex-1">
            <div className="text-sm font-medium">Budi Santoso</div>
            <div className="text-xs text-muted-foreground">budi.santoso@univer...</div>
          </div>
        </div>

        <div className="mt-4 px-3">
          <Link to="#" className="flex items-center gap-2 text-sm text-foreground hover:underline">
            <LogOut className="w-4 h-4 opacity-80" />
            Logout
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  const location = useLocation()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 min-h-screen bg-white border-r border-slate-100 px-4 py-6 sticky top-0">
        <SidebarInner location={location} />
      </aside>

      {/* Mobile drawer + overlay */}
      {/* Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <div className={`absolute inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 px-4 py-6 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarInner location={location} />
        </div>
      </div>
    </>
  )
}
