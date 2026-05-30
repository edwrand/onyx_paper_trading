import { db } from './db'
import { getMarketPrices } from './onyx'

export async function placeOrder(
  userId: string,
  symbol: string,
  marketName: string,
  side: 'YES' | 'NO',
  quantity: number
) {
  const prices = await getMarketPrices(symbol)

  if (prices.bid_price === null || prices.ask_price === null) {
    throw new Error('No price available for this market')
  }

  const fillPrice = side === 'YES' ? prices.ask_price : 1 - prices.bid_price
  const totalCost = fillPrice * quantity

  return db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw new Error('User not found')
    if (user.balance < totalCost) throw new Error('Insufficient balance')

    const order = await tx.order.create({
      data: { userId, symbol, marketName, side, quantity, fillPrice, totalCost },
    })

    const existing = await tx.position.findUnique({
      where: { userId_symbol_side: { userId, symbol, side } },
    })

    if (existing) {
      const newQty = existing.quantity + quantity
      const newAvg = (existing.quantity * existing.avgPrice + quantity * fillPrice) / newQty
      await tx.position.update({
        where: { userId_symbol_side: { userId, symbol, side } },
        data: { quantity: newQty, avgPrice: newAvg },
      })
    } else {
      await tx.position.create({
        data: { userId, symbol, marketName, side, quantity, avgPrice: fillPrice },
      })
    }

    await tx.user.update({
      where: { id: userId },
      data: { balance: { decrement: totalCost } },
    })

    return order
  })
}
