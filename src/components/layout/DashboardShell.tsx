'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from '@/components/layout/DashboardSidebar'
import { DashboardTopbar } from '@/components/layout/DashboardTopbar'
import { ADMIN_EMAIL } from '@/lib/access/admin'

const SIDEBAR_KEY = 'hses_dashboard_sidebar_collapsed'

// ── Shell ─────────────────────────────────────────────────────────────────────

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = React.useState(false)
  const [isAdmin,   setIsAdmin]   = React.useState(false)
  const [mounted,   setMounted]   = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(SIDEBAR_KEY)
    if (stored !== null) setCollapsed(stored === 'true')
    const email = localStorage.getItem('hses_user_email')?.toLowerCase() ?? ''
    setIsAdmin(email === ADMIN_EMAIL)
  }, [])

  function handleToggle() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }

  if (!mounted) return null

  return (
    <div className="flex h-screen overflow-hidden bg-[#f7f8fa]">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex flex-shrink-0">
        <DashboardSidebar
          collapsed={collapsed}
          onToggle={handleToggle}
          pathname={pathname}
          isAdmin={isAdmin}
        />
      </div>

      {/* Right column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardTopbar pathname={pathname} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
