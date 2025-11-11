import { getTranslations } from 'next-intl/server'

export default async function HomePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'common' })

	return (
		<div className="p-6 space-y-2">
			{/* ✅ Strings only */}
			<h1 className="text-2xl font-bold mb-4">{t('welcome')}</h1>

			{/* ✅ Example of listing translation values safely */}
			<ul className="list-disc list-inside">
				<li>{t('startLesson')}</li>
				<li>{t('continue')}</li>
				<li>{t('settings')}</li>
				<li>{t('switchLanguage')}</li>
			</ul>
		</div>
	)
}
