import { ReactNode } from 'react'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { LOCALES, type Locale } from '@/i18n/config'
import { LANGUAGES } from '@/i18n/languages'
import { LanguageSwitcher } from '@/components/language-switcher'

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
			<div className="flex items-center gap-3 p-4">
				<span className={`fi ${LANGUAGES[locale].flag} text-xl`} />
				<LanguageSwitcher locale={locale} />
			</div>

			<NextIntlClientProvider messages={messages} locale={locale}>
				{children}
			</NextIntlClientProvider>
		</>
	)
}
