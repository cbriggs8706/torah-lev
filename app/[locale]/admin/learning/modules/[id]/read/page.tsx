import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { LearningPageActions } from '@/components/admin/learning/LearningPageActions'
import { ModuleEditorForm } from '@/components/admin/learning/ModuleEditorForm'
import { supabaseDb as db } from '@/db'
import { modules } from '@/db/schema/tables/modules'

export default async function ReadModulePage({
	params,
}: {
	params: Promise<{ locale: string; id: string }>
}) {
	const { locale, id } = await params
	const [module, mediaAssets, quizzes, lessons] = await Promise.all([
		db.query.modules.findFirst({
			where: eq(modules.id, id),
			with: {
				lessonAssignments: true,
			},
		}),
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
				asc(lessons.number),
				asc(lessons.title),
			],
		}),
	])

	if (!module) notFound()

	return (
		<div className="space-y-6">
			<div>
				<p className="text-sm uppercase tracking-[0.28em] text-muted-foreground">
					Learning
				</p>
				<h1 className="mt-2 font-[family:var(--font-eczar)] text-4xl">
					Read Module
				</h1>
			</div>
			<ModuleEditorForm
				locale={locale}
				mode="read"
				showFooterActions={false}
				initialModule={{
					id: module.id,
					title: module.title,
					type: module.type,
					mediaAssetId: module.mediaAssetId,
					externalUrl: module.externalUrl ?? '',
					quizId: module.quizId,
					lessonIds: module.lessonAssignments.map((item) => item.lessonId),
				}}
				mediaAssets={mediaAssets.map((asset) => ({
					id: asset.id,
					kind: asset.kind,
					label: asset.title || asset.fileName,
				}))}
				quizzes={quizzes}
				lessons={lessons}
			/>
			<LearningPageActions
				backHref={`/${locale}/admin/learning/modules`}
				backLabel="Back to modules"
			updateHref={`/${locale}/admin/learning/modules/${id}/update`}
			deleteHref={`/${locale}/admin/learning/modules/${id}/delete`}
				deleteLabel={module.title}
			/>
		</div>
	)
}
