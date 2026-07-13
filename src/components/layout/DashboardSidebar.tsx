'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  IconLayoutDashboard,
  IconFileText,
  IconCalendarStats,
  IconSitemap,
  IconVectorBezier2,
  IconSettings,
  IconLogout,
  IconChevronsLeft,
  IconChevronsRight,
} from '@tabler/icons-react'
import { ConfirmModal } from '@/components/ui/Modal'
import { logoutPortalUser } from '@/lib/supabase/logout'
import { cn } from '@/lib/utils'
import { ADMIN_EMAIL } from '@/lib/access/admin'
import { useOrgBranding } from '@/lib/hooks/useOrgBranding'

// ── Dynamic brand-colour theming ──────────────────────────────────────────────
// ITU-R BT.601 luminance — returns white or dark text based on perceived brightness.
function textOnBrand(hex: string): '#ffffff' | '#1a2533' {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#1a2533' : '#ffffff'
}

interface SidebarTheme {
  bg:            string
  text:          string
  textMuted:     string
  textSubtle:    string
  border:        string
  activeOverlay: string
  hoverClass:    string
}

function buildTheme(colour: string): SidebarTheme {
  const text    = textOnBrand(colour)
  const isLight = text === '#1a2533'
  return {
    bg:            colour,
    text,
    textMuted:     isLight ? 'rgba(26,37,51,0.55)'   : 'rgba(255,255,255,0.55)',
    textSubtle:    isLight ? 'rgba(26,37,51,0.40)'   : 'rgba(255,255,255,0.40)',
    border:        isLight ? 'rgba(26,37,51,0.10)'   : 'rgba(255,255,255,0.10)',
    activeOverlay: isLight ? 'rgba(0,0,0,0.12)'      : 'rgba(255,255,255,0.15)',
    hoverClass:    isLight ? 'hover:bg-black/[0.07]' : 'hover:bg-white/[0.08]',
  }
}

// ── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
  label:      string
  href:       string
  icon:       React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>
  adminOnly?: boolean
}

const NAV: NavItem[] = [
  { label: 'Dashboard',                href: '/dashboard',                      icon: IconLayoutDashboard },
  { label: 'Quote Builder',            href: '/admin/quotes',                   icon: IconFileText,        adminOnly: true },
  { label: 'Client Project Schedules', href: '/admin/projects',                 icon: IconCalendarStats,   adminOnly: true },
  { label: 'System Architect',         href: '/dashboard/system-architect',     icon: IconSitemap },
  { label: 'Canvas Creator',           href: '/dashboard/map-builders',         icon: IconVectorBezier2 },
]

const FOOTER_NAV: NavItem[] = [
  { label: 'Settings', href: '/dashboard/settings/organisation', icon: IconSettings, adminOnly: true },
]

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

// ── NavLink ───────────────────────────────────────────────────────────────────

