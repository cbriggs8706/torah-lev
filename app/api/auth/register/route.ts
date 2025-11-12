import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseDb } from '@/db/client'
import { users } from '@/db/schema/tables/users'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
	try {
		const { username, email, password } = await req.json()

		if (!username || !email || !password) {
			return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
		}

		// Check for duplicates
		const existing = await supabaseDb.query.users.findFirst({
			where: eq(users.email, email),
		})
		if (existing) {
			return NextResponse.json(
				{ error: 'Email already registered' },
				{ status: 409 }
			)
		}

		const hashed = await bcrypt.hash(password, 10)

		await supabaseDb.insert(users).values({
			username,
			email,
			passwordHash: hashed,
		})

		return NextResponse.json({ success: true })
	} catch (err) {
		console.error('Register error:', err)
		return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
	}
}
