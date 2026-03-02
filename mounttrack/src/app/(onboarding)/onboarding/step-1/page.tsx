'use client'
import { saveShopSetup } from '@/actions/shop'
import { StepIndicator } from '@/components/step-indicator'
import { useActionState } from 'react'

export default function OnboardingStep1Page() {
  const [state, action, pending] = useActionState(saveShopSetup, undefined)

  return (
    <div>
      <StepIndicator current={1} total={2} />
      <h1 className="text-2xl font-bold mb-1">Set up your shop</h1>
      <p className="text-muted-foreground mb-8">
        Only your shop name is required. You can add the rest later in Settings.
      </p>

      <form action={action} className="space-y-5">
        {state?.error && (
          <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
            {state.error}
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
            placeholder="e.g. Big Buck Taxidermy"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>

        <div className="border-t pt-5">
          <p className="text-xs text-muted-foreground mb-4">Optional — add now or later in Settings</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="phone" className="text-sm font-medium">Phone</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium">Contact email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>
          </div>
          <div className="space-y-1 mt-4">
            <label htmlFor="address" className="text-sm font-medium">Address</label>
            <input
              id="address"
              name="address"
              type="text"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="space-y-1 col-span-1">
              <label htmlFor="city" className="text-sm font-medium">City</label>
              <input
                id="city"
                name="city"
                type="text"
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
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="zip" className="text-sm font-medium">ZIP</label>
              <input
                id="zip"
                name="zip"
                type="text"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-[var(--brand)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? 'Saving...' : 'Continue to subscription'}
        </button>
      </form>
    </div>
  )
}
