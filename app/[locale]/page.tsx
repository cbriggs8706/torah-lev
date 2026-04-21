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
		<div className="flex min-h-screen items-center justify-center px-4 py-10">
			<div className="tl-scroll-stage w-full max-w-5xl rounded-[2.4rem]">
				<div className="tl-scroll-body flex flex-col items-center px-6 py-10 text-center md:px-12 md:py-14">
					<p className="tl-kicker">TorahLev</p>
					<h1 className="tl-heading mt-3 text-4xl font-semibold md:text-6xl">
						{t('welcomeTL')}
					</h1>
					<p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
						A sacred study sanctuary in crimson, parchment, and gentle progress.
					</p>
					<p className="mt-2 text-sm text-muted-foreground">
						{t('construction')}
					</p>

					<div className="mt-6 flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2">
						<span className={`fi ${LANGUAGES[locale]?.flag ?? ''} text-xl`} />
						<LanguageSwitcher locale={locale} />
					</div>

					<div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
						<Link href={`/${locale}/register`}>
							<TLButton variant="outline">{t('register')}</TLButton>
						</Link>
						<Link href={`/${locale}/login`}>
							<TLButton variant="outline">{t('login')}</TLButton>
						</Link>
						<Link href={`/${locale}/dashboard`}>
							<TLButton variant="outline">{t('guest')}</TLButton>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
