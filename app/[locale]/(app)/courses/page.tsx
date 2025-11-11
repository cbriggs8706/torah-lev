import { getTranslations } from 'next-intl/server'

interface CoursesPageProps {
	params: Promise<{ locale: string }>
}

export default async function CoursesPage({ params }: CoursesPageProps) {
	const { locale } = await params
	const t = await getTranslations({ locale, namespace: 'courses' })
	const courses = ['bh', 'bg', 'mh', 'me', 'ms']

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">{t('title')}</h1>

			<ul className="space-y-3">
				{courses.map((id) => (
					<li key={id} className="border rounded p-4 bg-white shadow-sm">
						<a
							href={`/${locale}/courses/${id}`}
							className="block text-lg font-medium text-blue-700 hover:underline"
						>
							{t(`list.${id}`)}
						</a>
					</li>
				))}
			</ul>
		</div>
	)
}
