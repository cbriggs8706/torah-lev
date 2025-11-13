interface DashboardPageProps {
	params: Promise<{ locale: string }>
}

export default async function Page({ params }: DashboardPageProps) {
	const { locale } = await params

	return (
		<div className="space-y-4">
			<h1 className="text-3xl font-bold">Admin Dashboard</h1>

			<p className="text-gray-600">Choose a course to begin learning.</p>

			<a
				href={`/${locale}/courses`}
				className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
			>
				View Courses
			</a>
		</div>
	)
}
