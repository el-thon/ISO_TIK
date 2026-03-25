// components/Sidebar.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearTokens } from '@/services/api'
import { useProfile } from '@/services/profileHooks'
import { useMe } from '@/services/authHooks'
import { getUserData, isAuthenticated } from '@/utils/auth'
import { Home, Users, User, Columns, BookOpen, ClipboardList, Settings, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { name: 'Beranda', to: '/beranda', icon: Home, section: 'main' },
  { name: 'Pengguna', to: '/pengguna', icon: User, section: 'management', adminOnly: true },
  { name: 'Forum', to: '/forum', icon: Columns, section: 'management' },
  { name: 'Klausul', to: '/klausul', icon: Settings, section: 'management', adminOnly: true },
]

const SECTION_TITLES = {
  main: 'Utama',
  management: 'Manajemen'
}

const getUserInitials = (name) => {
  if (!name) return '??'
  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0]?.toUpperCase())
    .slice(0, 2)
    .join('') || '??'
}

const truncateEmail = (email) => {
  if (!email) return ''
  return email.length > 24 ? `${email.slice(0, 24)}...` : email
}

// Fungsi untuk mengecek apakah user adalah admin
const isUserAdmin = (userData) => {
  if (!userData) return false
  
  // Handle berbagai format data yang mungkin
  const roles = userData?.roles || 
                userData?.data?.roles || 
                userData?.data?.user?.roles || 
                []
  
  return roles.includes('admin') || 
         roles.includes('administrator') || 
         userData?.role === 'admin' ||
         userData?.is_admin === true ||
         userData?.data?.is_admin === true
}

// Hook untuk permissions dengan prioritas localStorage
const useUserPermissions = () => {
  // State awal dari localStorage
  const [permissions, setPermissions] = useState(() => {
    const userData = getUserData()
    const isAdmin = isUserAdmin(userData)
    
    return {
      isAdmin,
      canManageUsers: isAdmin,
      isLoading: false
    }
  })

  // Fetch dari server untuk validasi (tanpa mengganggu state jika sama)
  const { data: meData, error: meError, isLoading } = useMe({ 
    staleTime: 60_000,
    retry: 1,
  })

  // Update permissions hanya jika data dari server valid dan BERBEDA
  useEffect(() => {
    if (meData) {
      const serverIsAdmin = isUserAdmin(meData)
      const currentIsAdmin = permissions.isAdmin
      

      // Hanya update jika berbeda
      if (serverIsAdmin !== currentIsAdmin) {
        setPermissions({
          isAdmin: serverIsAdmin,
          canManageUsers: serverIsAdmin,
          isLoading: false
        })
      } 
    } 
  }, [meData, meError])

  return permissions
}

const NavItem = ({ item }) => {
  const Icon = item.icon
  
  return (
    <li>
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          `flex items-center gap-3 px-6 py-3 rounded-lg w-full transition-colors ${
            isActive 
              ? 'bg-black text-white font-medium' 
              : 'text-foreground hover:bg-gray-100'
          }`
        }
      >
        <Icon className="w-5 h-5 text-current shrink-0" />
        <span className="text-sm">{item.name}</span>
      </NavLink>
    </li>
  )
}

const NavSection = ({ title, items }) => {
  if (!items.length) return null
  
  return (
    <li>
      <div className="text-xs font-medium text-muted-foreground mb-2 px-6">
        {title}
      </div>
      <ul className="flex flex-col gap-1">
        {items.map(item => (
          <NavItem key={item.to} item={item} />
        ))}
      </ul>
    </li>
  )
}

const UserProfile = ({ name, email, onLogout }) => {
  const initials = getUserInitials(name)
  const truncatedEmail = truncateEmail(email)
  
  return (
    <div className="mt-6">
      <NavLink 
        to="/profil" 
        className={({ isActive }) => 
          `flex items-center gap-3 px-3 py-3 rounded transition-colors ${
            isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
          }`
        }
      >
        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-medium">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{name}</div>
          {truncatedEmail && (
            <div className="text-xs text-muted-foreground truncate">{truncatedEmail}</div>
          )}
        </div>
      </NavLink>

      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-3 py-3 mt-2 rounded-lg text-sm text-foreground hover:bg-gray-100 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center transition-colors">
          <LogOut className="w-5 h-5 text-red-600" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-medium text-red-600">Keluar</div>
          <div className="text-xs text-muted-foreground">Akhiri sesi</div>
        </div>
      </button>
    </div>
  )
}

function SidebarInner() {
  const navigate = useNavigate()
  const { data: profileData, isLoading: profileLoading } = useProfile()
  const { isAdmin, canManageUsers } = useUserPermissions()

  // Filter nav items berdasarkan permissions
  const filteredNavItems = useMemo(() => {
    
    return NAV_ITEMS.filter(item => {
      if (item.adminOnly) return canManageUsers
      return true
    })
  }, [canManageUsers])

  // Group items by section
  const sections = useMemo(() => {
    const main = filteredNavItems.filter(item => item.section === 'main')
    const management = filteredNavItems.filter(item => item.section === 'management')
    

    
    return [
      { title: SECTION_TITLES.main, items: main },
      { title: SECTION_TITLES.management, items: management }
    ].filter(section => section.items.length > 0)
  }, [filteredNavItems])

  // Ekstrak data profile dengan berbagai format
  const displayName = 
    profileData?.profile?.full_name || 
    profileData?.full_name ||
    profileData?.name || 
    profileData?.username || 
    getUserData()?.name ||
    getUserData()?.username ||
    'Pengguna'
  
  const displayEmail = 
    profileData?.email || 
    profileData?.profile?.email || 
    getUserData()?.email ||
    ''

  const handleLogout = (e) => {
    e.preventDefault()
    clearTokens()
    navigate('/login', { replace: true })
  }

  // Debug log

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="mb-8 flex items-center gap-3">
          <div>
            <div className="text-heading-3 font-semibold">Sistem TIK</div>
            <div className="text-xs text-muted-foreground">Audit Internal</div>
          </div>
        </div>

        <nav>
          <ul className="flex flex-col gap-4">
            {sections.map(section => (
              <NavSection 
                key={section.title} 
                title={section.title} 
                items={section.items} 
              />
            ))}
          </ul>
        </nav>
      </div>

      {/* Profil Pengguna */}
      <UserProfile 
        name={displayName}
        email={displayEmail}
        onLogout={handleLogout}
      />
    </div>
  )
}

export default function Sidebar({ mobileOpen = false, onClose = () => {} }) {
  return (
    <>
      <aside className="hidden md:block w-64 h-screen bg-white border-r border-slate-100 px-4 py-6 sticky top-0 overflow-y-auto">
        <SidebarInner />
      </aside>

      <div 
        className={`fixed inset-0 z-40 md:hidden ${mobileOpen ? '' : 'pointer-events-none'}`} 
        aria-hidden={!mobileOpen}
      >
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity ${
            mobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        />
        
        {/* Sidebar Mobile */}
        <div 
          className={`absolute inset-y-0 left-0 z-50 w-64 h-screen bg-white border-r border-slate-100 px-4 py-6 transform transition-transform duration-200 overflow-y-auto ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <SidebarInner />
        </div>
      </div>
    </>
  )
}