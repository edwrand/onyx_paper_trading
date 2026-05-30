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
