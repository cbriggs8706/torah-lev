import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getSession() {
	return await getServerSession(authOptions)
}

export async function getUserId() {
	const session = await getSession()
	return session?.user?.id ?? null
}

export async function getUserRole() {
	const session = await getSession()
	return session?.user?.role ?? 'guest'
}
