import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getEnglishLessonScript } from '@/db/queries'
import LessonScriptViewer from '@/components/english/english-lesson-script-viewer'

export const dynamic = 'force-dynamic' // 👈 ensures fresh fetch

export default async function EnglishLessonScriptPage({ params }: any) {
	const { id } = await params
	const lessonScript = await getEnglishLessonScript(Number(id))

	if (!lessonScript) return notFound()

	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/spiral-notepad-svgrepo-com.svg"
						alt="Lesson Script"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-bold text-neutral-800 text-2xl my-6">
						Lesson Script
					</h1>
				</div>
				<LessonScriptViewer lessonScript={lessonScript} />
			</FeedWrapper>
		</div>
	)
}
