// app/[locale]/layout.tsx
import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { LOCALES, type Locale } from '@/i18n/config'
import { NextAuthProvider } from '../providers/session-provider'

export default async function LocaleLayout({
	children,
	params,
}: {
	children: ReactNode
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	if (!LOCALES.includes(locale as Locale)) notFound()

	const messages = await getMessages({ locale })

	return (
		<>
			<NextIntlClientProvider messages={messages} locale={locale}>
				<NextAuthProvider>{children}</NextAuthProvider>
			</NextIntlClientProvider>
		</>
	)
}
