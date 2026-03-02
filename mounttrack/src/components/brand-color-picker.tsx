'use client'
import { HexColorPicker, HexColorInput } from 'react-colorful'

interface BrandColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function BrandColorPicker({ value, onChange }: BrandColorPickerProps) {
  return (
    <div className="space-y-3">
      <HexColorPicker color={value} onChange={onChange} style={{ width: '100%' }} />
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-md border border-input flex-shrink-0"
          style={{ backgroundColor: value }}
        />
        <div className="flex items-center gap-1 flex-1">
          <span className="text-sm text-muted-foreground">#</span>
          <HexColorInput
            color={value}
            onChange={onChange}
            className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>
    </div>
  )
}
