'use client'

import { useState } from 'react'
import { Market } from '@/lib/onyx'

function parseName(name: string) {
  const parts = name.split(' ; ')
  return { matchup: parts[0] ?? name, outcome: parts[1] ?? '' }
}

interface Props {
  market: Market
  onClose: () => void
  onSuccess: () => void
}

interface Fill {
  side: 'YES' | 'NO'
  quantity: number
  fillPrice: number
  totalCost: number
}

export default function OrderModal({ market, onClose, onSuccess }: Props) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState<Fill | null>(null)

  const { matchup, outcome } = parseName(market.name)
  const fillPrice = side === 'YES' ? market.yes_price : 1 - market.yes_price
  const totalCost = fillPrice * quantity

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: market.symbol, marketName: market.name, side, quantity }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Order failed — please try again')
        return
      }
      setConfirmed({ side, quantity, fillPrice: data.fillPrice, totalCost: data.totalCost })
      onSuccess()
    } catch {
      setError('Network error — check your connection and try again')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-lg mb-1">Order Confirmed</h2>
            <p className="text-gray-400 text-sm mb-6">{matchup} · {outcome}</p>
            <div className="w-full bg-gray-800 rounded-lg p-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-gray-500 text-xs mb-1">Side</p>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${confirmed.side === 'YES' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                  {confirmed.side}
                </span>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Qty</p>
                <p className="text-white font-mono font-semibold">{confirmed.quantity}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Fill Price</p>
                <p className="text-white font-mono font-semibold">
                  ${(confirmed.fillPrice ?? fillPrice).toFixed(2)}
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4">
              Total cost: <span className="text-white font-mono">${(confirmed.totalCost ?? totalCost).toFixed(2)}</span>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md p-6">
        <div className="mb-4">
          <p className="text-white font-semibold">{matchup}</p>
          <p className="text-gray-400 text-sm">{outcome}</p>
        </div>

        <div className="flex gap-2 mb-4">
          {(['YES', 'NO'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                side === s
                  ? s === 'YES'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s} @ ${(s === 'YES' ? market.yes_price : 1 - market.yes_price).toFixed(2)}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-gray-400 text-sm block mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="flex justify-between text-sm text-gray-400 mb-4">
          <span>Est. cost</span>
          <span className="text-white font-mono">${totalCost.toFixed(2)}</span>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-3 py-2 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Placing…' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
