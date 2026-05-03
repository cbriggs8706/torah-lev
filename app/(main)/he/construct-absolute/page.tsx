import Image from 'next/image'
import Link from 'next/link'

import { DismissibleAlert } from '@/components/dismissible-alert'
import { FeedWrapper } from '@/components/feed-wrapper'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'

export default function HebrewConstructAbsolutePage() {
	return (
		<div className="flex flex-row-reverse gap-[48px] px-6">
			<FeedWrapper>
				<div className="w-full flex flex-col items-center">
					<Image
						src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
						alt="Construct"
						height={90}
						width={90}
					/>
					<h1 className="text-center font-cardo text-neutral-800 text-6xl my-6">
						נִסְמָךְ וּמוּחְלָט
					</h1>
					<p className="text-center font-bold text-neutral-800 mb-2">
						Construct
					</p>

					<DismissibleAlert
						storageKey="construct-absolute-topic"
						className="mb-6 max-w-3xl"
					>
						This grammar topic will hold multiple practice activities. Start
						with the word sort, and future construct-vs-absolute games can live
						here without changing the sidebar structure again.
					</DismissibleAlert>

					<div className="grid w-full max-w-4xl gap-5 md:grid-cols-2">
						<Card className="border-sidebar-border bg-white/85 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											מִיּוּן מִלִּים
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Word Sort
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									Drag each Hebrew form into the correct zone: absolute or
									construct. It&apos;s a quick way to train your eye to spot the
									form before reading the whole phrase.
								</p>
								<Button asChild variant="primary" className="w-full">
									<Link href="/he/construct-absolute/word-sort">
										Start Word Sort
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border-sidebar-border bg-white/85 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											הֲמָרָה
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Conversion Game
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									Start with an absolute form and tap the changing part of the
									word until you think you&apos;ve built the correct construct
									form. Then submit to check yourself.
								</p>
								<Button asChild variant="primary" className="w-full">
									<Link href="/he/construct-absolute/conversion">
										Start Conversion Game
									</Link>
								</Button>
							</CardContent>
						</Card>

						<Card className="border-sidebar-border bg-white/85 shadow-sm md:col-span-2">
							<CardHeader className="space-y-3">
								<div className="flex items-center gap-3">
									<div className="rounded-2xl bg-sidebar-accent/70 p-3">
										<Image
											src="/construction-worker-medium-skin-tone-svgrepo-com.svg"
											alt=""
											aria-hidden="true"
											width={34}
											height={34}
										/>
									</div>
									<div>
										<CardTitle className="text-2xl font-cardo text-neutral-800">
											זִהוּי צוּרָה
										</CardTitle>
										<CardDescription className="text-sm font-semibold text-neutral-600">
											Identify The Form
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-5">
								<p className="text-sm leading-6 text-neutral-700">
									See one Hebrew word at a time and decide whether it is an
									absolute form or a construct form. This keeps the practice
									simple and fast, like the site&apos;s other quiz activities.
								</p>
								<Button asChild variant="primary" className="w-full md:w-auto">
									<Link href="/he/construct-absolute/identify-form">
										Start Identify The Form
									</Link>
								</Button>
							</CardContent>
						</Card>
					</div>
				</div>
			</FeedWrapper>
		</div>
	)
}
