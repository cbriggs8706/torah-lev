// components/auth/login.tsx
'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Logo } from '@/components/logos/torahlev'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { getSession, signIn } from 'next-auth/react'
import GoogleLogo from '../logos/google'

const formSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters long.'),
	password: z.string().min(8, 'Password must be at least 8 characters long.'),
})

export function LoginForm() {
	const router = useRouter()
	const { locale } = useParams() as { locale: string }
	const t = useTranslations('auth.login')

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: '',
			password: '',
		},
	})

	async function onSubmit(data: z.infer<typeof formSchema>) {
		try {
			const res = await signIn('credentials', {
				username: data.username,
				password: data.password,
				redirect: false,
			})

			if (res?.error) {
				toast.error(t('failure') || '❌ Invalid username or password.')
				return
			}

			toast.success(t('success') || '✅ Logged in!')

			const session = await getSession()
			const role = session?.user?.role

			if (role === 'admin') {
				router.push(`/${locale}/admin-dashboard`)
			} else {
				router.push(`/${locale}/dashboard`)
			}
		} catch {
			toast.error(t('networkError') || 'Network error. Please try again.')
		}
	}

	return (
		<div className="w-full">
			<div className="tl-papyrus-scroll mx-auto w-full max-w-md">
				<div className="tl-papyrus-sheet px-5 py-7">
					<Card className="tl-vellum-panel relative mx-auto w-full rounded-[2rem] overflow-hidden px-0 py-0">
				<CardHeader className="relative z-10 flex flex-col items-center">
					<Logo className="h-9 w-9" />
					<CardTitle className="mt-4 text-xl font-semibold tracking-tight">
						{t('title')}
					</CardTitle>
					<CardDescription>{t('description')}</CardDescription>
				</CardHeader>

				<CardContent className="relative z-10 mt-4">
					<Button
						type="button"
						className="mb-6 w-full gap-3 rounded-full"
						onClick={() =>
							signIn('google', { callbackUrl: `/${locale}/dashboard` })
						}
					>
						<GoogleLogo />
						{t('googleButton')}
					</Button>

					<div className="my-6 w-full flex items-center justify-center">
						<Separator className="flex-1" />
						<span className="px-2 text-sm text-muted-foreground">
							{t('or')}
						</span>
						<Separator className="flex-1" />
					</div>

					<form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
						<FieldGroup>
							<Controller
								name="username"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="login-username">
											{t('usernameLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="login-username"
											type="text"
											placeholder={t('usernamePlaceholder')}
											autoComplete="username"
											aria-invalid={fieldState.invalid}
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>

							<Controller
								name="password"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="login-password">
											{t('passwordLabel')}
										</FieldLabel>
										<Input
											{...field}
											id="login-password"
											type="password"
											placeholder={t('passwordPlaceholder')}
											autoComplete="current-password"
											aria-invalid={fieldState.invalid}
										/>
										<FieldDescription>
											{t('passwordDescription')}
										</FieldDescription>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
					</form>
				</CardContent>

				<CardFooter className="relative z-10 flex flex-col items-center">
					<Button
						type="submit"
						form="login-form"
						className="mb-3 w-full rounded-full"
						disabled={form.formState.isSubmitting}
					>
						{form.formState.isSubmitting
							? t('loading') ?? 'Signing in…'
							: t('submitButton')}
					</Button>

					<p className="text-sm text-center text-muted-foreground">
						{t('noAccount')}{' '}
						<Link
							href={`/${locale}/auth/register`}
							className="underline hover:text-foreground"
						>
							{t('signupLink')}
						</Link>
					</p>
				</CardFooter>
					</Card>
				</div>
			</div>
		</div>
	)
}
