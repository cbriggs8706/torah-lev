import { Suspense } from 'react'

import SignInClient from './signin-client'

export default function AuthPage() {
	return (
		<Suspense fallback={null}>
			<SignInClient />
		</Suspense>
	)
}
