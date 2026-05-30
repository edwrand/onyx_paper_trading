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

export default function OrderModal({ market, onClose, onSuccess }: Props) {
  const [side, setSide] = useState<'YES' | 'NO'>('YES')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { matchup, outcome } = parseName(market.name)
  const fillPrice = side === 'YES' ? market.yes_price : 1 - market.yes_price
  const totalCost = fillPrice * quantity

  async function submit() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: market.symbol, marketName: market.name, side, quantity }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error ?? 'Order failed')
      return
    }
    onSuccess()
    onClose()
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

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

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
