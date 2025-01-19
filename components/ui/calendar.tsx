import Image from 'next/image'

export const Calendar = () => {
	return (
		<div className="border-2 rounded-xl p-4 space-y-4">
			<div className="flex items-center justify-between w-full space-y-2">
				<h3 className="font-bold text-lg">Upcoming Classes</h3>
			</div>
			{/* <ul className="w-full space-y-4">
				<li className="flex flex-row">
					<Image
						src="/is.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">Beginner: Sun Sep 8 - Lesson 6</span>
				</li>
				<li className="flex flex-row">
					<Image
						src="/is.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">Beginner: Mon Sep 9 - Lesson 7</span>
				</li>
				<li className="flex flex-row">
					<Image
						src="/mx.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">Intermediate: Tue Sep 10 - Lesson 3</span>
				</li>
				<hr />
				<li className="flex flex-row">
					<Image
						src="/is.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">Beginner: Sun Sep 15 - Lesson 7</span>
				</li>
				<li className="flex flex-row">
					<Image
						src="/is.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">Beginner: Mon Sep 16 - Skip Week</span>
				</li>
				<li className="flex flex-row">
					<Image
						src="/mx.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">Intermediate: Tue Sep 17 - Lesson 4</span>
				</li>
				<hr />
				<li className="flex flex-row">
					<Image
						src="/is.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">
						Sundays 5pm - 10 Week Beginner Hebrew Alphabet Starts September 29
						at BFSC
					</span>
				</li>
				<li className="flex flex-row">
					<Image
						src="/mx.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">
						Thursdays 5pm - 10 Week Super Beginner Spanish Starts October 3 at
						BFSC
					</span>
				</li>
				<li className="flex flex-row">
					<Image
						src="/us.svg"
						className="mr-2 w-10"
						alt="icon"
						width={40}
						height={20}
					/>
					<span className="my-auto">
						Martes y Jueves 6:30pm - English Connect 1 & 2 Empieza por Noviembre
						@ Community Council of Idaho
					</span>
				</li>
			</ul> */}
		</div>
	)
}
