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
			<div className="tl-papyrus-scroll w-full max-w-5xl">
				<div className="tl-papyrus-sheet px-5 py-7 md:px-8 md:py-8">
					<div className="tl-vellum-panel flex flex-col items-center rounded-[2rem] px-6 py-8 text-center md:px-10 md:py-10">
						<p className="font-nunito text-[1.35rem] leading-none text-[#6f5546] md:text-[1.5rem]">
							TorahLev
						</p>
						<h1 className="font-cardo mt-3 text-4xl leading-tight font-semibold text-[#2f1b12] md:text-6xl">
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
		</div>
	)
}
