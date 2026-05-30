'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MarketCard from '@/components/MarketCard'
import { Market, getContractType } from '@/lib/onyx'

const SPORTS = ['All', 'NBA', 'CBB']
const CONTRACT_TYPES = ['All', 'Moneyline', 'Spread', 'Over', 'Under']

export default function Home() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [search, setSearch] = useState('')
  const [sport, setSport] = useState('All')
  const [contractType, setContractType] = useState('All')
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
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
    setProgress(100)
    setLoading(false)
  }, [router])

  useEffect(() => {
    let progressInterval: ReturnType<typeof setInterval> | null = null
    if (loading) {
      setProgress(0)
      progressInterval = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p
          return p + (90 - p) * 0.08
        })
      }, 400)
    }
    return () => { if (progressInterval) clearInterval(progressInterval) }
  }, [loading])

  useEffect(() => {
    fetchMarkets()
    const interval = setInterval(fetchMarkets, 5000)
    return () => clearInterval(interval)
  }, [fetchMarkets])

  const filtered = markets.filter((m) => {
    if (sport !== 'All' && m.sport !== sport) return false
    if (contractType !== 'All' && getContractType(m.name) !== contractType) return false
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

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
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 mb-3"
        />

        <div className="flex gap-2 mb-3 flex-wrap">
          {SPORTS.map((s) => (
            <button
              key={s}
              onClick={() => setSport(s)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                sport === s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s}
            </button>
          ))}
          <div className="w-px bg-gray-700 mx-1" />
          {CONTRACT_TYPES.map((c) => (
            <button
              key={c}
              onClick={() => setContractType(c)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                contractType === c ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center gap-4">
            <p className="text-gray-400 text-sm">Loading markets…</p>
            <div className="w-full max-w-sm bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((m) => (
              <MarketCard key={m.symbol} market={m} onOrderSuccess={() => setNavKey((k) => k + 1)} />
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
