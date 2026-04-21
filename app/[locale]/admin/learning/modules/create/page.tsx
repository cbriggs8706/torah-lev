import { ModuleEditorForm } from '@/components/admin/learning/ModuleEditorForm'
import { supabaseDb as db } from '@/db'

export default async function CreateModulePage({
	params,
}: {
	params: Promise<{ locale: string }>
}) {
	const { locale } = await params
	const [mediaAssets, quizzes, lessons] = await Promise.all([
		db.query.mediaAssets.findMany({
			orderBy: (mediaAssets, { asc }) => [
				asc(mediaAssets.kind),
				asc(mediaAssets.title),
				asc(mediaAssets.fileName),
			],
		}),
		db.query.quizzes.findMany({
			orderBy: (quizzes, { asc }) => [asc(quizzes.title)],
		}),
		db.query.lessons.findMany({
			orderBy: (lessons, { asc }) => [
				asc(lessons.sortOrder),
				asc(lessons.number),
				asc(lessons.title),
			],
		}),
	])

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Create Module
				</h1>
			</div>
			<ModuleEditorForm
				locale={locale}
				mode="create"
				mediaAssets={mediaAssets.map((asset) => ({
					id: asset.id,
					kind: asset.kind,
					label: asset.title || asset.fileName,
				}))}
				quizzes={quizzes}
				lessons={lessons}
			/>
		</div>
	)
}
