'use client'

import * as React from 'react'

interface DashboardTopbarProps {
  pathname: string
}

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':                                                           'Dashboard',
  '/dashboard/system-architect':                                          'System Architect',
  '/dashboard/map-builders':                                              'Canvas Creator',
  '/admin/quotes':                                                        'Quote Builder',
  '/admin/projects':                                                      'Client Project Schedules',
  '/dashboard/settings':                                                  'Settings',
  '/dashboard/settings/organisation':                                     'Organisation settings',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function getBreadcrumbs(pathname: string): { label: string; isLast: boolean }[] {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 0) return [{ label: 'Dashboard', isLast: true }]

  const crumbs: { label: string; isLast: boolean }[] = []
  let path = ''

  for (const segment of segments) {
    path += '/' + segment
    if (UUID_RE.test(segment)) continue
    const label = PAGE_TITLES[path] ?? segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    crumbs.push({ label, isLast: false })
  }

  if (crumbs.length === 0) return [{ label: 'Dashboard', isLast: true }]
  crumbs[crumbs.length - 1].isLast = true
  return crumbs
}

export function DashboardTopbar({ pathname }: DashboardTopbarProps) {
  const breadcrumbs = getBreadcrumbs(pathname)
  const [email, setEmail] = React.useState('')

  React.useEffect(() => {
    setEmail(localStorage.getItem('hses_user_email') ?? '')
  }, [])

  return (
    <div className="h-[52px] border-b border-neutral-100 bg-white flex items-center justify-between px-5 flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-[13px]">
        <span className="text-neutral-400">HSES</span>
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            <span className="mx-1 text-neutral-300">/</span>
            <span className={crumb.isLast ? 'text-neutral-900 font-medium' : 'text-neutral-400'}>
              {crumb.label}
            </span>
          </React.Fragment>
        ))}
      </div>

      {/* Email */}
      {email && (
        <span className="text-[12px] text-neutral-400 truncate max-w-[200px]">{email}</span>
      )}
    </div>
  )
}
