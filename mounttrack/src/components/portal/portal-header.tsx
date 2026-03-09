import Image from 'next/image'
import type { Shop } from '@/types/database'

interface PortalHeaderProps {
  shop: Shop
}

export function PortalHeader({ shop }: PortalHeaderProps) {
  return (
    <header className="bg-[var(--brand)] px-4 py-4">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        {shop.logo_url && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/20">
            <Image
              src={shop.logo_url}
              alt={`${shop.shop_name} logo`}
              fill
              className="object-cover"
            />
          </div>
        )}
        <span className="text-lg font-semibold text-white">{shop.shop_name}</span>
      </div>
    </header>
  )
}
