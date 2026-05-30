const BASE = 'https://predictions.dev-onyxodds.com'
let token: string | null = null
let marketsCache: { data: Market[]; ts: number } | null = null
let fetchInFlight: Promise<Market[]> | null = null
const CACHE_TTL = 10000

async function safeJson(res: Response): Promise<any> {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Onyx API returned non-JSON (${res.status}): ${text.slice(0, 100)}`)
  }
}

async function getToken(): Promise<string> {
  if (token) return token
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: process.env.ONYX_USERNAME,
      password: process.env.ONYX_PASSWORD,
    }),
  })
  const data = await safeJson(res)
  if (!data.access_token) throw new Error('Onyx login failed: no access_token in response')
  token = data.access_token
  return token!
}

async function onyxFetch(path: string): Promise<any> {
  const t = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: 'no-store',
  })
  if (res.status === 401) {
    token = null
    return onyxFetch(path)
  }
  return safeJson(res)
}

export type { Market, MarketPrices } from '@/types'
import type { Market, MarketPrices } from '@/types'

function parseSport(symbol: string): string {
  const match = symbol.match(/NX\.F\.OPT\.([A-Z]+)-/)
  return match?.[1] ?? 'OTHER'
}

export function getContractType(name: string): string {
  const outcome = name.split(' ; ')[1] ?? ''
  if (/^over /i.test(outcome)) return 'Over'
  if (/^under /i.test(outcome)) return 'Under'
  if (/[+-]\d/.test(outcome)) return 'Spread'
  return 'Moneyline'
}

async function fetchMarkets(): Promise<Market[]> {
  const all = await onyxFetch('/markets?status=open&limit=1000')
  return (all as any[])
    .filter((m: any) => m.yes_price !== null)
    .map((m: any) => ({ ...m, sport: parseSport(m.symbol) }))
}

export async function getMarkets(): Promise<Market[]> {
  const now = Date.now()
  const stale = marketsCache && now - marketsCache.ts >= CACHE_TTL

  // Kick off background refresh if stale and not already fetching
  if (stale && !fetchInFlight) {
    fetchInFlight = fetchMarkets().then((data) => {
      marketsCache = { data, ts: Date.now() }
      fetchInFlight = null
      return data
    }).catch((err) => {
      fetchInFlight = null
      throw err
    })
  }

  // Return stale cache immediately rather than waiting
  if (marketsCache) return marketsCache.data

  // Cold start: wait for the first fetch
  if (!fetchInFlight) {
    fetchInFlight = fetchMarkets().then((data) => {
      marketsCache = { data, ts: Date.now() }
      fetchInFlight = null
      return data
    }).catch((err) => {
      fetchInFlight = null
      throw err
    })
  }

  return fetchInFlight
}

const priceCache = new Map<string, { data: MarketPrices; ts: number }>()
const PRICE_TTL = 10000

export async function getMarketPrices(symbol: string): Promise<MarketPrices> {
  const now = Date.now()
  const cached = priceCache.get(symbol)
  if (cached && now - cached.ts < PRICE_TTL) return cached.data
  const data = await onyxFetch(`/markets/${symbol}/prices`)
  priceCache.set(symbol, { data, ts: now })
  return data
}
