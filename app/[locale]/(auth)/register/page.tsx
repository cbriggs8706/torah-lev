'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function RegisterPage() {
	const [form, setForm] = useState({
		username: '',
		email: '',
		password: '',
	})
	const [loading, setLoading] = useState(false)
	const router = useRouter()
	const { locale } = useParams() as { locale: string }

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault()
		setLoading(true)
		const res = await fetch(`/${locale}/api/auth/register`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form),
		})
		setLoading(false)

		if (res.ok) {
			alert('✅ Account created!')
			router.push(`/${locale}/auth/login`)
		} else {
			const data = await res.json()
			alert(data.error || '❌ Failed to register.')
		}
	}

	return (
		<div className="max-w-md mx-auto p-6">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl font-bold text-center">
						Create an Account
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								type="text"
								value={form.username}
								onChange={(e) => setForm({ ...form, username: e.target.value })}
								required
							/>
						</div>

						<div>
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={form.email}
								onChange={(e) => setForm({ ...form, email: e.target.value })}
								required
							/>
						</div>

						<div>
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								value={form.password}
								onChange={(e) => setForm({ ...form, password: e.target.value })}
								required
							/>
						</div>

						<Button type="submit" disabled={loading} className="w-full">
							{loading ? 'Creating Account...' : 'Register'}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
