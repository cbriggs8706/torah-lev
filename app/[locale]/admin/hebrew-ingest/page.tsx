// app/[locale]/admin/hebrew-ingest/page.tsx
import { IngestHebrewForm } from '@/components/admin/IngestHebrewForm'
import { getAllBooks } from '@/db/queries/hebrew-reader'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

interface PageProps {
	params: Promise<{ locale: string }>
}

export default async function HebrewIngestPage({ params }: PageProps) {
	const { locale } = await params
	const session = await getServerSession(authOptions)
	if (!session || !session.user) redirect(`/${locale}/login`)

	const books = await getAllBooks()

	return (
		<div className="px-6 py-8 max-w-4xl mx-auto">
			<h1 className="text-3xl font-bold mb-6">Add Hebrew Chapter</h1>
			<IngestHebrewForm books={books} />
		</div>
	)
}
