// app/[locale]/(auth)/login/page.tsx
import { LoginForm } from '@/components/auth/login'

export default function LoginPage() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4 py-10">
			<LoginForm />
		</div>
	)
}
