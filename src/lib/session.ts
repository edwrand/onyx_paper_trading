import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  userId: string
  email: string
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'onyx-session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
}

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}
