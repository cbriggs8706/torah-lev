import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { options } from '@/app/api/auth/[...nextauth]/options'

const isSessionDecodeError = (error: unknown) =>
	error instanceof Error &&
	(error.name === 'JWEDecryptionFailed' ||
		error.message.includes('decryption operation failed'))

/**
 * Get the full NextAuth session (server-side)
 */
export const getSession = async () => {
	try {
		return await getServerSession(options)
	} catch (error) {
		if (isSessionDecodeError(error)) return null
		throw error
	}
}

/**
 * Unified user ID getter:
 * - Returns NextAuth user.id if authenticated
 * - Returns guestId from cookie if set
 * - Otherwise null
 */
export const getUserId = async (): Promise<string | null> => {
	const session = await getSession()
	const cookieStore = await cookies()

	// ✅ 1️⃣ Authenticated user
	if (session?.user?.id) return session.user.id

	// ✅ 2️⃣ Guest fallback
	const guestId = cookieStore.get('guestId')?.value
	if (guestId && guestId.startsWith('guest')) return guestId

	// 🚫 3️⃣ No ID found
	return null
}

/**
 * Throws if user is not authenticated (never returns guest).
 */
export const getUserOrThrow = async (): Promise<string> => {
	const userId = await getUserId()
	if (!userId || userId.startsWith('guest')) throw new Error('Unauthorized')
	return userId
}

/**
 * Active course ID for guests only.
 * Logged-in users track this in the DB.
 */
export const getActiveCourseId = async (): Promise<number | null> => {
	const cookieStore = await cookies()
	const guestCourseId = cookieStore.get('guestActiveCourseId')?.value
	return guestCourseId ? Number(guestCourseId) : null
}

/**
 * Quick boolean for guest state.
 */
export const isGuestUser = async (): Promise<boolean> => {
	const cookieStore = await cookies()
	const guestId = cookieStore.get('guestId')?.value
	if (guestId?.startsWith('guest')) return true

	const session = await getSession()
	return !session?.user?.id
}
