import { TLButton } from '@/components/custom/tl-button'
import { LanguageSwitcher } from '@/components/language-switcher'
import { LANGUAGES } from '@/i18n/languages'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function Page({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	return (
		<div className="flex text-center justify-center flex-col w-full h-screen my-auto">
			<h1 className="text-2xl font-bold mb-4">{t('welcomeTL')}</h1>
			<p>{t('construction')}</p>

			<div className="flex items-center gap-3 p-4 mx-auto">
				<span className={`fi ${LANGUAGES[locale]?.flag ?? ''} text-xl`} />
				<LanguageSwitcher locale={locale} />
			</div>

			<div className="flex flex-col gap-4 mt-8 items-center">
				<Link href={`/${locale}/register`}>
					<TLButton variant="outline">{t('register')}</TLButton>
				</Link>
				<Link href={`/${locale}/login`}>
					<TLButton variant="outline">{t('login')}</TLButton>
				</Link>
				<Link href={`/${locale}/courses`}>
					<TLButton variant="outline">{t('guest')}</TLButton>
				</Link>
			</div>
		</div>
	)
}
