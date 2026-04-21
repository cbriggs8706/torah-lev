// app/[locale]/(auth)/register/page.tsx
'use client'

import { SignUpForm } from '@/components/auth/signup'

export default function RegisterPage() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-10">
			<SignUpForm />
		</div>
	)
}
