import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Shop } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: shop } = await (supabase.from('shops') as any)
    .select('shop_name, logo_url, brand_color')
    .eq('id', userId)
    .single() as { data: Pick<Shop, 'shop_name' | 'logo_url' | 'brand_color'> | null }

  const checklist = [
    {
      id: 'logo',
      label: 'Upload your shop logo',
      done: !!shop?.logo_url,
      href: '/settings/branding',
    },
    {
      id: 'color',
      label: 'Set your brand color',
      done: shop?.brand_color !== '#6d28d9',  // Done if changed from default
      href: '/settings/branding',
    },
    {
      id: 'address',
      label: 'Add shop address and contact details',
      done: false,  // Phase 2 will add jobs — this checklist item remains actionable
      href: '/settings/shop',
    },
    {
      id: 'job',
      label: 'Create your first job',
      done: false,  // Phase 2
      href: '#',  // Will link to job creation in Phase 2
      disabled: true,
      note: 'Available in next update',
    },
  ]

  const doneCount = checklist.filter(item => item.done).length

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-1">
        Welcome to MountTrack{shop?.shop_name ? `, ${shop.shop_name}` : ''}!
      </h1>
      <p className="text-muted-foreground mb-8">
        {doneCount === checklist.length
          ? 'You\'re all set. Your shop is ready to go.'
          : `${doneCount} of ${checklist.length} setup steps complete.`
        }
      </p>

      <div className="space-y-3">
        {checklist.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 p-4 rounded-lg border ${
              item.done ? 'bg-muted/30' : 'bg-background'
            } ${'disabled' in item && item.disabled ? 'opacity-50' : ''}`}
          >
            <div
              className={`h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center ${
                item.done
                  ? 'bg-[var(--brand)] text-white'
                  : 'border-2 border-muted-foreground'
              }`}
            >
              {item.done && (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${item.done ? 'line-through text-muted-foreground' : ''}`}>
                {item.label}
              </p>
              {'note' in item && item.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{item.note}</p>
              )}
            </div>
            {!item.done && !('disabled' in item && item.disabled) && (
              <Link
                href={item.href}
                className="text-xs font-medium text-[var(--brand)] hover:underline"
              >
                Set up
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
