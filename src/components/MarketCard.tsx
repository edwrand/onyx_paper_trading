'use client'

import { useState } from 'react'
import { Market } from '@/lib/onyx'
import OrderModal from './OrderModal'
import { parseName } from '@/lib/utils'

interface Props {
  market: Market
  onOrderSuccess: () => void
}

export default function MarketCard({ market, onOrderSuccess }: Props) {
  const [showModal, setShowModal] = useState(false)
  const { matchup, outcome } = parseName(market.name)

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-gray-600 transition-colors">
        <div className="min-w-0 flex-1">
          <p className="text-white font-medium truncate">{matchup}</p>
          <p className="text-gray-400 text-sm truncate">{outcome}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-green-400 font-mono font-semibold">
              {(market.yes_price * 100).toFixed(0)}¢
            </p>
            <p className="text-gray-500 text-xs">YES</p>
          </div>
          <div className="text-right">
            <p className="text-red-400 font-mono font-semibold">
              {((1 - market.yes_price) * 100).toFixed(0)}¢
            </p>
            <p className="text-gray-500 text-xs">NO</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Trade
          </button>
        </div>
      </div>
      {showModal && (
        <OrderModal
          market={market}
          onClose={() => setShowModal(false)}
          onSuccess={onOrderSuccess}
        />
      )}
    </>
  )
}
