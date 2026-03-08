'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, LayoutGrid, Plus, Search, Settings } from 'lucide-react'

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/board',     label: 'Board',     icon: LayoutGrid },
  { href: '/jobs/new',  label: 'New Job',   icon: Plus },
  { href: '/search',    label: 'Search',    icon: Search },
  { href: '/settings/shop', label: 'Settings', icon: Settings },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <>
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${active
                ? 'bg-[var(--brand)]/10 text-[var(--brand)] font-medium'
                : 'hover:bg-muted text-foreground'
              }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        )
      })}
    </>
  )
}