function NavLink({
  item,
  active,
  collapsed,
  theme,
}: {
  item:      NavItem
  active:    boolean
  collapsed: boolean
  theme:     SidebarTheme
}) {
  if (collapsed) {
    return (
      <div className="group/navitem relative">
        <Link
          href={item.href}
          className={cn(
            'mx-2 flex justify-center py-[8px] rounded-md transition-colors duration-100',
            !active && theme.hoverClass,
          )}
          style={active ? { backgroundColor: theme.activeOverlay } : {}}
        >
          <item.icon size={17} style={{ color: active ? theme.text : theme.textMuted }} />
        </Link>
        <span className="hidden group-hover/navitem:block absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-neutral-950 border border-white/15 text-white text-[12px] font-medium px-2 py-1 rounded-sm whitespace-nowrap z-[100] pointer-events-none">
          {item.label}
        </span>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'mx-2 flex items-center gap-[9px] px-2 py-[8px] rounded-md',
        'transition-colors duration-100 overflow-hidden whitespace-nowrap',
        !active && theme.hoverClass,
      )}
      style={active ? { backgroundColor: theme.activeOverlay } : {}}
    >
      <item.icon size={17} className="flex-shrink-0 w-[20px]" style={{ color: active ? theme.text : theme.textMuted }} />
      <span className="text-[13px] font-medium" style={{ color: active ? theme.text : theme.textMuted }}>
        {item.label}
      </span>
    </Link>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface DashboardSidebarProps {
  collapsed:  boolean
  onToggle:   () => void
  pathname:   string
  isAdmin:    boolean
}

export function DashboardSidebar({ collapsed, onToggle, pathname, isAdmin }: DashboardSidebarProps) {
  const [logoutOpen,    setLogoutOpen]    = React.useState(false)
  const [logoutLoading, setLogoutLoading] = React.useState(false)

  const { brandColour, logoUrl } = useOrgBranding()
  const theme = buildTheme(brandColour)

  async function handleLogout() {
    setLogoutLoading(true)
    await logoutPortalUser()
  }

  const visibleNav       = NAV.filter(item => !item.adminOnly || isAdmin)
  const visibleFooterNav = FOOTER_NAV.filter(item => !item.adminOnly || isAdmin)

  return (
    <>
      <div
        className={cn(
          'flex flex-col h-full transition-all duration-200 ease-in-out flex-shrink-0',
          collapsed ? 'w-[56px]' : 'w-[220px]',
        )}
        style={{ backgroundColor: theme.bg }}
      >
        {/* Header */}
        {collapsed ? (
          <div className="flex justify-center py-[13px] flex-shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="w-[30px] h-[30px] rounded-md object-contain bg-white p-[2px] flex-shrink-0"
              />
            ) : (
              <div
                className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                style={{ backgroundColor: theme.activeOverlay, color: theme.text }}
              >
                H
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-[10px] px-[14px] py-4 flex-shrink-0" style={{ borderBottom: `1px solid ${theme.border}` }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo"
                className="w-[30px] h-[30px] rounded-md object-contain bg-white p-[2px] flex-shrink-0"
              />
            ) : (
              <div
                className="w-[30px] h-[30px] rounded-md flex items-center justify-center text-[14px] font-bold flex-shrink-0"
                style={{ backgroundColor: theme.activeOverlay, color: theme.text }}
              >
                H
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13px] font-semibold truncate" style={{ color: theme.text }}>HSES</p>
              <p className="text-[11px] truncate" style={{ color: theme.textSubtle }}>Industry Partners</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {visibleNav.map(item => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              theme={theme}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 py-2" style={{ borderTop: `1px solid ${theme.border}` }}>
          {/* Settings (admin only) */}
          {visibleFooterNav.map(item => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              collapsed={collapsed}
              theme={theme}
            />
          ))}

          {/* Log out */}
          {collapsed ? (
            <div className="group/navitem relative">
              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className={cn('mx-2 flex justify-center py-[8px] rounded-md transition-colors duration-100', theme.hoverClass)}
              >
                <IconLogout size={17} style={{ color: theme.textSubtle }} />
              </button>
              <span className="hidden group-hover/navitem:block absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-neutral-950 border border-white/15 text-white text-[12px] font-medium px-2 py-1 rounded-sm whitespace-nowrap z-[100] pointer-events-none">
                Log out
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              className={cn('mx-2 flex items-center gap-[9px] px-2 py-[8px] rounded-md transition-colors duration-100 overflow-hidden whitespace-nowrap', theme.hoverClass)}
            >
              <IconLogout size={17} className="flex-shrink-0 w-[20px]" style={{ color: theme.textSubtle }} />
              <span className="text-[13px] font-medium" style={{ color: theme.textSubtle }}>Log out</span>
            </button>
          )}

          <div className={cn('flex pt-1 pb-1', collapsed ? 'justify-center' : 'justify-end px-3')}>
            <button
              type="button"
              onClick={onToggle}
              className={cn('w-[24px] h-[24px] rounded-sm flex items-center justify-center transition-colors', theme.hoverClass)}
              style={{ color: theme.textSubtle }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <IconChevronsRight size={14} /> : <IconChevronsLeft size={14} />}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title="Log out?"
        description="You'll be returned to the login page."
        variant="default"
        confirmLabel="Log out"
        cancelLabel="Stay logged in"
        onConfirm={handleLogout}
        loading={logoutLoading}
      />
    </>
  )
}
