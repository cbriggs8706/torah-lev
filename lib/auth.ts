// lib/auth.ts
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

/**
 * Get the full NextAuth session (server-side)
 */
export const getSession = () => getServerSession(options)

/**
 * Get only the userId from the current session
 */
export const getUserId = async (): Promise<string | null> => {
	const session = await getServerSession(options)
	return session?.user?.id ?? null
}

/**
 * Helper that throws if not authenticated
 */
export const getUserOrThrow = async (): Promise<string> => {
	const userId = await getUserId()
	if (!userId) throw new Error('Unauthorized')
	return userId
}
