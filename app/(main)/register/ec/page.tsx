'use client'
import { signIn } from 'next-auth/react'

export default function EnglishConnectRegister() {
	const inviteCode = 'game2025'

	const handleGoogle = () => {
		// Add the invite code to the auth URL so we can read it in callbacks
		signIn('google', { callbackUrl: `/welcome?invite=${inviteCode}` })
	}

	return (
		<main className="p-8 text-center">
			<h1 className="text-3xl mb-4">Register for EC1</h1>
			<p>Sign in with Google to begin.</p>
			<button
				onClick={handleGoogle}
				className="mt-4 px-6 py-2 bg-blue-600 text-white rounded"
			>
				Sign in with Google
			</button>
		</main>
	)
}
