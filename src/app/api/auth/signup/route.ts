import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return Response.json({ error: 'Email and password required' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return Response.json({ error: 'Email already in use' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({ data: { email, passwordHash } })

  const session = await getSession()
  session.userId = user.id
  session.email = user.email
  await session.save()

  return Response.json({ ok: true })
}
