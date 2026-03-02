'use client'
import { updateShopDetails } from '@/actions/shop'
import { useActionState } from 'react'

interface ShopSettingsFormProps {
  shopName: string
  address: string
  city: string
  state: string
  zip: string
  phone: string
  email: string
}

export function ShopSettingsForm({
  shopName,
  address,
  city,
  state,
  zip,
  phone,
  email,
}: ShopSettingsFormProps) {
  const [formState, action, pending] = useActionState(updateShopDetails, undefined)

  return (
    <form action={action} className="mt-6 space-y-5">
      {formState?.error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
          {formState.error}
        </p>
      )}

      <div className="space-y-1">
        <label htmlFor="shop_name" className="text-sm font-medium">
          Shop name <span className="text-red-500">*</span>
        </label>
        <input
          id="shop_name"
          name="shop_name"
          type="text"
          required
          defaultValue={shopName}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="address" className="text-sm font-medium">Address</label>
        <input
          id="address"
          name="address"
          type="text"
          defaultValue={address}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1 col-span-1">
          <label htmlFor="city" className="text-sm font-medium">City</label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={city}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="state" className="text-sm font-medium">State</label>
          <input
            id="state"
            name="state"
            type="text"
            maxLength={2}
            defaultValue={state}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="zip" className="text-sm font-medium">ZIP</label>
          <input
            id="zip"
            name="zip"
            type="text"
            defaultValue={zip}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="phone" className="text-sm font-medium">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium">Contact email</label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={email}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  )
}
