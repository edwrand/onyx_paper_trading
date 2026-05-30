'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { parseName } from '@/lib/utils'

interface Order {
  id: string
  symbol: string
  marketName: string
  side: string
  quantity: number
  fillPrice: number
  totalCost: number
  createdAt: string
}

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/orders/history')
      .then((r) => {
        if (r.status === 401) { router.push('/login'); return null }
        return r.json()
      })
      .then((d) => { if (d) { setOrders(d); setLoading(false) } })
      .catch(() => setLoading(false))
  }, [router])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-bold text-xl">Order History</h1>
          <span className="text-gray-500 text-sm">{orders.length} orders</span>
        </div>

        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="text-gray-500 text-center py-12">No orders yet. Go place some trades.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((order) => {
              const { matchup, outcome } = parseName(order.marketName)
              const date = new Date(order.createdAt)
              return (
                <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium truncate">{matchup}</p>
                      <p className="text-gray-400 text-sm truncate">{outcome}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.side === 'YES' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {order.side}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Qty</p>
                      <p className="text-white font-mono">{order.quantity}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Fill Price</p>
                      <p className="text-white font-mono">${order.fillPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Total Cost</p>
                      <p className="text-white font-mono">${order.totalCost.toFixed(2)}</p>
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
