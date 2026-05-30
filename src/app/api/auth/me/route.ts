import { getSession } from '@/lib/session'
import { db } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session.userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, balance: true },
  })

  return Response.json(user)
}
