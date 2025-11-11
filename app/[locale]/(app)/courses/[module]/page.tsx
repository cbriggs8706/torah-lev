interface CoursePageProps {
	params: Promise<{ locale: string; course: string }>
}

export default async function CoursePage({ params }: CoursePageProps) {
	const { locale, course } = await params

	return (
		<div>
			<h1 className="text-3xl font-bold capitalize">
				{course.replace('-', ' ')}
			</h1>

			<p className="text-gray-600 mt-2">Course detail page ({locale})</p>
		</div>
	)
}
