'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { parseName } from '@/lib/utils'

interface Position {
  id: string
  symbol: string
  marketName: string
  side: string
  quantity: number
  avgPrice: number
  currentPrice: number | null
  pnl: number | null
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/positions')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then((d) => { if (d) { setPositions(d); setLoading(false) } })
      .catch(() => {})
  }, [router])

  const totalPnl = positions.reduce((sum, p) => sum + (p.pnl ?? 0), 0)

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-bold text-xl">Positions</h1>
          {positions.length > 0 && (
            <span className={`font-mono font-semibold text-sm ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} total P&L
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading…</div>
        ) : positions.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No positions yet. Go place some trades.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {positions.map((pos) => {
              const { matchup, outcome } = parseName(pos.marketName)
              return (
                <div key={pos.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{matchup}</p>
                      <p className="text-gray-400 text-sm truncate">{outcome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${pos.side === 'YES' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {pos.side}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Qty</p>
                      <p className="text-white font-mono">{pos.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Avg Fill</p>
                      <p className="text-white font-mono">${pos.avgPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Current</p>
                      <p className="text-white font-mono">
                        {pos.currentPrice !== null ? `$${pos.currentPrice.toFixed(2)}` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">P&L</p>
                      <p className={`font-mono font-semibold ${pos.pnl === null ? 'text-gray-500' : pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pos.pnl === null ? '—' : `${pos.pnl >= 0 ? '+' : ''}$${pos.pnl.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
