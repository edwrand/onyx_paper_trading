'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [balance, setBalance] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setBalance(d.balance ?? null))
      .catch(() => {})
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-gray-800 bg-gray-950">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          Onyx Paper
        </Link>
        <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
          Markets
        </Link>
        <Link href="/positions" className="text-gray-400 hover:text-white text-sm transition-colors">
          Positions
        </Link>
        <Link href="/history" className="text-gray-400 hover:text-white text-sm transition-colors">
          History
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {balance !== null && (
          <span className="text-green-400 font-mono text-sm">
            ${balance.toFixed(2)}
          </span>
        )}
        <button
          onClick={logout}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
