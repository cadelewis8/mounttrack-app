'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createJob } from '@/actions/jobs'
import { PhotoUploadZone, type PhotoUploadZoneHandle } from '@/components/photo-upload-zone'

const ANIMAL_TYPES = [
  'Deer', 'White-tail Deer', 'Elk', 'Bear', 'Turkey',
  'Fish', 'Duck', 'Pheasant', 'Antelope', 'Mountain Lion', 'Boar', 'Other',
] as const

const MOUNT_STYLES = [
  'Shoulder Mount', 'Full Body', 'European/Skull',
  'Fish Panel', 'Life-Size', 'Half Mount', 'Other',
] as const

const REFERRAL_SOURCES = [
  'Facebook', 'Google', 'Word of Mouth',
  'Walk-In', 'Instagram', 'Repeat Customer', 'Other',
] as const

const intakeSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  // Email: validated when non-empty; empty string is treated as no email
  customer_email: z.string().optional().refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: 'Invalid email address' }
  ),
  animal_type: z.string().min(1, 'Animal type is required'),
  animal_type_custom: z.string().optional(),
  mount_style: z.string().min(1, 'Mount style is required'),
  mount_style_custom: z.string().optional(),
  // quoted_price: string from input, parsed to number on submit
  quoted_price: z.string().min(1, 'Quoted price is required').refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0,
    { message: 'Must be greater than 0' }
  ),
  // deposit_amount: optional string, parsed to number on submit
  deposit_amount: z.string().optional(),
  estimated_completion_date: z.string().min(1, 'Completion date is required'),
  referral_source: z.string().optional(),
  referral_source_custom: z.string().optional(),
  is_rush: z.boolean(),
  social_media_consent: z.boolean(),
})

type IntakeFormValues = z.infer<typeof intakeSchema>

export function JobIntakeForm() {
  const router = useRouter()
  // Generate a stable jobId for photo upload paths before the DB record exists
  const jobId = useRef(crypto.randomUUID()).current

  const [serverError, setServerError] = useState<string | null>(null)

  // Ref to PhotoUploadZone so we can call uploadAll imperatively in onSubmit
  const photoZoneRef = useRef<PhotoUploadZoneHandle>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      is_rush: false,
      social_media_consent: false,
    },
  })

  const animalType = watch('animal_type')
  const mountStyle = watch('mount_style')
  const referralSource = watch('referral_source')

  const onSubmit = async (values: IntakeFormValues) => {
    setServerError(null)

    // Step 1: Upload photos if any are pending
    const uploadedPaths = photoZoneRef.current
      ? await photoZoneRef.current.uploadAll()
      : []

    // Step 2: Build FormData and call createJob server action
    const formData = new FormData()
    formData.set('customer_name', values.customer_name)
    formData.set('customer_phone', values.customer_phone ?? '')
    formData.set('customer_email', values.customer_email ?? '')
    formData.set('animal_type', values.animal_type)
    if (values.animal_type_custom) formData.set('animal_type_custom', values.animal_type_custom)
    formData.set('mount_style', values.mount_style)
    if (values.mount_style_custom) formData.set('mount_style_custom', values.mount_style_custom)
    formData.set('quoted_price', String(values.quoted_price))
    if (values.deposit_amount) formData.set('deposit_amount', String(values.deposit_amount))
    formData.set('estimated_completion_date', values.estimated_completion_date)
    formData.set('referral_source', values.referral_source ?? '')
    if (values.referral_source_custom) formData.set('referral_source_custom', values.referral_source_custom)
    formData.set('is_rush', String(values.is_rush))
    formData.set('social_media_consent', String(values.social_media_consent))
    formData.set('photo_paths', JSON.stringify(uploadedPaths))

    const result = await createJob(undefined, formData)
    if (result?.error) {
      setServerError(result.error)
    } else {
      router.push('/board')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Customer Name */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Customer Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('customer_name')}
          type="text"
          placeholder="Jane Smith"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
        {errors.customer_name && (
          <p className="text-xs text-red-500 mt-1">{errors.customer_name.message}</p>
        )}
      </div>

      {/* Phone & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            {...register('customer_phone')}
            type="tel"
            placeholder="(555) 555-5555"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            {...register('customer_email')}
            type="email"
            placeholder="jane@example.com"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
          {errors.customer_email && (
            <p className="text-xs text-red-500 mt-1">{errors.customer_email.message}</p>
          )}
        </div>
      </div>

      {/* Animal Type */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Animal Type <span className="text-red-500">*</span>
        </label>
        <select
          {...register('animal_type')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
        >
          <option value="">Select animal type...</option>
          {ANIMAL_TYPES.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        {errors.animal_type && (
          <p className="text-xs text-red-500 mt-1">{errors.animal_type.message}</p>
        )}
        {animalType === 'Other' && (
          <input
            {...register('animal_type_custom')}
            type="text"
            placeholder="Specify animal type..."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        )}
      </div>

      {/* Mount Style */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Mount Style <span className="text-red-500">*</span>
        </label>
        <select
          {...register('mount_style')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
        >
          <option value="">Select mount style...</option>
          {MOUNT_STYLES.map((style) => (
            <option key={style} value={style}>{style}</option>
          ))}
        </select>
        {errors.mount_style && (
          <p className="text-xs text-red-500 mt-1">{errors.mount_style.message}</p>
        )}
        {mountStyle === 'Other' && (
          <input
            {...register('mount_style_custom')}
            type="text"
            placeholder="Specify mount style..."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        )}
      </div>

      {/* Quoted Price & Deposit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Quoted Price ($) <span className="text-red-500">*</span>
          </label>
          <input
            {...register('quoted_price')}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
          {errors.quoted_price && (
            <p className="text-xs text-red-500 mt-1">{errors.quoted_price.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Deposit Amount ($)</label>
          <input
            {...register('deposit_amount')}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        </div>
      </div>

      {/* Estimated Completion Date */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Estimated Completion Date <span className="text-red-500">*</span>
        </label>
        <input
          {...register('estimated_completion_date')}
          type="date"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
        />
        {errors.estimated_completion_date && (
          <p className="text-xs text-red-500 mt-1">{errors.estimated_completion_date.message}</p>
        )}
      </div>

      {/* Referral Source */}
      <div>
        <label className="block text-sm font-medium mb-1">Referral Source</label>
        <select
          {...register('referral_source')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
        >
          <option value="">Select referral source...</option>
          {REFERRAL_SOURCES.map((source) => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
        {referralSource === 'Other' && (
          <input
            {...register('referral_source_custom')}
            type="text"
            placeholder="Specify referral source..."
            className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--brand)]"
          />
        )}
      </div>

      {/* Rush & Social Media Consent */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            {...register('is_rush')}
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[var(--brand)]"
          />
          <span className="text-sm font-medium">Rush Job</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            {...register('social_media_consent')}
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-[var(--brand)]"
          />
          <span className="text-sm font-medium">Customer consents to social media posting</span>
        </label>
      </div>

      {/* Photo Upload Zone */}
      <div>
        <label className="block text-sm font-medium mb-2">Photos</label>
        <PhotoUploadZone
          ref={photoZoneRef}
          jobId={jobId}
          onUploadComplete={() => {
            // Paths are captured in uploadAll return value during onSubmit
          }}
        />
      </div>

      {/* Server error */}
      {serverError && (
        <p className="text-sm text-red-500">{serverError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isSubmitting ? 'Saving...' : 'Save Job'}
      </button>

    </form>
  )
}
