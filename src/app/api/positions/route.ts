import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getMarketPrices } from '@/lib/onyx'

export async function GET() {
  const session = await getSession()
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const positions = await db.position.findMany({
    where: { userId: session.userId },
    orderBy: { updatedAt: 'desc' },
  })

  if (positions.length === 0) return Response.json([])

  const symbols = [...new Set(positions.map((p) => p.symbol))]
  const priceResults = await Promise.allSettled(
    symbols.map((s) => getMarketPrices(s).then((p) => ({ symbol: s, p })))
  )
  const priceMap = new Map<string, Awaited<ReturnType<typeof getMarketPrices>>>()
  for (const r of priceResults) {
    if (r.status === 'fulfilled') priceMap.set(r.value.symbol, r.value.p)
  }

  const enriched = positions.map((pos) => {
    const prices = priceMap.get(pos.symbol)
    const lastPrice = prices?.last_price ?? null
    const currentPrice = lastPrice !== null
      ? pos.side === 'YES' ? lastPrice : 1 - lastPrice
      : null
    const pnl = currentPrice !== null
      ? (currentPrice - pos.avgPrice) * pos.quantity
      : null
    return { ...pos, currentPrice, pnl }
  })

  return Response.json(enriched)
}
