import { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { placeOrder } from '@/lib/trading'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { symbol, marketName, side, quantity } = await req.json()
  if (!symbol || !marketName || !side || !quantity) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (side !== 'YES' && side !== 'NO') {
    return Response.json({ error: 'Side must be YES or NO' }, { status: 400 })
  }
  if (quantity < 1) {
    return Response.json({ error: 'Quantity must be at least 1' }, { status: 400 })
  }

  try {
    const order = await placeOrder(session.userId, symbol, marketName, side, quantity)
    return Response.json(order)
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 })
  }
}
