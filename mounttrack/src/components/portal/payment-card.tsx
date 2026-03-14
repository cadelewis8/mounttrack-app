'use client'

import { useState } from 'react'

interface PaymentCardProps {
  portalToken: string
  quotedCents: number
  depositCents: number
  priorPayments: { amount_cents: number; paid_at: string }[]
  remainingCents: number
}

function fmtMoney(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

function fmtPaymentDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PaymentCard({
  portalToken,
  quotedCents,
  depositCents,
  priorPayments,
  remainingCents,
}: PaymentCardProps) {
  const [amountDollars, setAmountDollars] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  function validate(value: string): string | null {
    const num = parseFloat(value)
    if (isNaN(num) || value === '') return null
    if (num < 50) return 'Minimum payment is $50.00'
    if (num > remainingCents / 100) {
      return `Amount cannot exceed remaining balance of ${fmtMoney(remainingCents)}`
    }
    return null
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    setAmountDollars(value)
    setValidationError(validate(value))
    setApiError(null)
  }

  async function handlePay() {
    const num = parseFloat(amountDollars)
    const error = validate(amountDollars)
    if (error || isNaN(num) || amountDollars === '') {
      if (error) setValidationError(error)
      return
    }

    setIsLoading(true)
    setApiError(null)

    try {
      const res = await fetch('/api/create-payment-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portalToken,
          amountCents: Math.round(num * 100),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setApiError(data.error ?? 'Something went wrong. Please try again.')
        setIsLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setApiError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  const isButtonDisabled =
    isLoading ||
    amountDollars === '' ||
    !!validationError ||
    isNaN(parseFloat(amountDollars))

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-4">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
        Payment
      </h2>

      {/* Payment breakdown */}
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Quoted price</span>
          <span>{fmtMoney(quotedCents)}</span>
        </div>

        {depositCents > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Deposit paid</span>
            <span>−{fmtMoney(depositCents)}</span>
          </div>
        )}

        {priorPayments.map((p, i) => (
          <div key={i} className="flex justify-between text-gray-500">
            <span>Payment — {fmtPaymentDate(p.paid_at)}</span>
            <span>−{fmtMoney(p.amount_cents)}</span>
          </div>
        ))}

        <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
          <span>Remaining balance</span>
          <span>{fmtMoney(remainingCents)}</span>
        </div>
      </div>

      {/* Amount input */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="payment-amount">
          Payment amount ($)
        </label>
        <input
          id="payment-amount"
          type="number"
          step="0.01"
          min="50"
          max={remainingCents / 100}
          value={amountDollars}
          onChange={handleAmountChange}
          placeholder="0.00"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent"
        />
        {validationError && (
          <p className="mt-1 text-xs text-red-600">{validationError}</p>
        )}
        {apiError && (
          <p className="mt-1 text-xs text-red-600">{apiError}</p>
        )}
      </div>

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={isButtonDisabled}
        className="mt-4 w-full rounded-md bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
      >
        {isLoading ? 'Redirecting…' : 'Pay Now'}
      </button>
    </div>
  )
}
