import Image from 'next/image'
import { FeedWrapper } from '@/components/feed-wrapper'
import { notFound } from 'next/navigation'
import { getHebrewLessonScript } from '@/db/queries'
import LessonScriptViewer from '@/components/hebrew/hebrew-lesson-script-viewer'

export default async function HebrewLessonScriptPage({
	params,
}: {
	params: { id: string }
}) {
	const lessonScript = await getHebrewLessonScript(Number(params.id))

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
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						תַּסְרִיט שִׁעוּר
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Lesson Script
					</p>
				</div>
				<LessonScriptViewer lessonScript={lessonScript} />
			</FeedWrapper>
		</div>
	)
}
