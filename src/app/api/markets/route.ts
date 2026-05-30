import { getSession } from '@/lib/session'
import { getMarkets } from '@/lib/onyx'

export async function GET() {
  const session = await getSession()
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const markets = await getMarkets()
  return Response.json(markets)
}
