// lib/auth.ts
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

/**
 * Get the full NextAuth session (server-side)
 */
export const getSession = () => getServerSession(options)

/**
 * Get the userId from session or guest cookie.
 * - Returns NextAuth user ID if logged in
 * - Returns guestId cookie if set
 * - Otherwise returns null
 */
export const getUserId = async (): Promise<string | null> => {
	const session = await getServerSession(options)
	if (session?.user?.id) return session.user.id

	const cookieStore = cookies()
	const guestId = cookieStore.get('guestId')?.value
	return guestId ?? null
}

/**
 * Helper that throws if not authenticated (for protected routes only)
 */
export const getUserOrThrow = async (): Promise<string> => {
	const userId = await getUserId()
	if (!userId) throw new Error('Unauthorized')
	return userId
}

/**
 * Get active course ID for guest or signed-in user.
 * - Returns activeCourseId from cookie for guests
 * - Otherwise returns null (since logged-in users are tracked in DB)
 */
export const getActiveCourseId = async (): Promise<number | null> => {
	const cookieStore = cookies()
	const guestCourseId = cookieStore.get('guestActiveCourseId')?.value
	return guestCourseId ? Number(guestCourseId) : null
}

/**
 * Quick check to see if current visitor is a guest
 */
export const isGuestUser = async (): Promise<boolean> => {
	const userId = await getUserId()
	return !!userId && userId.startsWith('guest')
}
