import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getGreekLessonScript } from '@/db/queries'
import GreekLessonScriptViewer from '@/components/greek/greek-lesson-script-viewer'

export default async function GreekLessonScriptPage({ params }: any) {
	const { id } = await params
	const lessonScript = await getGreekLessonScript(Number(id))

	if (!lessonScript) return notFound()

	// console.log('HERE>>>>', lessonScript)

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
				<GreekLessonScriptViewer lessonScript={lessonScript} />
			</FeedWrapper>
		</div>
	)
}
