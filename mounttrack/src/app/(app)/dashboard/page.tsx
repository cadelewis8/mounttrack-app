import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Zap, DollarSign, Briefcase } from 'lucide-react'
import type { Job, Stage } from '@/types/database'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${MONTHS[parseInt(m) - 1]} ${parseInt(d)}, ${y}`
}
function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function jobNum(n: number) {
  return `#${String(n).padStart(4, '0')}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub ?? null
  if (!userId) redirect('/login')

  const [jobsRes, stagesRes, paymentsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('jobs') as any)
      .select('id, job_number, customer_name, animal_type, stage_id, quoted_price, deposit_amount, estimated_completion_date, is_rush, created_at')
      .eq('shop_id', userId)
      .order('created_at', { ascending: false }) as Promise<{ data: Job[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('stages') as any)
      .select('id, name, position')
      .eq('shop_id', userId)
      .order('position', { ascending: true }) as Promise<{ data: Stage[] | null }>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from('payments') as any)
      .select('amount_cents')
      .eq('shop_id', userId) as Promise<{ data: { amount_cents: number }[] | null }>,
  ])

  const jobs = jobsRes.data ?? []
  const stages = stagesRes.data ?? []
  const paymentsData = paymentsRes.data ?? []

  const todayStr = new Date().toISOString().slice(0, 10)
  const in14 = new Date()
  in14.setDate(in14.getDate() + 14)
  const in14Str = in14.toISOString().slice(0, 10)

  // Stats
  const totalJobs = jobs.length
  const overdueCount = jobs.filter((j) => j.estimated_completion_date < todayStr).length
  const rushCount = jobs.filter((j) => j.is_rush).length
  const totalQuoted = jobs.reduce((s, j) => s + j.quoted_price, 0)
  const totalDeposits = jobs.reduce((s, j) => s + (j.deposit_amount ?? 0), 0)
  const totalStripePaid = paymentsData.reduce((s, p) => s + p.amount_cents, 0) / 100
  const balanceDue = totalQuoted - totalDeposits - totalStripePaid

  // Jobs per stage
  const jobsByStage = stages.map((s) => ({
    ...s,
    count: jobs.filter((j) => j.stage_id === s.id).length,
  }))
  const maxCount = Math.max(...jobsByStage.map((s) => s.count), 1)

  // Lists
  const recentJobs = jobs.slice(0, 8)
  const dueSoon = jobs
    .filter((j) => j.estimated_completion_date >= todayStr && j.estimated_completion_date <= in14Str)
    .sort((a, b) => a.estimated_completion_date.localeCompare(b.estimated_completion_date))

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{fmtDate(todayStr)}</p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Active Jobs"
            value={String(totalJobs)}
            icon={<Briefcase className="h-5 w-5" />}
          />
          <StatCard
            label="Overdue"
            value={String(overdueCount)}
            icon={<AlertTriangle className="h-5 w-5" />}
            accent="red"
          />
          <StatCard
            label="Rush Orders"
            value={String(rushCount)}
            icon={<Zap className="h-5 w-5" />}
            accent="amber"
          />
          <StatCard
            label="Balance Due"
            value={fmtMoney(balanceDue)}
            icon={<DollarSign className="h-5 w-5" />}
            accent="green"
          />
        </div>

        {/* ── Middle row ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Jobs by Stage */}
          <Card title="Jobs by Stage">
            {jobsByStage.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stages configured.</p>
            ) : (
              <div className="space-y-3">
                {jobsByStage.map((s) => (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{s.name}</span>
                      <span className="font-medium tabular-nums">{s.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--brand)] transition-all duration-500"
                        style={{ width: s.count === 0 ? '0%' : `${Math.max((s.count / maxCount) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Revenue */}
          <Card title="Revenue Summary">
            <div className="space-y-3">
              <RevenueRow label="Total Quoted" value={fmtMoney(totalQuoted)} />
              <RevenueRow label="Deposits Collected" value={fmtMoney(totalDeposits)} />
              <div className="border-t pt-3">
                <RevenueRow label="Outstanding Balance" value={fmtMoney(balanceDue)} bold />
              </div>
              {totalJobs > 0 && (
                <div className="border-t pt-3">
                  <RevenueRow label="Avg. Job Value" value={fmtMoney(totalQuoted / totalJobs)} />
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Bottom row ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Recent jobs */}
          <Card title="Recent Jobs">
            {recentJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs yet.</p>
            ) : (
              <div className="-mx-1">
                {recentJobs.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{jobNum(j.job_number)}</span>
                      <span className="text-sm font-medium truncate">{j.customer_name}</span>
                      <span className="text-xs text-muted-foreground truncate">{j.animal_type}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {j.is_rush && <span className="text-xs text-amber-500 font-medium">Rush</span>}
                      <span className="text-xs text-muted-foreground">{fmtDate(j.estimated_completion_date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Due soon */}
          <Card title="Due in Next 14 Days">
            {dueSoon.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing due in the next 14 days.</p>
            ) : (
              <div className="-mx-1">
                {dueSoon.map((j) => (
                  <Link
                    key={j.id}
                    href={`/jobs/${j.id}`}
                    className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{jobNum(j.job_number)}</span>
                      <span className="text-sm font-medium truncate">{j.customer_name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {j.is_rush && <span className="text-xs text-amber-500 font-medium">Rush</span>}
                      <span className="text-xs font-medium">{fmtDate(j.estimated_completion_date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// ── Components ──

type Accent = 'red' | 'amber' | 'green' | undefined

const accentStyles: Record<NonNullable<Accent>, { bg: string; text: string; icon: string }> = {
  red:   { bg: 'bg-red-50 dark:bg-red-950/30',   text: 'text-red-700 dark:text-red-400',   icon: 'text-red-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: 'text-amber-500' },
  green: { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-700 dark:text-green-400', icon: 'text-green-500' },
}

function StatCard({ label, value, icon, accent }: {
  label: string; value: string; icon: React.ReactNode; accent?: Accent
}) {
  const style = accent ? accentStyles[accent] : null
  return (
    <div className={`rounded-xl border shadow-sm p-5 flex items-start justify-between ${style?.bg ?? 'bg-card'}`}>
      <div>
        <p className={`text-xs font-medium uppercase tracking-wide ${style?.text ?? 'text-muted-foreground'}`}>
          {label}
        </p>
        <p className={`text-2xl font-bold mt-1 tabular-nums ${style?.text ?? 'text-foreground'}`}>
          {value}
        </p>
      </div>
      <div className={`mt-0.5 ${style?.icon ?? 'text-muted-foreground'}`}>
        {icon}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b bg-muted/40">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function RevenueRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className={bold ? 'font-medium' : 'text-muted-foreground'}>{label}</span>
      <span className={`tabular-nums ${bold ? 'font-bold text-base' : ''}`}>{value}</span>
    </div>
  )
}
