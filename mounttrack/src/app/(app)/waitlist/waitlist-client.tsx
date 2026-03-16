'use client'
import { useActionState, useTransition } from 'react'
import { createWaitlistEntry, deleteWaitlistEntry } from '@/actions/waitlist'
import type { WaitlistEntry } from '@/types/database'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
function formatDate(iso: string) {
  const [y, m, d] = iso.split('T')[0].split('-')
  return `${parseInt(m)}/${parseInt(d)}/${y}`
}

interface WaitlistClientProps {
  initialEntries: WaitlistEntry[]
}

export function WaitlistClient({ initialEntries }: WaitlistClientProps) {
  const [state, formAction, pending] = useActionState(createWaitlistEntry, undefined)
  const [, startTransition] = useTransition()

  function handleDelete(entryId: string) {
    startTransition(async () => {
      await deleteWaitlistEntry(entryId)
    })
  }

  const success = state && 'success' in state

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b bg-muted/40">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add to Waitlist</h2>
        </div>
        <div className="p-4">
          <form action={formAction} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor="name" className="text-xs text-muted-foreground">Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Customer name"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="phone" className="text-xs text-muted-foreground">Phone *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+1 555 000 0000"
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="animal_type" className="text-xs text-muted-foreground">Animal Type *</label>
              <input
                id="animal_type"
                name="animal_type"
                type="text"
                required
                placeholder="e.g. White-tail Deer, Turkey, Bear…"
                className="h-9 w-full rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand)]"
              />
            </div>
            {state && 'error' in state && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded px-3 py-2">
                {state.error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 rounded px-3 py-2">
                Customer added to waitlist and SMS confirmation sent.
              </p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 rounded-md bg-[var(--brand)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {pending ? 'Adding…' : 'Add to Waitlist'}
            </button>
          </form>
        </div>
      </div>

      {/* Entry list */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 border-b bg-muted/40">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Waitlist ({initialEntries.length})
          </h2>
        </div>
        <div className="divide-y">
          {initialEntries.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center text-muted-foreground">
              No customers on the waitlist yet.
            </p>
          ) : (
            initialEntries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {entry.animal_type} &middot; {entry.phone} &middot; Added {formatDate(entry.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(entry.id)}
                  className="ml-4 shrink-0 text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
