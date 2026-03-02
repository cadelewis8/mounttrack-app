import Link from 'next/link'

const tabs = [
  { id: 'shop', label: 'Shop', href: '/settings/shop' },
  { id: 'branding', label: 'Branding', href: '/settings/branding' },
  { id: 'subscription', label: 'Subscription', href: '/settings/subscription' },
] as const

type TabId = typeof tabs[number]['id']

export function SettingsTabs({ active }: { active: TabId }) {
  return (
    <div className="flex border-b gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === tab.id
              ? 'border-[var(--brand)] text-[var(--brand)]'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
