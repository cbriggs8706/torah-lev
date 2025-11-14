import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCourseById } from '@/db/queries/courses'
import { redirect, notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'

type PageProps = {
	params: Promise<{ locale: string; id: string }>
}

export default async function DeleteCoursePage({ params }: PageProps) {
	const { locale, id } = await params

	const session = await getServerSession(authOptions)
	if (!session || !session.user) redirect(`/${locale}/login`)

	const course = await getCourseById(id)
	if (!course) notFound()

	async function handleDelete() {
		'use server'
		await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/courses/${id}`, {
			method: 'DELETE',
		})
		redirect(`/${locale}/admin/course`)
	}

	return (
		<div className="max-w-xl mx-auto space-y-6 mt-10">
			<h1 className="text-2xl font-bold">Delete Course</h1>

			<p>
				Are you sure you want to delete <strong>{course.slug}</strong>? This
				action cannot be undone.
			</p>

			<form action={handleDelete}>
				<Button variant="destructive">Delete Course</Button>
			</form>
		</div>
	)
}
