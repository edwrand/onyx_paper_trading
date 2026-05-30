import { getSession } from '@/lib/session'
import { db } from '@/lib/db'
import { getMarkets } from '@/lib/onyx'

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

  const markets = await getMarkets()
  const priceMap = new Map(markets.map((m) => [m.symbol, m.yes_price]))

  const enriched = positions.map((pos) => {
    const yesPrice = priceMap.get(pos.symbol) ?? null
    const currentPrice = yesPrice !== null
      ? pos.side === 'YES' ? yesPrice : 1 - yesPrice
      : null
    const pnl = currentPrice !== null
      ? (currentPrice - pos.avgPrice) * pos.quantity
      : null
    return { ...pos, currentPrice, pnl }
  })

  return Response.json(enriched)
}
