'use client'
import { useActionState, useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Zap, Trash2, Camera } from 'lucide-react'
import { updateJob, toggleJobRush, updateJobStage, deleteJob, addJobPhotos } from '@/actions/jobs'
import { PhotoUploadZone } from '@/components/photo-upload-zone'
import type { PhotoUploadZoneHandle } from '@/components/photo-upload-zone'
import type { Job, Stage } from '@/types/database'

const ANIMAL_TYPES = [
  'Deer', 'White-tail Deer', 'Elk', 'Bear', 'Turkey',
  'Fish', 'Duck', 'Pheasant', 'Antelope', 'Mountain Lion', 'Boar', 'Other',
]
const MOUNT_STYLES = [
  'Shoulder Mount', 'Full Body', 'European/Skull',
  'Fish Panel', 'Life-Size', 'Half Mount', 'Other',
]
const REFERRAL_SOURCES = [
  'Facebook', 'Google', 'Word of Mouth',
  'Walk-In', 'Instagram', 'Repeat Customer', 'Other',
]

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`
}

interface JobDetailClientProps {
  job: Job & { is_overdue: boolean }
  stages: Stage[]
  photoUrls: { path: string; url: string }[]
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function JobDetailClient({ job, stages, photoUrls }: JobDetailClientProps) {
  const router = useRouter()
  const [isRush, setIsRush] = useState(job.is_rush)
  const [stageId, setStageId] = useState(job.stage_id ?? '')
  const [, startTransition] = useTransition()
  const [state, formAction, pending] = useActionState(updateJob, undefined)

  const photoZoneRef = useRef<PhotoUploadZoneHandle>(null)
  const [uploadPending, setUploadPending] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

  // Detect if current values are in the known lists
  const animalIsCustom = !ANIMAL_TYPES.slice(0, -1).includes(job.animal_type) && job.animal_type !== 'Other'
  const mountIsCustom = !MOUNT_STYLES.slice(0, -1).includes(job.mount_style) && job.mount_style !== 'Other'
  const referralIsCustom = job.referral_source !== null &&
    !REFERRAL_SOURCES.slice(0, -1).includes(job.referral_source) && job.referral_source !== 'Other'

  const [animalSelect, setAnimalSelect] = useState(animalIsCustom ? 'Other' : (job.animal_type || ''))
  const [mountSelect, setMountSelect] = useState(mountIsCustom ? 'Other' : (job.mount_style || ''))
  const [referralSelect, setReferralSelect] = useState(
    referralIsCustom ? 'Other' : (job.referral_source || '')
  )

  const portalUrl = `${process.env.NEXT_PUBLIC_URL}/portal/${job.portal_token}`
  const balance = job.quoted_price - (job.deposit_amount ?? 0)
  const jobNum = `#${String(job.job_number).padStart(4, '0')}`
  const saved = state && 'success' in state

  function handleRushToggle() {
    const next = !isRush
    setIsRush(next)
    startTransition(async () => {
      await toggleJobRush(job.id, next)
    })
  }

  function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setStageId(next)
    startTransition(async () => {
      await updateJobStage(job.id, next)
    })
  }

  async function handleDelete() {
    if (!confirm(`Delete ${jobNum} for ${job.customer_name}? This cannot be undone.`)) return
    await deleteJob(job.id)
    router.push('/board')
  }

  async function handlePhotoUpload() {
    if (!photoZoneRef.current) return
    setUploadPending(true)
    setUploadError(null)
    setUploadSuccess(false)
    try {
      const newPaths = await photoZoneRef.current.uploadAll()
      if (newPaths.length > 0) {
        const result = await addJobPhotos(job.id, newPaths)
        if (result.error) {
          setUploadError(result.error)
        } else {
          setUploadSuccess(true)
          // page will revalidate and re-render with new photos
        }
      }
    } catch {
      setUploadError('Upload failed')
    } finally {
      setUploadPending(false)
    }
  }

  return (
    <div className="h-full flex flex-col">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/board"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Board
          </Link>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xl font-semibold truncate">
              {jobNum} — {job.customer_name}
            </h1>
            {job.is_overdue && (
              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                Overdue
              </span>
            )}
            {isRush && (
              <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Rush
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="grid grid-cols-3 gap-6">

            {/* ── Left: editable form ── */}
            <form action={formAction} className="col-span-2 space-y-6">
              <input type="hidden" name="job_id" value={job.id} />

              {/* Customer */}
              <Section title="Customer">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name *" name="customer_name" defaultValue={job.customer_name} required />
                  <Field label="Phone" name="customer_phone" type="tel" defaultValue={job.customer_phone ?? ''} />
                </div>
                <Field label="Email" name="customer_email" type="email" defaultValue={job.customer_email ?? ''} />
              </Section>

              {/* Job Details */}
              <Section title="Job Details">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Animal Type *</label>
                    <select
                      name="animal_type"
                      value={animalSelect}
                      onChange={(e) => setAnimalSelect(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="">Select...</option>
                      {ANIMAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    {animalSelect === 'Other' && (
                      <input
                        name="animal_type_custom"
                        type="text"
                        placeholder="Specify..."
                        defaultValue={animalIsCustom ? job.animal_type : ''}
                        className={inputCls}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Mount Style *</label>
                    <select
                      name="mount_style"
                      value={mountSelect}
                      onChange={(e) => setMountSelect(e.target.value)}
                      className={selectCls}
                      required
                    >
                      <option value="">Select...</option>
                      {MOUNT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {mountSelect === 'Other' && (
                      <input
                        name="mount_style_custom"
                        type="text"
                        placeholder="Specify..."
                        defaultValue={mountIsCustom ? job.mount_style : ''}
                        className={inputCls}
                      />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Referral Source</label>
                    <select
                      name="referral_source"
                      value={referralSelect}
                      onChange={(e) => setReferralSelect(e.target.value)}
                      className={selectCls}
                    >
                      <option value="">None</option>
                      {REFERRAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {referralSelect === 'Other' && (
                      <input
                        name="referral_source_custom"
                        type="text"
                        placeholder="Specify..."
                        defaultValue={referralIsCustom ? (job.referral_source ?? '') : ''}
                        className={inputCls}
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Social Media Consent</label>
                    <select
                      name="social_media_consent"
                      defaultValue={job.social_media_consent ? 'true' : 'false'}
                      className={selectCls}
                    >
                      <option value="true">Yes — consented</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>
              </Section>

              {/* Financial */}
              <Section title="Financial">
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Quoted Price ($) *" name="quoted_price" type="number" step="0.01" min="0.01" defaultValue={String(job.quoted_price)} required />
                  <Field label="Deposit ($)" name="deposit_amount" type="number" step="0.01" min="0" defaultValue={job.deposit_amount != null ? String(job.deposit_amount) : ''} />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-muted-foreground">Balance Due</label>
                    <div className="h-9 flex items-center px-3 rounded-md border bg-muted/40 text-sm font-medium">
                      ${balance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </Section>

              {/* Timeline */}
              <Section title="Timeline">
                <Field label="Estimated Completion *" name="estimated_completion_date" type="date" defaultValue={job.estimated_completion_date} required />
              </Section>

              {/* Notes */}
              <Section title="Notes">
                <textarea
                  name="notes"
                  defaultValue={job.notes ?? ''}
                  rows={5}
                  placeholder="Add any internal notes about this job…"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)] resize-y"
                />
              </Section>

              {/* Error / success feedback */}
              {state && 'error' in state && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded px-3 py-2">
                  {state.error}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="px-5 py-2 rounded-md bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {pending ? 'Saving…' : 'Save Changes'}
                </button>
                {saved && !pending && (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                )}
              </div>
            </form>

            {/* ── Right sidebar ── */}
            <div className="space-y-4">

              {/* Stage */}
              <SideCard title="Stage">
                <select
                  value={stageId}
                  onChange={handleStageChange}
                  className={selectCls}
                >
                  {!stageId && <option value="">No stage</option>}
                  {stages.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </SideCard>

              {/* Rush */}
              <SideCard title="Rush Order">
                <button
                  type="button"
                  onClick={handleRushToggle}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md w-full transition-colors
                    ${isRush
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                    }`}
                >
                  <Zap className="h-4 w-4" fill={isRush ? 'currentColor' : 'none'} />
                  {isRush ? 'Rush — click to remove' : 'Not rush — click to mark'}
                </button>
              </SideCard>

              {/* Dates */}
              <SideCard title="Dates">
                <div className="space-y-1.5 text-sm">
                  <Row label="Job Created" value={formatDate(job.created_at.slice(0, 10))} />
                  <Row label="Est. Completion" value={formatDate(job.estimated_completion_date)} />
                </div>
              </SideCard>

              {/* Photos */}
              {photoUrls.length > 0 && (
                <SideCard title={`Photos (${photoUrls.length})`}>
                  <div className="grid grid-cols-2 gap-2">
                    {photoUrls.map(({ path, url }) => (
                      <a key={path} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt="Job photo"
                          className="rounded-md w-full aspect-square object-cover hover:opacity-90 transition-opacity"
                        />
                      </a>
                    ))}
                  </div>
                </SideCard>
              )}

              {/* Add Photos */}
              <SideCard title="Add Photos">
                <div className="space-y-3">
                  <PhotoUploadZone
                    ref={photoZoneRef}
                    jobId={job.id}
                    capture="environment"
                    onUploadComplete={() => { setUploadSuccess(false); setUploadError(null) }}
                  />
                  {uploadError && (
                    <p className="text-xs text-red-500">{uploadError}</p>
                  )}
                  {uploadSuccess && (
                    <p className="text-xs text-green-600 dark:text-green-400">Photos uploaded!</p>
                  )}
                  <button
                    type="button"
                    onClick={handlePhotoUpload}
                    disabled={uploadPending}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Camera className="h-4 w-4" />
                    {uploadPending ? 'Uploading\u2026' : 'Upload Photos'}
                  </button>
                </div>
              </SideCard>

              {/* Customer Portal Link */}
              <SideCard title="Customer Portal Link">
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share this link with your customer — no login required.
                  </p>
                  <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 dark:bg-gray-800">
                    <code className="min-w-0 flex-1 truncate text-xs text-gray-700 dark:text-gray-300">
                      {portalUrl}
                    </code>
                    <CopyButton value={portalUrl} />
                  </div>
                </div>
              </SideCard>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared style strings ──
const inputCls = 'h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]'
const selectCls = 'h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]'

// ── Small reusable components ──
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, name, defaultValue, type = 'text', required, step, min }: {
  label: string; name: string; defaultValue: string
  type?: string; required?: boolean; step?: string; min?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-xs text-muted-foreground">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue}
        required={required} step={step} min={min} className={inputCls} />
    </div>
  )
}

function SideCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b bg-muted/40 shrink-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
