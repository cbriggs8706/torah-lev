import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

/** Protects a page so only logged-in users can view it */
export async function requireAuth() {
	const session = await getSession()
	if (!session?.user) redirect('/') // or '/' if you prefer
	return session
}

// TODO wire up guest
/** Redirects logged-in users away from login/register pages */
// export async function requireGuest() {
// 	const session = await getSession()
// 	if (session?.user) return <div>Protected content</div>
// 	return session
// }
