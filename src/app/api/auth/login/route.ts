import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return Response.json({ error: 'Email and password required' }, { status: 400 })
  }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await getSession()
  session.userId = user.id
  session.email = user.email
  await session.save()

  return Response.json({ ok: true })
}
