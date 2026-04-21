import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function requireAdminAccess() {
	const session = await getServerSession(authOptions)
	const role = session?.user?.role ?? 'guest'

	if (!session || !['admin', 'teacher'].includes(role)) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
	}

	return null
}
