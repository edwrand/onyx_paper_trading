const BASE = 'https://predictions.dev-onyxodds.com'
let token: string | null = null

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
  const data = await res.json()
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
  return res.json()
}

export interface Market {
  id: string
  symbol: string
  sport: string
  name: string
  status: string
  yes_price: number
}

export interface MarketPrices {
  symbol: string
  bid_price: number | null
  ask_price: number | null
  last_price: number | null
  volume: number
}

export async function getMarkets(): Promise<Market[]> {
  const all = await onyxFetch('/markets?status=open&limit=1000')
  return (all as any[]).filter((m) => m.yes_price !== null)
}

export async function getMarketPrices(symbol: string): Promise<MarketPrices> {
  return onyxFetch(`/markets/${symbol}/prices`)
}
