'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MarketCard from '@/components/MarketCard'
import { Market } from '@/lib/onyx'

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [navKey, setNavKey] = useState(0)
  const router = useRouter()

  const fetchMarkets = useCallback(async () => {
    const res = await fetch('/api/markets')
    if (res.status === 401) {
      router.push('/login')
      return
    }
    const data = await res.json()
    setMarkets(data)
    setLoading(false)
  }, [router])

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 5000)
    return () => clearInterval(interval)
  }, [fetchMarkets])

  const filtered = markets.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function handleOrderSuccess() {
    setNavKey((k) => k + 1)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar key={navKey} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-bold text-xl">Markets</h1>
          <span className="text-gray-500 text-sm">{filtered.length} markets</span>
        </div>
        <input
          type="text"
          placeholder="Search markets…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 mb-4"
        />
        {loading ? (
          <div className="text-gray-500 text-center py-12">Loading markets…</div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((m) => (
              <MarketCard key={m.symbol} market={m} onOrderSuccess={handleOrderSuccess} />
            ))}
            {filtered.length === 0 && (
              <div className="text-gray-500 text-center py-12">No markets found</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
