'use client'
import { uploadLogo } from '@/actions/shop'
import { useActionState, useRef } from 'react'
import Image from 'next/image'

interface LogoUploadProps {
  currentLogoUrl: string | null
  shopName: string
}

export function LogoUpload({ currentLogoUrl, shopName }: LogoUploadProps) {
  const [state, action, pending] = useActionState(uploadLogo, undefined)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="space-y-4">
      {/* Current logo or placeholder */}
      <div className="h-24 w-24 rounded-lg border-2 border-dashed border-muted flex items-center justify-center overflow-hidden">
        {currentLogoUrl ? (
          <Image
            src={currentLogoUrl}
            alt={`${shopName} logo`}
            width={96}
            height={96}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-xs text-muted-foreground text-center px-2 font-medium">
            {shopName || 'No logo'}
          </span>
        )}
      </div>

      <form action={action} className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          name="logo"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              e.target.form?.requestSubmit()
            }
          }}
        />

        {state?.error && (
          <p className="text-sm text-red-500">{state.error}</p>
        )}

        <button
          type="button"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          {pending ? 'Uploading...' : currentLogoUrl ? 'Change logo' : 'Upload logo'}
        </button>

        <p className="text-xs text-muted-foreground">
          PNG, JPG, or SVG. Max 2MB. Displayed square-cropped.
        </p>
      </form>
    </div>
  )
}
