'use client'
import { BrandColorPicker } from '@/components/brand-color-picker'
import { updateBrandColor } from '@/actions/shop'
import { useState, useActionState } from 'react'

interface BrandingFormProps {
  currentColor: string
}

export function BrandingForm({ currentColor }: BrandingFormProps) {
  const [color, setColor] = useState(currentColor)
  const [state, action, pending] = useActionState(updateBrandColor, undefined)

  return (
    <form
      action={action}
      style={{ '--brand': color } as React.CSSProperties}
    >
      <input type="hidden" name="brand_color" value={color} />

      {state?.error && (
        <p className="text-sm text-red-500 mb-3">{state.error}</p>
      )}

      <div className="max-w-xs">
        <BrandColorPicker value={color} onChange={setColor} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {pending ? 'Saving...' : 'Save color'}
      </button>
      <p className="mt-2 text-xs text-muted-foreground">
        Preview updates in real time. Click Save to apply permanently.
      </p>
    </form>
  )
}
