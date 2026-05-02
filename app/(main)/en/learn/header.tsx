import Link from 'next/link'

type Props = {
	title: string
}

export const EnglishHeader = ({ title }: Props) => {
	return (
		<div className="sticky top-0 z-30 mb-5 flex items-center justify-between border-b-2 bg-white pb-3 text-neutral-400">
			<Link href="/courses">
				{/* <Button variant="ghost" size="sm">
          <ArrowLeft className="h-5 w-5 stroke-2 text-neutral-400" />
        </Button> */}
			</Link>
			<h1 className="font-bold text-lg">{title}</h1>
			<div />
		</div>
	)
}
