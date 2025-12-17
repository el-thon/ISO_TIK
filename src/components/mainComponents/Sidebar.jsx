import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Home, Users, Columns, BookOpen, ClipboardList, Bell, Archive, Settings, LogOut } from 'lucide-react'

const navItems = [
  { name: 'Dashboard', to: '/dashboard', icon: Home },
  { name: 'Grup', to: '/groups', icon: Users },
  { name: 'Ruangan', to: '/rooms', icon: Columns },
  { name: 'Topik', to: '/topics', icon: BookOpen },
  { name: 'Tugas', to: '/assignments', icon: ClipboardList },
  { name: 'Notifikasi', to: '/notifications', icon: Bell },
  { name: 'Audit', to: '/audit', icon: Archive },
  { name: 'Administrasi', to: '/administration', icon: Settings },
]

function SidebarInner() {
  const location = useLocation()

  const sections = [
    {
      title: 'Utama',
      items: navItems.filter((n) => n.to === '/dashboard'),
    },
    {
      title: 'Manajemen',
      items: navItems.filter((n) => n.to !== '/dashboard'),
    },
  ]

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div>
            <div className="text-heading-3">Sistem TIK</div>
            <div className="text-xs text-muted-foreground">Audit Internal</div>
          </div>
        </div>

        <nav>
          <ul className="flex flex-col gap-4">
            {sections.map((section) => {
              const sectionActive = section.items.some((item) => location.pathname === item.to || location.pathname.startsWith(item.to + '/'))
              return (
                <li key={section.title}>
                 
                  <ul className="flex flex-col gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      return (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-6 py-3 rounded-lg w-full ${
                                isActive ? 'bg-black text-white font-medium' : 'text-foreground hover:bg-gray'
                              }`
                            }
                          >
                            <Icon className="w-5 h-5 text-current shrink-0" />
                            <span className="text-sm">{item.name}</span>
                          </NavLink>
                        </li>
                      )
                    })}
                  </ul>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

  <div className="mt-6">
    <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-3 rounded ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-light'}`}>
      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">BS</div>
      <div className="flex-1">
        <div className="text-sm font-medium">Budi Santoso</div>
        <div className="text-xs text-muted-foreground">budi.santoso@univer...</div>
      </div>
    </NavLink>

    <div className="mt-4 px-3">
      <a href="#" className="flex items-center gap-2 text-sm text-foreground hover:underline">
        <LogOut className="w-4 h-4 opacity-80" />
        Keluar
      </a>
    </div>
  </div>
    </div>
  )
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 min-h-screen bg-white border-r border-slate-100 px-4 py-6 sticky top-0">
        <SidebarInner />
      </aside>

      {/* Mobile drawer + overlay */}
      {/* Overlay */}
      <div className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileOpen}>
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />
        <div className={`absolute inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 px-4 py-6 transform transition-transform duration-200 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarInner />
        </div>
      </div>
    </>
  )
}
